import { Sequelize, Op } from "sequelize";
import MeTest from "../models/saved.js"; // MeTest model (for custom test saving)
import {
  Pdf,
  Question,
  Option,
  Diagram
} from "../models/everytestmode.refrence.js";
import _ from "lodash";

const MARKS_PER_QUESTION = 4; // Define marks per question
function parseTopicTags(tags) {
  if (!tags) return [];
  return tags
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * CREATE A NEW TEST
 * - Compute subjectWiseMarks so we can store them in the DB.
 */
const createMeTest = async (req, res) => {
  try {
    const { testName, selectedChapters, difficultyLevel } = req.body;

    if (!testName || !difficultyLevel || !selectedChapters) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // If selectedChapters is sent as a JSON string, parse it first.
    let chaptersData = selectedChapters;
    if (typeof selectedChapters === "string") {
      try {
        chaptersData = JSON.parse(selectedChapters);
      } catch (e) {
        return res.status(400).json({ message: "Invalid selectedChapters format." });
      }
    }

    let totalQuestions = 0;
    let overAllMarks = 0; // Track overall marks
    const validatedSelectedChapters = {};
    const subjectWiseMarks = {};

    for (const [subjectName, chapters] of Object.entries(chaptersData)) {
      validatedSelectedChapters[subjectName] = [];
      let subjectTotal = 0;

      for (const chapter of chapters) {
        if (!chapter.name || !chapter.questionCount) {
          return res.status(400).json({
            message: `Invalid chapter data in subject "${subjectName}".`,
          });
        }

        const chapterMarks = chapter.questionCount * MARKS_PER_QUESTION; // Each question = 4 marks
        totalQuestions += chapter.questionCount;
        overAllMarks += chapterMarks;
        subjectTotal += chapterMarks;

        validatedSelectedChapters[subjectName].push({
          ...chapter,
          totalMarks: chapterMarks,
        });
      }

      subjectWiseMarks[subjectName] = subjectTotal;
    }

    console.log(`Total Marks Calculated: ${overAllMarks}`);

    // Create new test record (store chapter data as JSON strings)
    const newTest = await MeTest.create({
      studentId: req.user.id,
      testName,
      selectedChapters: JSON.stringify(validatedSelectedChapters),
      difficultyLevel,
      status: "saved",
      pdf_id: null,
      totalQuestions,
      overAllMarks, // Store overall marks
      subjectWiseMarks: JSON.stringify(subjectWiseMarks),
    });

    res.status(201).json({
      message: "Test created successfully.",
      data: { ...newTest.dataValues, testId: newTest.id },
    });
  } catch (error) {
    console.error("Error creating test:", error);
    res.status(500).json({ message: "Server error creating test." });
  }
};

// Get all tests with status "completed"
// Example: controllers/metest.controller.js

// GET /metest/completedTests
 const getCompletedTests = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.studentId;
    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const tests = await MeTest.findAll({
      where: { studentId, status: "completed" },
      order: [["updatedAt", "DESC"]],
    });

    // Convert each test to a plain object and parse double‑encoded fields
    const parsedTests = tests.map((test) => {
      const testObj = test.toJSON ? test.toJSON() : test;

      // Parse selectedChapters if it is a string
      if (typeof testObj.selectedChapters === "string") {
        try {
          let parsedSelectedChapters = JSON.parse(testObj.selectedChapters);
          if (typeof parsedSelectedChapters === "string") {
            parsedSelectedChapters = JSON.parse(parsedSelectedChapters);
          }
          testObj.selectedChapters = parsedSelectedChapters;
        } catch (err) {
          console.error("Error parsing selectedChapters for test id", testObj.id, err);
          testObj.selectedChapters = {};
        }
      }

      // Parse subjectWiseMarks if it is a string
      if (typeof testObj.subjectWiseMarks === "string") {
        try {
          let parsedSubjectWiseMarks = JSON.parse(testObj.subjectWiseMarks);
          if (typeof parsedSubjectWiseMarks === "string") {
            parsedSubjectWiseMarks = JSON.parse(parsedSubjectWiseMarks);
          }
          testObj.subjectWiseMarks = parsedSubjectWiseMarks;
        } catch (err) {
          console.error("Error parsing subjectWiseMarks for test id", testObj.id, err);
          testObj.subjectWiseMarks = {};
        }
      }

      return testObj;
    });

    return res.status(200).json({ data: parsedTests });
  } catch (error) {
    console.error("Error fetching completed tests:", error);
    return res.status(500).json({ message: "Server error fetching completed tests." });
  }
};

// GET /metest/getTestResult/:testId
 const getTestResult = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.studentId;
    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { testId } = req.params;
    if (!testId) {
      return res.status(400).json({ message: "Test ID is required." });
    }

    const test = await MeTest.findOne({ where: { id: testId, studentId } });
    if (!test) {
      return res.status(404).json({ message: "Test not found or unauthorized." });
    }
    if (test.status !== "completed") {
      return res.status(400).json({ message: "Test has not been completed yet." });
    }

    // Parse subjectWiseMarks if it is a string (and possibly double‑encoded)
    let subjectWiseMarks = test.subjectWiseMarks;
    if (typeof subjectWiseMarks === "string") {
      try {
        let parsedSubjectWiseMarks = JSON.parse(subjectWiseMarks);
        if (typeof parsedSubjectWiseMarks === "string") {
          parsedSubjectWiseMarks = JSON.parse(parsedSubjectWiseMarks);
        }
        subjectWiseMarks = parsedSubjectWiseMarks;
      } catch (err) {
        console.error("Error parsing subjectWiseMarks for test id", test.id, err);
        subjectWiseMarks = {};
      }
    }

    const { score, totalQuestions, correct, incorrect, unattempted, overAllMarks } = test;

    return res.status(200).json({
      data: {
        score,
        totalQuestions,
        correct,
        incorrect,
        unattempted,
        overallMarks: overAllMarks,
        subjectWiseMarks,
      },
    });
  } catch (error) {
    console.error("Error fetching test result:", error);
    return res.status(500).json({ message: "Server error fetching test result." });
  }
};

// POST /metest/submitTest
 const submitTest = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.studentId;
    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { testId, answers } = req.body;
    if (!testId || !answers || typeof answers !== "object") {
      return res.status(400).json({ message: "Test ID and valid answers are required." });
    }

    const test = await MeTest.findOne({ where: { id: testId, studentId } });
    if (!test) {
      return res.status(404).json({ message: "Test not found or unauthorized." });
    }
    if (test.status === "completed") {
      return res.status(400).json({ message: "Test has already been submitted." });
    }

    // Fetch questions from the test (assuming questions are stored via pdf_id)
    const questions = await Question.findAll({
      where: { pdf_id: test.pdf_id },
      include: [{ model: Option, as: "options" }],
    });

    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    // Evaluate answers
    questions.forEach((question) => {
      const correctOption = question.options.find((opt) => opt.is_correct);
      const userAnswer = answers[question.id];

      if (userAnswer === null || userAnswer === undefined) {
        unattempted += 1;
      } else if (parseInt(userAnswer) === correctOption.id) {
        correct += 1;
      } else {
        incorrect += 1;
      }
    });

    const totalQuestions = test.totalQuestions;
    const scoreValue = correct * 4 - incorrect * 1;
    const finalScore = scoreValue < 0 ? 0 : scoreValue;

    // Update test record (preserving preset overall marks)
    test.answers = answers;
    test.score = finalScore;
    test.correct = correct;
    test.incorrect = incorrect;
    test.unattempted = unattempted;
    test.status = "completed";

    await test.save();

    return res.status(200).json({
      message: "Test submitted successfully.",
      data: {
        score: finalScore,
        totalQuestions,
        correct,
        incorrect,
        unattempted,
      },
    });
  } catch (error) {
    console.error("Error submitting test:", error);
    return res.status(500).json({ message: "Server error submitting test." });
  }
};

// Get the result for a completed test


// Get a test by its ID
const getMeTestById = async (req, res) => {
  try {
    const studentId = req.user?.id;
    const { id } = req.params;

    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const test = await MeTest.findOne({
      where: { id, studentId },
      attributes: [
        "id",
        "studentId",
        "testName",
        "selectedChapters",
        "difficultyLevel",
        "status",
        "answers",
        "score",
        "correct",
        "incorrect",
        "unattempted",
        "totalQuestions",
        "overAllMarks",
        "subjectWiseMarks",
        "pdf_id",
        "createdAt",
        "updatedAt"
      ]
    });

    if (!test) {
      return res.status(404).json({ message: "Test not found or unauthorized." });
    }

    console.log(`Fetching Test ID: ${id}, OverAllMarks: ${test.overAllMarks}`);

    return res.status(200).json({
      data: {
        ...test.dataValues,
        selectedChapters: JSON.parse(test.selectedChapters),
        subjectWiseMarks: JSON.parse(test.subjectWiseMarks),
        overAllMarks: test.overAllMarks,
      },
    });
  } catch (error) {
    console.error("Error fetching test by ID:", error);
    return res.status(500).json({ message: "Server error fetching test." });
  }
};

// Update a test (rename, update chapters, difficulty, etc.)
const updateMeTest = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.studentId;
    const { id } = req.params;
    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }
    
    const { testName, selectedChapters, difficultyLevel, status, answers, score } = req.body;
    
    const validStatuses = ["saved", "attempted", "completed"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status provided. Valid options are: ${validStatuses.join(", ")}` });
    }
    
    // If selectedChapters is provided as a JSON string, parse it
    let chaptersData = selectedChapters;
    if (selectedChapters !== undefined && typeof selectedChapters === "string") {
      try {
        chaptersData = JSON.parse(selectedChapters);
      } catch (err) {
        return res.status(400).json({ message: "Invalid selectedChapters format." });
      }
    }
    
    const test = await MeTest.findOne({ where: { id, studentId } });
    if (!test) {
      return res.status(404).json({ message: "Test not found or unauthorized to update." });
    }
    
    let newTotalQuestions = 0;
    let newTotalMarks = 0;
    const updatedSelectedChapters = {};
    const updatedSubjectMarks = {};
    
    if (chaptersData !== undefined) {
      // Loop over each subject in the provided chaptersData
      for (const [subjectName, chapters] of Object.entries(chaptersData)) {
        if (!Array.isArray(chapters)) {
          return res.status(400).json({
            message: `Chapters for subject "${subjectName}" must be an array.`,
          });
        }
        updatedSelectedChapters[subjectName] = [];
        let subjectTotal = 0;
        
        for (const chapter of chapters) {
          const { name, questionCount } = chapter;
          if (!name || typeof name !== "string") {
            return res.status(400).json({
              message: `Invalid or missing chapter name in subject "${subjectName}".`,
            });
          }
          if (!Number.isInteger(questionCount) || questionCount < 1) {
            return res.status(400).json({
              message: `Invalid questionCount for chapter "${name}" in subject "${subjectName}". Must be a positive integer.`,
            });
          }
          const chapterMarks = questionCount * MARKS_PER_QUESTION;
          newTotalQuestions += questionCount;
          newTotalMarks += chapterMarks;
          subjectTotal += chapterMarks;
          
          updatedSelectedChapters[subjectName].push({
            name,
            questionCount,
            totalMarks: chapterMarks,
          });
        }
        updatedSubjectMarks[subjectName] = subjectTotal;
      }
      // Save the chapter details as a JSON string in selectedChapters
      test.selectedChapters = JSON.stringify(updatedSelectedChapters);
      // Save the marks summary separately in subjectWiseMarks
      test.subjectWiseMarks = JSON.stringify(updatedSubjectMarks);
      test.totalQuestions = newTotalQuestions;
      test.overAllMarks = newTotalMarks;
    }
    
    if (testName !== undefined) {
      test.testName = testName;
    }
    if (difficultyLevel !== undefined) {
      if (!["Easy", "Medium", "Hard"].includes(difficultyLevel)) {
        return res.status(400).json({ message: "Invalid difficultyLevel. Must be 'Easy', 'Medium', or 'Hard'." });
      }
      test.difficultyLevel = difficultyLevel;
    }
    if (status !== undefined) {
      test.status = status;
    }
    if (answers !== undefined) {
      test.answers = answers;
    }
    if (score !== undefined) {
      test.score = score;
    }
    
    await test.save();
    return res.status(200).json({ message: "Test updated successfully.", data: test });
  } catch (error) {
    console.error("Error updating test:", error.message, error.stack);
    return res.status(500).json({ message: "Server error updating test." });
  }
};
  

// Delete a test (by id)
const deleteMeTest = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.studentId;
    const { id } = req.params;

    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const rowsDeleted = await MeTest.destroy({ where: { id, studentId } });
    if (rowsDeleted === 0) {
      return res
        .status(404)
        .json({ message: "Test not found or unauthorized to delete." });
    }
    return res.status(200).json({ message: "Test deleted successfully." });
  } catch (error) {
    console.error("Error deleting test:", error);
    return res.status(500).json({ message: "Server error deleting test." });
  }
};

// Finalize a test (mark as attempted/completed)
const finalizeTest = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.studentId;
    const { id } = req.params;
    const { answers, score } = req.body;

    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const test = await MeTest.findOne({ where: { id, studentId } });
    if (!test) {
      return res
        .status(404)
        .json({ message: "Test not found or unauthorized." });
    }

    // Update fields
    test.status = "completed"; // Or "attempted" based on your logic
    test.answers = answers || test.answers;
    test.score = score !== undefined ? score : test.score;

    await test.save();
    return res.status(200).json({
      message: "Test finalized successfully.",
      data: test,
    });
  } catch (error) {
    console.error("Error finalizing test:", error);
    return res.status(500).json({ message: "Server error finalizing test." });
  }
};

// Get subjects and chapters along with question counts
const getSubjectsAndChapters = async (req, res) => {
  try {
    // Fetch all Pdf entries
    const pdfs = await Pdf.findAll({
      attributes: ["subject", "id", "topic_tags"],
    });

    if (!pdfs || pdfs.length === 0) {
      console.log("No Pdf records found.");
      return res
        .status(404)
        .json({ message: "No subjects found in Pdf table." });
    }

    const subjectsData = {};

    // Extract all pdf_ids to optimize Question.count queries
    const pdfIds = pdfs.map((pdf) => pdf.id);

    // Fetch question counts grouped by pdf_id
    const questionCounts = await Question.findAll({
      attributes: ["pdf_id", [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]],
      where: {
        pdf_id: {
          [Op.in]: pdfIds,
        },
      },
      group: ["pdf_id"],
    });

    // Create a map of pdf_id to count
    const countMap = {};
    questionCounts.forEach((qc) => {
      countMap[qc.pdf_id] = qc.get("count");
    });

    // Iterate through each Pdf and build the response structure
    for (const pdf of pdfs) {
      const subjectName = pdf.subject.trim();
      const normalizedSubject = subjectName.toLowerCase();
      const pdfId = pdf.id;
      const topicTag = pdf.topic_tags;

      console.log(`Processing Pdf ID: ${pdfId}, Subject: ${subjectName}`);

      if (!subjectsData[normalizedSubject]) {
        subjectsData[normalizedSubject] = {
          id: pdfId,
          subject_name: subjectName,
          chapters: [],
        };
      }

      const questionCount = countMap[pdfId] ? parseInt(countMap[pdfId], 10) : 0;

      if (questionCount > 0) {
        subjectsData[normalizedSubject].chapters.push({
          name: topicTag,
          questionCount: questionCount,
        });
      }
    }

    const responseData = Object.values(subjectsData);

    console.log("Final Subjects Data:", JSON.stringify(responseData, null, 2));
    return res.json(responseData);
  } catch (error) {
    console.error("Error fetching subjects/chapters:", error);
    return res.status(500).json({ message: "Server error fetching subjects." });
  }
};

// Fetch questions based on a test's selection (using selectedChapters from MeTest)

const fetchQuestions = async (req, res) => {
  try {
    // Expecting testId in the URL parameters
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Missing required parameter: testId" });
    }

    // Retrieve the test record
    const testDetails = await MeTest.findOne({ where: { id } });
    if (!testDetails) {
      return res.status(404).json({ error: "Test not found for the provided testId." });
    }

    // Extract and parse selectedChapters (if stored as a string)
    let { selectedChapters } = testDetails;
    console.log("Raw selectedChapters from DB:", selectedChapters);

    if (typeof selectedChapters === "string") {
      if (selectedChapters.trim() === "" || selectedChapters.trim() === "null") {
        return res.status(400).json({ error: "Invalid selectedChapters data." });
      }
      try {
        selectedChapters = JSON.parse(selectedChapters);
        // Handle potential double‑encoded JSON:
        if (typeof selectedChapters === "string") {
          selectedChapters = JSON.parse(selectedChapters);
        }
        console.log("Parsed selectedChapters:", selectedChapters);
      } catch (err) {
        console.error("Error parsing selectedChapters:", err);
        return res.status(400).json({ error: "Invalid selectedChapters data." });
      }
    }

    // Validate that the parsed data is a plain object using Lodash
    if (!_.isPlainObject(selectedChapters)) {
      return res.status(400).json({ error: "Invalid selectedChapters data." });
    }

    // Check that at least one subject has a nonempty chapters array
    const subjects = Object.keys(selectedChapters);
    if (
      subjects.length === 0 ||
      subjects.every(
        (key) => !Array.isArray(selectedChapters[key]) || selectedChapters[key].length === 0
      )
    ) {
      return res.status(400).json({ error: "No chapters selected in test." });
    }

    let questionWithOptions = [];

    // Iterate through each subject in selectedChapters
    for (const [subjectName, chapters] of Object.entries(selectedChapters)) {
      const lowerSubject = subjectName.toLowerCase();

      // Find all PDFs for this subject (assuming Pdf.subject is stored in lowercase)
      const pdfs = await Pdf.findAll({
        where: { subject: lowerSubject },
      });
      if (!pdfs.length) {
        console.warn(`No PDFs found for subject: ${subjectName}`);
        continue;
      }

      // Process each chapter for the current subject
      for (const chapterObj of chapters) {
        const { name: chapterName, questionCount } = chapterObj;
        if (!chapterName || !questionCount) {
          console.warn(`Skipping invalid chapter data: ${JSON.stringify(chapterObj)}`);
          continue;
        }

        const lowerChapter = chapterName.toLowerCase();
        console.log(`Looking for chapter '${lowerChapter}' in subject '${lowerSubject}'`);

        const matchedPdfIds = [];
        for (const pdf of pdfs) {
          const tagsArray = parseTopicTags(pdf.topic_tags);
          if (tagsArray.includes(lowerChapter)) {
            matchedPdfIds.push(pdf.id);
          }
        }
        if (matchedPdfIds.length === 0) {
          console.warn(
            `Chapter '${chapterName}' not found in any PDF.topic_tags for subject '${subjectName}'`
          );
          continue;
        }

        // Fetch questions from each matching PDF (up to questionCount per PDF)
        for (const pdfId of matchedPdfIds) {
          console.log(
            `Fetching up to ${questionCount} questions from Pdf ID: ${pdfId}, chapter: ${chapterName}`
          );
          const questions = await Question.findAll({
            where: { pdf_id: pdfId },
            include: [
              { model: Option, as: "options" },
              { model: Diagram, as: "Diagrams", required: false },
            ],
            limit: questionCount,
          });

          // Process each question, extracting its options and diagrams if available
          for (let question of questions) {
            const options = (question.options || []).map((opt) => ({
              id: opt.id,
              text: opt.option_text,
              is_correct: opt.is_correct,
            }));

            const diagramPath =
              question.Diagrams && question.Diagrams.length > 0
                ? question.Diagrams[0].diagram_path
                : null;

            questionWithOptions.push({
              question: {
                id: question.id,
                text: question.question_text,
              },
              options,
              diagram: diagramPath,
            });
          }
        }
      }
    }

    if (questionWithOptions.length === 0) {
      return res.status(404).json({
        error: "No questions found for the selected chapters. Please check if questions are available.",
      });
    }

    const totalMarks = testDetails.totalMarks || 0;

    return res.status(200).json({
      testId: id,
      totalMarks,
      testDetails,
      questions: questionWithOptions,
    });
  } catch (error) {
    console.error("Error fetching questions:", error.message, error.stack);
    return res.status(500).json({ error: "Error fetching questions." });
  }
};

// Get all tests in "saved" status for the current student
const getCreatedTests = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.studentId;
    const { id } = req.params; // If needed

    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const tests = await MeTest.findAll({
      where: { studentId, status: "saved" },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ data: tests });
  } catch (error) {
    console.error("Error fetching created tests:", error);
    return res.status(500).json({ message: "Server error fetching created tests." });
  }
};

// Get all tests (filterable by status) for the current student
const getAllMeTests = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.studentId;
    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { status } = req.query;
    const whereClause = { studentId };
    if (status) {
      whereClause.status = status;
    }
    const tests = await MeTest.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json({ data: tests });
  } catch (error) {
    console.error("Error fetching tests:", error);
    return res
      .status(500)
      .json({ message: "Server error fetching tests." });
  }
};

// Get past tests (attempted or completed)
const getPastTests = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.studentId;
    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const tests = await MeTest.findAll({
      where: {
        studentId,
        status: { [Op.in]: ["attempted", "completed"] },
      },
      order: [["updatedAt", "DESC"]],
    });
    return res.status(200).json({ data: tests });
  } catch (error) {
    console.error("Error fetching past tests:", error);
    return res.status(500).json({ message: "Server error fetching past tests." });
  }
};

export {
  createMeTest,
  getMeTestById,
  getAllMeTests,
  getPastTests,
  getCreatedTests,
  updateMeTest,
  deleteMeTest,
  finalizeTest,
  getSubjectsAndChapters,
  fetchQuestions,
  getTestResult,
  submitTest,
  getCompletedTests
};
