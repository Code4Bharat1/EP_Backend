import jwt from "jsonwebtoken";
import config from "config";
import Student from "../models/student.model.js";
import MeTest from "../models/saved.js";
import FullTestResults from "../models/fullTestResults.model.js";
// import { Op, fn, col, where } from "sequelize";
import generateTestresult from "../models/generateTestresult.model.js";
import { RecommendedTest } from "../models/recommendedtest.model.js";
import { Op } from "sequelize";
import { StudentBatch } from "../models/BatchStudent.model.js";
import BatchAdmintest from "../models/BatchAdmintest.model.js";

const getStudentName = async (req, res) => {
  try {
    // Extract token from the Authorization header
    const token = req.headers.authorization?.split(" ")[1]; // Optional chaining to handle missing token

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const secret = config.get("jwtSecret");
    let decoded;

    try {
      decoded = jwt.verify(token, secret); // Verify the JWT token
    } catch (err) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Invalid or expired token" });
    }

    const userId = decoded.id; // Extract userId from the decoded token

    // Fetch student data from the Student model based on studentId
    const student = await Student.findOne({
      where: { id: userId }, // Match the student with the userId
      attributes: ["firstName", "lastName"], // Only fetch firstName and lastName
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Return the student data (firstName and lastName)
    res
      .status(200)
      .json({ firstName: student.firstName, lastName: student.lastName });
  } catch (error) {
    // Handle any other unexpected errors
    console.error("Error fetching student name:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// const getTestStatistics = async (req, res) => {
//   try {
//     // Extract token from the Authorization header
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) {
//       return res.status(401).json({ error: "Unauthorized: No token provided" });
//     }

//     const secret = config.get("jwtSecret");
//     let decoded;

//     try {
//       decoded = jwt.verify(token, secret); // Verify the JWT token
//     } catch (err) {
//       return res.status(403).json({ error: "Unauthorized: Invalid or expired token" });
//     }

//     const userId = decoded.id;

//     // Function to get statistics from a table
//     const getStats = async (model, tableName, statusField = "status", completedValue = "completed") => {
//       try {
//         const totalTests = await model.count({ where: { studentId: userId } });
//         const completedTests = await model.count({ where: { studentId: userId, [statusField]: completedValue } });

//         // Get the most recent update date
//         const latestTest = await model.findOne({
//           where: { studentId: userId },
//           order: [["updatedAt", "DESC"]],
//           attributes: ["updatedAt"],
//         });

//         const updatedAt = latestTest ? latestTest.updatedAt : "N/A";

//         return { tableName, totalTests, completedTests, updatedAt };
//       } catch (error) {
//         console.error(`Error fetching stats for table ${tableName}:`, error);
//         return { tableName, totalTests: 0, completedTests: 0, updatedAt: "N/A" }; // Return default values on error
//       }
//     };

//     // Fetch statistics from each table
//     const fullTestStats = await getStats(FullTestResults, "FullTestResults", "status", "Completed");
//     const recommendedTestStats = await getStats(RecommendedTest, "RecommendedTest", "status", "completed");
//     const meTestStats = await getStats(MeTest, "MeTest", "status", "completed");

//     // Consolidate results
//     const result = {
//       fullTestResults: fullTestStats,
//       recommendedTests: recommendedTestStats,
//       meTests: meTestStats,
//     };

//     res.status(200).json(result);
//   } catch (error) {
//     console.error("Error fetching test statistics:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

const getSubjectWiseMarks = async (req, res) => {
  try {
    // Extract token from the Authorization header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const secret = config.get("jwtSecret");
    let decoded;

    try {
      decoded = jwt.verify(token, secret); // Verify the JWT token
    } catch (err) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Invalid or expired token" });
    }

    const userId = decoded.id;

    // Fetch data from MeTest
    const meTestData = await MeTest.findAll({
      where: { studentId: userId },
      attributes: ["subjectWiseMarks", "updatedAt"],
    });

    // Process the data and log the result
    const result = meTestData.map((test) => {
      let subjectMarks;
      try {
        // Parse the JSON string from the database
        subjectMarks =
          typeof test.subjectWiseMarks === "string"
            ? JSON.parse(test.subjectWiseMarks)
            : test.subjectWiseMarks;
      } catch (error) {
        console.error("Error parsing subjectWiseMarks:", error);
        subjectMarks = { Physics: 0, Chemistry: 0, Biology: 0 };
      }

      const formattedResult = {
        Physics: subjectMarks.Physics || 0,
        Chemistry: subjectMarks.Chemistry || 0,
        Biology: subjectMarks.Biology || 0,
        updatedAt: test.updatedAt,
      };

      // Log in the desired format

      return formattedResult;
    });

    // Send the data as JSON response
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching subject-wise marks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getpendingTest = async (req, res) => {
  try {
    // Extract the token from the Authorization header
    // const token = req.headers.authorization?.split(" ")[1];
    // if (!token) {
    //   return res.status(401).json({ error: "Unauthorized: No token provided" });
    // }

    // const secret = config.get("jwtSecret");
    // let decoded;

    // try {
    //   decoded = jwt.verify(token, secret); // Verify the JWT token
    // } catch (err) {
    //   return res.status(403).json({ error: "Unauthorized: Invalid or expired token" });
    // }

    const userId = req.adminId; // Extract userId from the decoded token

    // Fetch the recommended tests data based on userId
    const recommendedTests = await RecommendedTest.findAll({
      where: { studentId: userId },
      attributes: ["testName", "status", "updatedAt"],
      order: [["updatedAt", "DESC"]], // Optional: to order by latest updatedAt
    });

    if (!recommendedTests || recommendedTests.length === 0) {
      return res
        .status(404)
        .json({ message: "No recommended tests found for this user" });
    }

    // Return the fetched data
    res.status(200).json(recommendedTests);
  } catch (error) {
    console.error("Error fetching recommended tests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getVerifiedUser = async (req, res) => {
  try {
    // Step 1: Fetch users with isVerified = 1 (true)
    const users = await Student.findAll({
      where: { isVerified: true },
      attributes: ["id", "firstName", "lastName", "profileImage"], // Only fetch required fields
    });

    // If no verified users are found
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No verified users found." });
    }

    // Step 2: For each verified user, fetch their test results
    const userData = [];

    for (const user of users) {
      const userId = user.id;

      // Fetch FullTestResults based on studentId (userId)
      const testResults = await FullTestResults.findAll({
        where: { studentId: userId },
        attributes: ["correctAnswers", "wrongAnswers", "notAttempted"],
      });

      // Prepare the result for the user
      const testData = testResults.map((result) => ({
        correctAnswers: result.correctAnswers,
        wrongAnswers: result.wrongAnswers,
        notAttempted: result.notAttempted,
      }));

      // Add user and their test data to the response
      userData.push({
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        testResults: testData,
      });
    }

    // Step 3: Return the combined data (user and test results)
    res.status(200).json(userData);
  } catch (error) {
    console.error("Error fetching user data and test results:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSubjectWiseAverageMarks = async (req, res) => {
  try {
    // Extract token from the Authorization header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const secret = config.get("jwtSecret");
    let decoded;

    try {
      decoded = jwt.verify(token, secret); // Verify the JWT token
    } catch (err) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Invalid or expired token" });
    }

    const userId = decoded.id;

    // Fetch data from MeTest
    const meTestData = await MeTest.findAll({
      where: { studentId: userId },
      attributes: ["subjectWiseMarks", "updatedAt"],
    });

    // Process the data and log the result
    const result = meTestData.map((test) => {
      let subjectMarks;
      try {
        // Parse the JSON string from the database
        subjectMarks =
          typeof test.subjectWiseMarks === "string"
            ? JSON.parse(test.subjectWiseMarks)
            : test.subjectWiseMarks;
      } catch (error) {
        console.error("Error parsing subjectWiseMarks:", error);
        subjectMarks = { Physics: 0, Chemistry: 0, Biology: 0 };
      }

      const formattedResult = {
        Physics: subjectMarks.Physics || 0,
        Chemistry: subjectMarks.Chemistry || 0,
        Biology: subjectMarks.Biology || 0,
        updatedAt: test.updatedAt,
      };

      // Log in the desired format

      return formattedResult;
    });

    // Send the data as JSON response
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching subject-wise marks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



// updated controller
const getTestStatistics = async (req, res) => {
  try {
    // 1️⃣ Verify Token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const secret = config.get("jwtSecret");
    const decoded = jwt.verify(token, secret);
    const userId = decoded.id;

    // 2️⃣ Count total tests per category
    const adminTests = await generateTestresult.count({ where: { studentId: userId } });
    const userTests = await MeTest.count({ where: { studentId: userId } });
    const examPlanTests = await FullTestResults.count({
      where: { studentId: userId, testName: { [Op.like]: "System Test%" } },
    });
    const fullTests = await FullTestResults.count({
      where: { studentId: userId, testName: { [Op.like]: "Full Test%" } },
    });

    // 3️⃣ Fetch latest updatedAt timestamps for each category
    const latestFull = await FullTestResults.findOne({
      where: { studentId: userId, testName: { [Op.like]: "Full Test%" } },
      order: [["updatedAt", "DESC"]],
      attributes: ["updatedAt"],
    });

    const latestRecommended = await FullTestResults.findOne({
      where: { studentId: userId, testName: { [Op.like]: "System Test%" } },
      order: [["updatedAt", "DESC"]],
      attributes: ["updatedAt"],
    });

    const latestME = await MeTest.findOne({
      where: { studentId: userId },
      order: [["updatedAt", "DESC"]],
      attributes: ["updatedAt"],
    });

    // 4️⃣ Prepare final response
    res.status(200).json({
      fullTestResults: {
        totalTests: fullTests,
        updatedAt: latestFull?.updatedAt || new Date(),
      },
      recommendedTests: {
        totalTests: examPlanTests,
        updatedAt: latestRecommended?.updatedAt || new Date(),
      },
      meTests: {
        totalTests: userTests,
        updatedAt: latestME?.updatedAt || new Date(),
      },
      adminTests: {
        totalTests: adminTests,
      },
    });
  } catch (error) {
    console.error("Error fetching test statistics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const getPendingTests = async (req, res) => {
  try {
    const { studentId } = req.params; // Get studentId from request params

    // Step 1: Find the batch to which the student belongs using the StudentBatch model
    const studentBatch = await StudentBatch.findOne({
      where: { studentId }, // Find the student's batch association
    });

    if (!studentBatch) {
      return res.status(404).json({
        success: false,
        message: "Student batch not found",
      });
    }

    const batchId = studentBatch.batchId; // Get batchId from the student's batch association

    // Step 2: Fetch all tests assigned to this batch
    const tests = await BatchAdmintest.findAll({
      where: { batchId }, // Fetch tests based on batchId
    });

    const pendingTests = [];

    // Step 3: Check for pending status for each test
    for (const test of tests) {
      const attempt = await generateTestresult.findOne({
        where: { studentId, testid: test.admintestId },
      });

      if (!attempt || attempt.status === "Pending") {
        // If no attempt or the test status is "Pending", add it to pendingTests
        pendingTests.push({
          testId: test.admintestId,
          testname: test.testname,
          status: attempt ? attempt.status : "Not Attempted", // Show the status if available
        });
      }
    }

    if (pendingTests.length > 0) {
      return res.status(200).json({
        success: true,
        pendingTests,
        count: pendingTests.length,
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "No pending tests found.",
      });
    }
  } catch (error) {
    console.error("Error fetching pending tests:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  getStudentName,
  getTestStatistics,
  getSubjectWiseMarks,
  getpendingTest,
  getVerifiedUser,
  getSubjectWiseAverageMarks,
};
