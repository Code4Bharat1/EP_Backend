import {
  Pdf,
  Question,
  Option,
  Diagram,
  Solution
} from "../models/everytestmode.refrence.js";
import levenshtein from "fast-levenshtein";
import jwt from "jsonwebtoken";
import MeTest from '../models/saved.js';
import config from "config";
import fs from 'fs';
import path from 'path';
function loadJsonData() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'neet_topics.json'); // adjust if needed
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error("Error loading JSON file:", error.message);
    return null;
  }
}

const fetchQuestions = async (req, res) => {
  try {
    const { selectedSubjects, selectedChapters, numQuestions } = req.body;
    console.log("Requested number of questions:", selectedChapters);

    const jsonData = loadJsonData();
    if (!jsonData) {
      return res.status(500).json({ error: "Failed to load JSON data." });
    }

    const distribution = {};
    const subjectChapterPairs = [];

    // Build Subject-Chapter Pairs
    for (const subject of selectedSubjects) {
  const chapters = selectedChapters[subject];

  // Defensive: ensure chapters is an array before iterating
  if (!Array.isArray(chapters) || chapters.length === 0) {
    console.warn(`No chapters provided for subject ${subject}`);
    continue; // skip this subject
  }

  for (const chapter of chapters) {
    const chapterName = chapter.name.toLowerCase().trim();
    subjectChapterPairs.push({ subject, chapter: chapterName });
  }
}

    console.log("Subject-Chapter Pairs:", subjectChapterPairs);

    // Build JSON-based chapter-topicId map
    const jsonPdfMap = {}; // key: subject||chapter => [topic_id, ...]
    for (const subject of selectedSubjects) {
      const subjectData = jsonData[subject];
      if (!subjectData) continue;

      for (const [chapterName, topicsArray] of Object.entries(subjectData)) {
        if (Array.isArray(topicsArray)) {
          const key = `${subject.toLowerCase()}||${chapterName.toLowerCase().trim()}`;
          const topicIds = topicsArray.map(topic => topic.topic_id);
          jsonPdfMap[key] = topicIds;
        }
      }
    }

    // Fuzzy match chapter names with JSON keys
    const findClosestMatch = (subject, chapter) => {
      let closestMatch = null;
      let closestDistance = Infinity;
      const subjectData = jsonData[subject];
      if (!subjectData) return null;

      for (const dbChapter of Object.keys(subjectData)) {
        const dbChapterTrimmed = dbChapter.toLowerCase().trim();
        const distance = levenshtein.get(chapter, dbChapterTrimmed);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestMatch = dbChapterTrimmed;
        }
      }
      return closestMatch;
    };

    for (const { subject, chapter } of subjectChapterPairs) {
      const closestMatch = findClosestMatch(subject, chapter);
      const key = `${subject.toLowerCase()}||${closestMatch || chapter}`;
      const pdf_ids = jsonPdfMap[key] || [];

      if (!distribution[subject]) distribution[subject] = {};
      distribution[subject][chapter] = { pdf_ids };
    }

    const questionsWithOptions = [];

    // Fetch questions based on ALL topic_ids under the chapter
    for (const [subject, chapters] of Object.entries(distribution)) {
      for (const [chapter, details] of Object.entries(chapters)) {
        const { pdf_ids } = details;
        if (pdf_ids.length === 0) continue;

        // Fetch ALL questions from all topic_ids under this chapter
        const fetchedQuestions = await Question.findAll({
          where: { pdf_id: pdf_ids },
          include: [
            { model: Option, as: "options" },
            { model: Diagram, required: false },
          ],
        });

        // Shuffle and select exactly `numQuestions` per chapter
        const shuffled = fetchedQuestions.sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, numQuestions);

        // Log if insufficient questions for monitoring
        if (selectedQuestions.length < numQuestions) {
          console.warn(`Only ${selectedQuestions.length} questions found for ${subject} - ${chapter}. Requested: ${numQuestions}`);
        }

        for (let question of selectedQuestions) {
          const options = question.options.map(opt => opt.dataValues);
          const correctOption = options.find(opt => opt.is_correct);

          const diagramPath =
            question.Diagrams?.length > 0
              ? question.Diagrams[0].dataValues.diagram_path
              : null;

          questionsWithOptions.push({
            question: {
              ...question.dataValues,
              subject,
              chapter,
            },
            options,
            correctAnswer: correctOption,
            diagram: diagramPath,
          });
        }
      }
    }

    if (questionsWithOptions.length === 0) {
      return res.status(404).json({
        error: "No questions found based on the selected subjects and chapters.",
      });
    }

    return res.status(200).json({ questions: questionsWithOptions });
  } catch (error) {
    console.error("Error fetching questions:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const submitTest = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ error: "Unauthorized: No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token)
      return res
        .status(401)
        .json({ error: "Unauthorized: Invalid token format" });

    const secret = config.get("jwtSecret");
    let studentId;
    try {
      const decoded = jwt.verify(token, secret);
      studentId = decoded.id;
    } catch (err) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Invalid or expired token" });
    }

    const {
      correctAnswers = [],
      wrongAnswers = [],
      notAttempted = [],
      total_marks,
      startTime,
      endTime,
      selectedChapters = {},
      testName = [],
      pdf_id = null,
      subjectWiseMarks,
      totalTimePerSubject, // Get the total time per subject
    } = req.body;

    const totalQuestions =
      correctAnswers.length + wrongAnswers.length + notAttempted.length;

    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    let score = 0;

    const finalAnswers = {};

    // Process correct answers
    correctAnswers.forEach(([questionId, subject, chapter, selectedOption, correctOption, marks, timeSpent]) => {
      if (!subject || !chapter) return;

      // Increment the count for correct answers
      correct++;
      score += marks || 0;
      finalAnswers[questionId] = selectedOption;
    });

    // Process wrong answers
    wrongAnswers.forEach(([questionId, subject, chapter, selectedOption, correctOption, marks, timeSpent]) => {
      if (!subject || !chapter) return;

      // Increment the count for incorrect answers
      incorrect++;
      score -= 1;
      finalAnswers[questionId] = selectedOption;
    });

    // Process not attempted answers
    notAttempted.forEach(([questionId, subject, chapter]) => {
      if (!subject || !chapter) return;

      // Increment the count for unattempted answers
      unattempted++;
      finalAnswers[questionId] = null;
    });

    // Calculate the marks obtained
    const marksObtained = parseFloat(total_marks) || 0;
    const totalMarks = 720;

    // Store the test result in the database
    const newTest = await MeTest.create({
      studentId,
      testName,
      selectedChapters,
      difficultyLevel: "Medium", // Assuming Medium is default
      status: "completed",
      answers: finalAnswers,
      score,
      correct,
      incorrect,
      unattempted,
      totalQuestions,
      overAllMarks: score,
      subjectWiseMarks,
      pdf_id,
      totalTimePerSubject, // Save the total time spent per subject
    });

    res.status(201).json({
      message: "✅ Test submitted successfully!",
      testId: newTest.id,
    });
  } catch (error) {
    console.error("❌ Error submitting MeTest:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSolutions = async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Invalid input: questions must be an array and not empty.' });
    }

    const questionIds = [];

    // Fetch question_ids using question text
    for (const questionObj of questions) {
      const questionText = questionObj.question;
      const question = await Question.findOne({
        where: { question_text: questionText },
        attributes: ['id'], 
      });

      if (question) {
        questionIds.push(question.id);
      }
    }


    if (questionIds.length === 0) {
      return res.status(404).json({ error: 'No matching questions found.' });
    }

    // Fetch solution_text for the provided questionIds
    const solutions = await Solution.findAll({
      where: { question_id: questionIds },
      attributes: ['question_id', 'solution_text'],
    });

    if (solutions.length === 0) {
      return res.status(404).json({ error: 'No solutions found for the provided question IDs.' });
    }

    // Return the solution_texts for each question_id
    const solutionMap = solutions.reduce((acc, solution) => {
      acc[solution.question_id] = solution.solution_text;
      return acc;
    }, {});

    res.status(200).json({ solutions: solutionMap });
  } catch (error) {
    console.error("Error fetching solutions:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const viewAnalytics = async (req, res) => {
  try {
    // Decode the token to get user information (same logic as before)
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const secret = config.get("jwtSecret");
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(403).json({ error: "Unauthorized: Invalid or expired token" });
    }

    const userId = decoded.id;

    // Fetch test data for the user from the MeTest model, including 'testName' and 'subjectWiseMarks'
    const testData = await MeTest.findAll({
      where: { studentId: userId },
      attributes: ['testName', 'subjectWiseMarks'], // Fetching only 'testName' and 'subjectWiseMarks'
    });

    if (testData.length === 0) {
      return res.status(404).json({ error: "No tests found for this user" });
    }

    // Initialize an array to hold the test analytics
    const testAnalytics = testData.map((test) => {
      try {
        let subjectWiseMarks = test.subjectWiseMarks;

        // If subjectWiseMarks is a string (JSON format), parse it
        if (typeof subjectWiseMarks === 'string') {
          subjectWiseMarks = JSON.parse(subjectWiseMarks);
        }


        // Prepare the test analytics data
        return {
          testName: test.testName,
          subjectWiseMarks,
        };
      } catch (parseError) {
        // Handle case if JSON parsing fails
        console.error(`Failed to parse subjectWiseMarks for test ${test.testName}:`, parseError);
        return null; // Return null for any parsing errors
      }
    }).filter(test => test !== null); // Filter out any null values resulting from parsing errors

    if (testAnalytics.length === 0) {
      return res.status(404).json({ error: "No valid test data found for this user" });
    }

    // Return the test analytics
    res.status(200).json({ testAnalytics });
  } catch (error) {
    console.error("Error fetching test data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export { fetchQuestions, submitTest, getSolutions, viewAnalytics };
