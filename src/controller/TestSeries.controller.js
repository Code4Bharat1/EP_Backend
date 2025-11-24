import TestSeriesTest from "../models/TestSeriesTest.model.js";
import TestSeries from "../models/TestSeries.model.js";
import TestSeriesQuestions from "../models/TestSeriesQuestions.model.js";
import Student from "../models/student.model.js";
import { json, where } from "sequelize";
import TestResult from "../models/TestSeriesResult.js";

// create the test series
export const createTestSeries = async (req, res) => {
  try {
    const { name, description, createdByAdminId, visibility } = req.body;

    // Basic validation
    if (!name || !req.adminId) {
      return res.status(400).json({
        success: false,
        message: "Name and createdByAdminId are required.",
      });
    }

    // Create test series
    const newSeries = await TestSeries.create({
      name,
      description,
      createdByAdminId: req.adminId,
      visibility,
    });

    res.status(201).json({
      success: true,
      message: "Test Series created successfully.",
      data: newSeries,
    });
  } catch (error) {
    console.error("Error creating Test Series:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while creating test series.",
    });
  }
};
//get all test series
export const getAllTestSeries = async (req, res) => {
  try {
   const adminId = req.adminId;

   console.log("aagaya ",adminId);  

    const testSeriesList = await TestSeries.findAll({

      where:{
        createdByAdminId: adminId
      },
      order: [["createdAt", "DESC"]], // latest first
    });
        console.log("Filtered test series count:", testSeriesList.length);

    res.status(200).json({
      success: true,
      message: "All Test Series fetched successfully.",
      data: testSeriesList,
    });
  } catch (error) {
    console.error("Error fetching all Test Series:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching all test series.",
    });
  }
};
// Get Test Series Details
export const getTestSeriesDetails = async (req, res) => {
  try {
    const { id } = req.params; // Optional ID parameter

    let seriesData;

    if (id) {
      // Fetch a single test series
      seriesData = await TestSeries.findByPk(id);

      if (!seriesData) {
        return res.status(404).json({
          success: false,
          message: "Test Series not found.",
        });
      }
    } else {
      // Fetch all test series (can add filters later if needed)
      seriesData = await TestSeries.findAll({
        order: [["createdAt", "DESC"]],
      });
    }

    res.status(200).json({
      success: true,
      message: id
        ? "Test Series details fetched successfully."
        : "All Test Series fetched successfully.",
      data: seriesData,
    });
  } catch (error) {
    console.error("Error fetching Test Series details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching test series details.",
    });
  }
};

//create test for test series
export const createTest = async (req, res) => {
  try {
    const {
      testName,
      subject,
      testType,
      createdByAdminId,
      visibility,
      durationMinutes,
      openDate,
      closeDate,
      isPublished,
      seriesId, // new field to link to TestSeries
    } = req.body;

    // Basic validation
    if (!testName || !durationMinutes) {
      return res.status(400).json({ error: "Required fields are missing." });
    }

    // Validate seriesId if provided
    if (seriesId) {
      const series = await TestSeries.findByPk(seriesId);
      if (!series) {
        return res.status(404).json({ error: "Test series not found." });
      }
    }

    // Create the test
    const newTest = await TestSeriesTest.create({
      testName,
      subject,
      testType: testType || "custom",
      createdByAdminId: req.adminId, // or req.adminId if using auth
      visibility: visibility || "assigned_only",
      durationMinutes,
      openDate,
      closeDate,
      isPublished: isPublished || false,
      seriesId: seriesId || null, // optional link to a series
    });

    // Optional: update test count in series
    if (seriesId) {
      await TestSeries.increment("totalTests", {
        where: { id: seriesId },
      });
    }

    return res.status(201).json({
      message: "Test created successfully",
      test: newTest,
    });
  } catch (error) {
    console.error("Error creating test:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
//get all test by series id
export const getTestsBySeriesId = async (req, res) => {
  try {
    const { seriesId } = req.params;

    // Validate series existence
    const series = await TestSeries.findByPk(seriesId);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: "Test series not found.",
      });
    }

    // Fetch all tests for the series
    const tests = await TestSeriesTest.findAll({
      where: { seriesId },
      order: [["createdAt", "DESC"]], // latest first
    });

    res.status(200).json({
      success: true,
      message: "Tests fetched successfully for the series.",
      seriesDetails: series, // optional: include series details
      data: tests,
    });
  } catch (error) {
    console.error("Error fetching tests for series:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching tests for series.",
    });
  }
};
//get specific test details by testID
export const getTestSeriesTestDetails = async (req, res) => {
  try {
    const { testId } = req.params;

    // Fetch the test with its series info (optional)
    const test = await TestSeriesTest.findByPk(testId, {
      include: [
        {
          model: TestSeries,
          as: "series", // assuming you have defined the association
          attributes: ["id", "name", "description", "visibility", "totalTests"],
        },
      ],
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Test details fetched successfully.",
      data: test,
    });
  } catch (error) {
    console.error("Error fetching test details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching test details.",
    });
  }
};

//add question to specific test series
export const addQuestions = async (req, res) => {
  try {
    const {
      testId,
      questionText,
      options,
      correctAnswer,
      explanation,
      marks,
      negativeMarks,
      difficulty,
      questionType,
    } = req.body;

    // Validate required fields
    if (!testId || !questionText || !options || !correctAnswer || !marks) {
      return res.status(400).json({ error: "Required fields are missing." });
    }

    // Ensure the test exists
    const test = await TestSeriesTest.findByPk(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found." });
    }

    // Save the question
    const newQuestion = await TestSeriesQuestions.create({
      testId,
      questionText,
      options: JSON.stringify(options), // store array as string
      correctAnswer,
      explanation: explanation || "",
      marks,
      negativeMarks: negativeMarks || 0,
      difficulty: difficulty || "medium",
      questionType: questionType || "MCQ",
    });

    return res.status(201).json({
      message: "Question added successfully",
      question: newQuestion,
    });
  } catch (error) {
    console.error("Error adding question:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
// get test series question by test ID
export const getTestSeriesQuestionsByTestId = async (req, res) => {
  try {
    const { testId } = req.params;

    // Validate if test exists
    const test = await TestSeriesTest.findByPk(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found.",
      });
    }

    // Fetch all questions for the given testId
    const questions = await TestSeriesQuestions.findAll({
      where: { testId },
      order: [["createdAt", "ASC"]], // earliest first
    });

    // Parse options from string to array before sending to frontend
    const formattedQuestions = questions.map((q) => ({
      ...q.toJSON(),
      options: JSON.parse(q.options || "[]"),
    }));

    res.status(200).json({
      success: true,
      message: "Questions fetched successfully.",
      testDetails: {
        id: test.id,
        testName: test.testName,
        subject: test.subject,
        durationMinutes: test.durationMinutes,
      },
      data: formattedQuestions,
    });
  } catch (error) {
    console.error("Error fetching questions for test:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching questions.",
    });
  }
};

export const editQuestions = async (req, res) => {
  try {
    const {
      questionId,
      questionText,
      options,
      correctAnswer,
      explanation,
      marks,
      negativeMarks,
      difficulty,
      questionType,
    } = req.body;

    //validate input
    if (!questionId) {
      res.status(400).json({ message: "Reiquered field are missing" });
    }

    // find question
    const question = await TestSeriesQuestions.findByPk(questionId);
    if (!question) {
      res.status(404).json({ message: "question not found" });
    }

    //update questions
    const updateQuestion = await TestSeriesQuestions.update(
      {
        questionText,
        options: JSON.stringify(options),
        correctAnswer,
        explanation,
        marks,
        negativeMarks,
        difficulty,
        questionType,
      },
      { where: { id: questionId } }
    );

    //send res 200
    res.status(201).json({
      message: "the question is updated ",
      updateQuestion: updateQuestion,
    });
  } catch (error) {
    console.error("Error editing question:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteQuestions = async (req, res) => {
  try {
    const { questionId } = req.body;
    //validate body
    if (!questionId) {
      res.status(400).json({ message: "required filed not found" });
    }
    // find the question
    const question = await TestSeriesQuestions.findByPk(questionId);
    if (!question) {
      res.status(404).json({ message: "question not found" });
    }
    // delete the question
    const questionDelete = await TestSeriesQuestions.destroy({
      where: { id: questionId },
    });
    // send the status res
    res
      .status(200)
      .json({ message: "success", questionDelete: questionDelete });
  } catch (error) {
    console.error("Error deleteing question:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const createTestResult = async (req, res) => {
  try {
    const {
      studentId,
      testId,
      totalMarks,
      marksObtained,
      correctAnswers,
      incorrectAnswers,
      unattempted,
      timeTaken,
    } = req.body;

    // ✅ Validate required fields
    if (!studentId || !testId) {
      return res.status(400).json({
        message: "Required fields missing: studentId or testId",
      });
    }

    // ✅ Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // ✅ Check if test exists (use real testId)
    const test = await TestSeriesTest.findByPk(testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    // ✅ Find last attempt number for this student-test pair
    const lastAttempt = await TestResult.max("attemptNumber", {
      where: { studentId, testId },
    });

    const attemptNumber = lastAttempt ? lastAttempt + 1 : 1;

    // ✅ Create a new attempt (don’t update old ones)
    const result = await TestResult.create({
      studentId,
      testId,
      attemptNumber,
      totalMarks,
      marksObtained,
      correctAnswers,
      incorrectAnswers,
      unattempted,
      timeTaken,
      percentage: ((marksObtained / totalMarks) * 100).toFixed(2),
    });

    return res
      .status(201)
      .json({ message: "Test result submitted successfully", result });
  } catch (error) {
    console.error("Error Creating the Result", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
