import fullTestResults from "../models/fullTestResults.model.js";
import { Solution, Question } from "../models/everytestmode.refrence.js"; // ✅ Import the correct Questions table model
import jwt from "jsonwebtoken";
import config from "config";

const submitTest = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Invalid token format" });
    }
    // ✅ Verify and Decode Token
    const secret = config.get("jwtSecret");
    let studentId;
    try {
      const decoded = jwt.verify(token, secret);
      studentId = decoded.id; // Extract student ID from token
    } catch (err) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Invalid or expired token" });
    }
    console.log("✅ Student ID extracted:", studentId); // Debugging log
    // ✅ Extract test submission data from request body
    const {
      correctAnswers = [],
      wrongAnswers = [],
      notAttempted = [],
      startTime,
      endTime,
      total_marks,
    } = req.body;

    if (!correctAnswers || !wrongAnswers || !notAttempted) {
      return res.status(400).json({ error: "Missing required answer data." });
    }

    if (
      !startTime ||
      !endTime ||
      isNaN(new Date(startTime)) ||
      isNaN(new Date(endTime))
    ) {
      return res
        .status(400)
        .json({ error: "Invalid start or end time format." });
    }
    const totalQuestions =
      correctAnswers.length + wrongAnswers.length + notAttempted.length;
    const correctAnswersCount = correctAnswers.length;
    const wrongAnswersCount = wrongAnswers.length;
    const notAttemptedCount = notAttempted.length;
    console.log("✅ Total Questions:", totalQuestions);
    let subjectWisePerformance = [];
    let chapterWisePerformance = [];
    correctAnswers.forEach(
      ([
        questionId,
        subject,
        chapter,
        selectedOption,
        correctOption,
        marks,
        timeSpent,
      ]) => {
        if (!subject || !chapter) return;

        // Update subject-wise performance
        let existingSubject = subjectWisePerformance.find(
          (s) => s[0] === subject
        );
        if (!existingSubject) {
          existingSubject = [subject, 0, 0, 0, 0];
          subjectWisePerformance.push(existingSubject);
        }
        existingSubject[1] += 1;
        existingSubject[4] += marks || 0;
        let existingChapter = chapterWisePerformance.find(
          (c) => c[0] === chapter
        );
        if (!existingChapter) {
          existingChapter = [chapter, 0, 0, 0]; // ["chapter", correct, incorrect, marks]
          chapterWisePerformance.push(existingChapter);
        }

        existingChapter[1] += 1; // Increment correct
        existingChapter[3] += marks || 0; // Increment marks
      }
    );

    // ✅ Process incorrect answers
    wrongAnswers.forEach(
      ([
        questionId,
        subject,
        chapter,
        selectedOption,
        correctOption,
        marks,
        timeSpent,
      ]) => {
        if (!subject || !chapter) return;

        let existingSubject = subjectWisePerformance.find(
          (s) => s[0] === subject
        );
        if (!existingSubject) {
          existingSubject = [subject, 0, 0, 0, 0]; // ["subject", correct, incorrect, notAttempted, marks]
          subjectWisePerformance.push(existingSubject);
        }
        existingSubject[2] += 1; // Increment incorrect
        existingSubject[4] += marks || 0; // Increment marks

        let existingChapter = chapterWisePerformance.find(
          (c) => c[0] === chapter
        );
        if (!existingChapter) {
          existingChapter = [chapter, 0, 0, 0]; // ["chapter", correct, incorrect, marks]
          chapterWisePerformance.push(existingChapter);
        }

        existingChapter[2] += 1; // Increment incorrect
        existingChapter[3] += marks || 0; // Increment marks
      }
    );

    // ✅ Process unattempted questions
    notAttempted.forEach(([questionId, subject, chapter]) => {
      if (!subject || !chapter) return;

      let existingSubject = subjectWisePerformance.find(
        (s) => s[0] === subject
      );
      if (!existingSubject) {
        existingSubject = [subject, 0, 0, 0, 0]; 
        subjectWisePerformance.push(existingSubject);
      }
      existingSubject[3] += 1; // Increment notAttempted
      let existingChapter = chapterWisePerformance.find(
        (c) => c[0] === chapter
      );
      if (!existingChapter) {
        existingChapter = [chapter, 0, 0, 0]; // ["chapter", correct, incorrect, marks]
        chapterWisePerformance.push(existingChapter);
      }
    });

    // ✅ Calculate marks obtained correctly
    const marksObtained = parseFloat(total_marks) || 0;
    const totalMarks = 720; // ✅ Always set Total Marks to 720

    // ✅ Fetch detailed answers from solutions table
    const questionIds = [
      ...correctAnswers.map((q) => q[0]), // Extract question_id from the new format
      ...wrongAnswers.map((q) => q[0]),
      ...notAttempted.map((q) => q[0]),
    ];

    // ✅ Fetch solutions from the Solution table based on question IDs
    const solutions = await Solution.findAll({
      where: { question_id: questionIds },
      attributes: ["question_id", "solution_text"],
    });

    // ✅ Map solutions to detailed answers correctly (convert to 2D array [questionId, solutionText])
    const detailedAnswers = questionIds.map((question_id) => {
      const solution = solutions.find((s) => s.question_id === question_id);
      return [
        question_id,
        solution ? solution.solution_text : "Solution not available",
      ];
    });
    // ✅ Store the test result in the database
    const newTestResult = await fullTestResults.create({
      studentId,
      testName: "Full Test",
      difficultyLevel: "Simple",
      recommendedBy: "Start Test",
      status: "Completed",
      createdAt: new Date(startTime),
      updatedAt: new Date(endTime),
      totalQuestions,
      correctAnswers, // Store directly as array
      wrongAnswers,
      notAttempted,
      correctAnswersCount,
      wrongAnswersCount,
      notAttemptedCount,
      marksObtained,
      totalMarks,
      subjectWisePerformance: JSON.stringify(subjectWisePerformance), // Now in array format
      chapterWisePerformance: JSON.stringify(chapterWisePerformance), // Now in array format
      detailedAnswers: JSON.stringify(detailedAnswers), // Now in 2D array format [questionId, solutionText]
    });

    res.status(201).json({
      message: "✅ Test submitted successfully!",
      testResult: newTestResult,
    });
  } catch (error) {
    console.error("❌ Error submitting test:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

const getResults = async (req, res) => {
  try {
    // ✅ Extract Student ID from Request
    const studentId = req.user.id;
    console.log("✅ Fetching results for Student ID:", studentId);

    // ✅ Fetch Latest Test Result for the Student
    const testResult = await fullTestResults.findOne({
      where: { studentId },
      order: [["createdAt", "DESC"]], // Fetch the most recent test
      attributes: [
        "marksObtained",
        "totalMarks",
        "correctAnswersCount",
        "wrongAnswersCount",
        "notAttemptedCount",
        "totalQuestions",
        "subjectWisePerformance",
        "chapterWisePerformance",
        "detailedAnswers",
        "id",
      ],
    });

    // const testnewid = JSON.parse(testResult)
    // console.log(`this is the test data juned ${testnewid}`);

    // ✅ Handle No Test Results Found
    if (!testResult) {
      console.warn("⚠️ No test results found for Student ID:", studentId);
      return res.status(404).json({ error: "No test results found." });
    }

    // ✅ Parse JSON Fields to Ensure Proper Format
    const subjectWisePerformance = JSON.parse(
      testResult.subjectWisePerformance || "{}"
    );
    const chapterWisePerformance = JSON.parse(
      testResult.chapterWisePerformance || "{}"
    );
    const detailedAnswers = JSON.parse(testResult.detailedAnswers || "[]");

    // ✅ Prepare Response Data
    const responseData = {
      marksObtained: testResult.marksObtained,
      totalMarks: testResult.totalMarks,
      correctAnswers: testResult.correctAnswersCount, // Now as an integer
      wrongAnswers: testResult.wrongAnswersCount, // Now as an integer
      notAttempted: testResult.notAttemptedCount, // Now as an integer
      totalQuestions: testResult.totalQuestions,
      subjectWisePerformance,
      chapterWisePerformance,
      detailedAnswers,
      testResult,
    };

    console.log("✅ Test Results Fetched Successfully!");

    // ✅ Send Response
    res.status(200).json({
      message: "✅ Test results fetched successfully!",
      testResult: responseData,
    });
  } catch (error) {
    console.error("❌ Error fetching test results:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

const getReviewMistakes = async (req, res) => {
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

    console.log("✅ Student ID extracted:", studentId);

    const { testId } = req.query;
    if (!testId)
      return res.status(400).json({ error: "Missing testId in request." });

    const testResult = await fullTestResults.findOne({
      where: { id: testId, studentId },
      attributes: [
        "correctAnswers",
        "wrongAnswers",
        "notAttempted",
        "detailedAnswers",
      ],
    });

    if (!testResult) {
      return res
        .status(404)
        .json({ error: "No test results found for the given testId." });
    }

    const correctAnswers = JSON.parse(testResult.correctAnswers || "[]");
    const wrongAnswers = JSON.parse(testResult.wrongAnswers || "[]");
    const notAttempted = JSON.parse(testResult.notAttempted || "[]");
    const detailedAnswers = JSON.parse(testResult.detailedAnswers || "[]");

    // Fetch questions for correct, wrong, and unattempted answers
    const questionIds = [
      ...correctAnswers.map((q) => q[0]),
      ...wrongAnswers.map((q) => q[0]),
      ...notAttempted.map((q) => q[0]),
    ];

    const questions = await Question.findAll({
      where: { id: questionIds },
      attributes: ["id", "question_text"],
    });

    // Fetch solutions for the questionIds to get the explanations
    const solutions = await Solution.findAll({
      where: { question_id: questionIds },
      attributes: ["question_id", "solution_text"],
    });

    // Create a question map for easy access
    const questionMap = {};
    questions.forEach((question) => {
      questionMap[question.id] = {
        questionText: question.question_text,
      };
    });

    // Create a solution map for easy access to explanations
    const solutionMap = {};
    solutions.forEach((solution) => {
      solutionMap[solution.question_id] = solution.solution_text;
    });

    // Format answers with the new explanation source
    const formatAnswers = (answers) =>
      answers.map((answer) => {
        const question = questionMap[answer[0]];

        // Fetch explanation from solutionMap
        const explanation =
          solutionMap[answer[0]] || "Explanation not available";

        // Assuming the format [questionId, yourAnswer, ...]
        const yourAnswer = answer[3] || "Answer not available"; // yourAnswer is at index 3
        const correctAnswer = answer[4] || "Answer not available"; // correctAnswer is at index 4
        const timeSpent = answer[6] || "Time not recorded"; // Assuming timeSpent is at index 6

        console.log({
          questionId: answer[0],
          questionText: question ? question.questionText : "Question not found",
          yourAnswer: yourAnswer,
          correctAnswer: correctAnswer,
          explanation: explanation,
          timeSpent: timeSpent,
        });

        return {
          questionId: answer[0],
          questionText: question ? question.questionText : "Question not found",
          yourAnswer: yourAnswer, // Answer selected by student
          correctAnswer: correctAnswer, // Correct answer from the array
          explanation: explanation, // Explanation from Solution table
          timeSpent: timeSpent, // timeSpent from the answer array
        };
      });

    const responseData = {
      correctAnswers: formatAnswers(correctAnswers),
      wrongAnswers: formatAnswers(wrongAnswers),
      unanswered: formatAnswers(notAttempted),
    };

    res.status(200).json({
      message: "✅ Review Mistakes data fetched successfully!",
      reviewData: responseData,
    });
  } catch (error) {
    console.error("❌ Error fetching review mistakes:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};


export { submitTest, getResults, getReviewMistakes };
