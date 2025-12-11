import jwt from "jsonwebtoken";
import config from "config";
import Student from "../models/student.model.js";
import MeTest from "../models/saved.js";
import FullTestResults from "../models/fullTestResults.model.js";
import generateTestresult from "../models/generateTestresult.model.js";
import { RecommendedTest } from "../models/recommendedtest.model.js";
import { Op } from "sequelize";
import { StudentBatch } from "../models/BatchStudent.model.js";
import BatchAdmintest from "../models/BatchAdmintest.model.js";

/**
 * Utility function to verify JWT token
 * @param {string} token - JWT token from header
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyStudentToken = (token) => {
  if (!token) {
    throw new Error("No token provided");
  }
  const secret = process.env.JWT_SECRET;
  return jwt.verify(token, secret);
};

/**
 * Normalizes subject marks to ensure consistent response format
 * @param {object|string} rawMarks - Raw marks data from database
 * @returns {object} Normalized marks with all required subjects
 */
const normalizeSubjectMarks = (rawMarks) => {
  let subjectMarks;
  
  try {
    subjectMarks = typeof rawMarks === "string" ? JSON.parse(rawMarks) : rawMarks;
  } catch (error) {
    console.error("Error parsing subject marks:", error);
    subjectMarks = {};
  }

  // Return consistent format with default values
  return {
    Physics: subjectMarks.Physics || 0,
    Chemistry: subjectMarks.Chemistry || 0,
    Biology: subjectMarks.Biology || 0,
    Botany: subjectMarks.Botany || 0,
    Zoology: subjectMarks.Zoology || 0,
  };
};

/**
 * Calculates trend percentage between current and previous values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percentage change
 */
const calculateTrendPercentage = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number(((current - previous) / previous * 100).toFixed(2));
};

/**
 * Fetches student's first and last name
 */
const getStudentName = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = verifyStudentToken(token);
    const userId = decoded.id;

    const student = await Student.findOne({
      where: { id: userId },
      attributes: ["firstName", "lastName"],
    });

    if (!student) {
      return res.status(404).json({ 
        error: "Student not found", 
        code: "STUDENT_NOT_FOUND" 
      });
    }

    res.status(200).json({ 
      firstName: student.firstName, 
      lastName: student.lastName 
    });
  } catch (error) {
    console.error("Error fetching student name:", error);
    
    if (error.message === "No token provided" || error.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        error: "Unauthorized", 
        code: "INVALID_TOKEN",
        message: "Invalid or expired token" 
      });
    }
    
    res.status(500).json({ 
      error: "Internal Server Error", 
      code: "SERVER_ERROR",
      message: "Failed to fetch student data" 
    });
  }
};

/**
 * Fetches comprehensive test statistics for dashboard
 */
const getTestStatistics = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = verifyStudentToken(token);
    const userId = decoded.id;

    // Execute all count queries in parallel
    const [
      adminTestsCount,
      userTestsCount,
      examPlanTestsCount,
      fullTestsCount,
      latestFull,
      latestRecommended,
      latestME,
      pendingFullTests,
      pendingRecommendedTests,
      pendingMETests
    ] = await Promise.all([
      // Count queries
      generateTestresult.count({ where: { studentId: userId } }),
      MeTest.count({ where: { studentId: userId } }),
      FullTestResults.count({
        where: { 
          studentId: userId, 
          testName: { [Op.like]: "System Test%" } 
        }
      }),
      FullTestResults.count({
        where: { 
          studentId: userId, 
          testName: { [Op.like]: "Full Test%" } 
        }
      }),
      
      // Latest timestamp queries
      FullTestResults.findOne({
        where: { 
          studentId: userId, 
          testName: { [Op.like]: "Full Test%" } 
        },
        order: [["updatedAt", "DESC"]],
        attributes: ["updatedAt"],
      }),
      FullTestResults.findOne({
        where: { 
          studentId: userId, 
          testName: { [Op.like]: "System Test%" } 
        },
        order: [["updatedAt", "DESC"]],
        attributes: ["updatedAt"],
      }),
      MeTest.findOne({
        where: { studentId: userId },
        order: [["updatedAt", "DESC"]],
        attributes: ["updatedAt"],
      }),
      
      // Pending counts
      FullTestResults.count({
        where: { 
          studentId: userId, 
          testName: { [Op.like]: "Full Test%" },
          status: { [Op.ne]: "Completed" }
        }
      }),
      FullTestResults.count({
        where: { 
          studentId: userId, 
          testName: { [Op.like]: "System Test%" },
          status: { [Op.ne]: "Completed" }
        }
      }),
      MeTest.count({
        where: { 
          studentId: userId,
          status: { [Op.ne]: "completed" }
        }
      })
    ]);

    res.status(200).json({
      fullTestResults: {
        totalTests: fullTestsCount,
        completedTests: fullTestsCount - pendingFullTests,
        pendingCount: pendingFullTests,
        updatedAt: latestFull?.updatedAt || null
      },
      recommendedTests: {
        totalTests: examPlanTestsCount,
        completedTests: examPlanTestsCount - pendingRecommendedTests,
        pendingCount: pendingRecommendedTests,
        updatedAt: latestRecommended?.updatedAt || null
      },
      meTests: {
        totalTests: userTestsCount,
        completedTests: userTestsCount - pendingMETests,
        pendingCount: pendingMETests,
        updatedAt: latestME?.updatedAt || null
      },
      adminTests: {
        totalTests: adminTestsCount
      }
    });
  } catch (error) {
    console.error("Error fetching test statistics:", error);
    
    if (error.message === "No token provided" || error.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        error: "Unauthorized", 
        code: "INVALID_TOKEN",
        message: "Invalid or expired token" 
      });
    }
    
    res.status(500).json({ 
      error: "Internal Server Error", 
      code: "SERVER_ERROR",
      message: "Failed to fetch test statistics" 
    });
  }
};

/**
 * Fetches subject-wise average marks for a student
 */
const getSubjectWiseAverageMarks = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = verifyStudentToken(token);
    const userId = decoded.id;

    const meTestData = await MeTest.findAll({
      where: { studentId: userId },
      attributes: ["id", "subjectWiseMarks", "updatedAt"],
    });

    const result = meTestData.map((test) => {
      const normalizedMarks = normalizeSubjectMarks(test.subjectWiseMarks);
      
      return {
        ...normalizedMarks,
        updatedAt: test.updatedAt,
        testId: test.id
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching subject-wise marks:", error);
    
    if (error.message === "No token provided" || error.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        error: "Unauthorized", 
        code: "INVALID_TOKEN",
        message: "Invalid or expired token" 
      });
    }
    
    res.status(500).json({ 
      error: "Internal Server Error", 
      code: "SERVER_ERROR",
      message: "Failed to fetch subject-wise marks" 
    });
  }
};

/**
 * Fetches pending tests for a student with batch optimization
 */
const getpendingTest = async (req, res) => {
  try {
    // Validate studentId
   const studentId = req.user.id;  // verifyToken se jo user aata hai
    if (!studentId || isNaN(studentId)) {
      return res.status(400).json({ 
        error: "Invalid student ID", 
        code: "INVALID_STUDENT_ID",
        message: "Student ID must be a valid number" 
      });
    }

    // Find student's batch in a single query
    const studentBatch = await StudentBatch.findOne({
      where: { studentId },
      attributes: ["batchId"]
    });

    if (!studentBatch) {
      return res.status(404).json({
        success: false,
        error: "Student batch not found",
        code: "BATCH_NOT_FOUND",
        message: "Student is not assigned to any batch"
      });
    }

    const batchId = studentBatch.batchId;

    // Fetch all tests for the batch and student attempts in parallel
    const [batchTests, attemptedTests] = await Promise.all([
      BatchAdmintest.findAll({
        where: { batchId },
        attributes: ["admintestId", "testname"]
      }),
      generateTestresult.findAll({
        where: { studentId },
        attributes: ["testid", "status"]
      })
    ]);

    // Create a map of attempted tests for quick lookup
    const attemptedTestMap = new Map(
      attemptedTests.map(attempt => [attempt.testid, attempt.status])
    );

    // Filter pending tests in memory (no N+1 queries)
    const pendingTests = batchTests
      .filter(test => {
        const status = attemptedTestMap.get(test.admintestId);
        return !status || status === "Pending";
      })
      .map(test => ({
        testId: test.admintestId,
        testName: test.testname,
        status: attemptedTestMap.get(test.admintestId) || "Not Attempted"
      }));

    res.status(200).json({
      success: true,
      data: pendingTests,
      count: pendingTests.length,
      message: pendingTests.length > 0 
        ? "Pending tests retrieved successfully" 
        : "No pending tests found"
    });
  } catch (error) {
    console.error("Error fetching pending tests:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      code: "SERVER_ERROR",
      message: "Failed to fetch pending tests" 
    });
  }
};
const getSubjectWiseMarks = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = verifyStudentToken(token);
    const userId = decoded.id;
    const meTestData = await MeTest.findAll({
      where: { studentId: userId },
      attributes: ["id", "subjectWiseMarks", "updatedAt"],
    });
    const result = meTestData.map((test) => {
      const normalizedMarks = normalizeSubjectMarks(test.subjectWiseMarks);
      return {
        ...normalizedMarks,
        updatedAt: test.updatedAt,
        testId: test.id
      };
    });
    res.status(200).json(result);
  }
  catch (error) {
    console.error("Error fetching subject-wise marks:", error);
    if (error.message === "No token provided" || error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Unauthorized",
        code: "INVALID_TOKEN",
        message: "Invalid or expired token"
      });
    }
    res.status(500).json({
      error: "Internal Server Error",
      code: "SERVER_ERROR",
      message: "Failed to fetch subject-wise marks"
    });
  }
};

/**
 * Fetches verified users with pagination and their test results
 */
const getVerifiedUser = async (req, res) => {
  try {
    // Parse pagination parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Get total count and paginated users in parallel
    const [totalCount, users] = await Promise.all([
      Student.count({ where: { isVerified: true } }),
      Student.findAll({
        where: { isVerified: true },
        attributes: ["id", "firstName", "lastName", "profileImage"],
        limit,
        offset,
        order: [["createdAt", "DESC"]]
      })
    ]);

    if (!users || users.length === 0) {
      return res.status(404).json({ 
        message: "No verified users found.",
        data: { users: [], total: 0, page, totalPages: 0 }
      });
    }

    // Fetch test results for all users in batch
    const userIds = users.map(user => user.id);
    const testResults = await FullTestResults.findAll({
      where: { studentId: { [Op.in]: userIds } },
      attributes: ["studentId", "correctAnswers", "wrongAnswers", "notAttempted"]
    });

    // Group test results by studentId for efficient lookup
    const testResultsByStudent = testResults.reduce((acc, result) => {
      if (!acc[result.studentId]) {
        acc[result.studentId] = [];
      }
      acc[result.studentId].push({
        correctAnswers: result.correctAnswers,
        wrongAnswers: result.wrongAnswers,
        notAttempted: result.notAttempted
      });
      return acc;
    }, {});

    // Map users with their test results
    const userData = users.map(user => ({
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
      testResults: testResultsByStudent[user.id] || []
    }));

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      users: userData,
      total: totalCount,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error("Error fetching user data and test results:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      code: "SERVER_ERROR",
      message: "Failed to fetch verified users" 
    });
  }
};

// Export functions (removed duplicate getSubjectWiseMarks)
export {
  getStudentName,
  getTestStatistics,
  getSubjectWiseAverageMarks,
  getpendingTest,
  getSubjectWiseMarks,
  getVerifiedUser
};