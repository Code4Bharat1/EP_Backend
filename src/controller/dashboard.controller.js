import jwt from "jsonwebtoken";
import config from "config";
import Student from "../models/student.model.js";
import MeTest from "../models/saved.js";
import FullTestResults from "../models/fullTestResults.model.js";
import { Op, fn, col, where } from "sequelize";
import generateTestresult from "../models/generateTestresult.model.js";
import { RecommendedTest } from "../models/recommendedtest.model.js";

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

const getTestStatistics = async (req, res) => {
  try {
    // ✅ Extract token from header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const secret = config.get("jwtSecret");
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Invalid or expired token" });
    }

    const userId = decoded.id;

    // ---------- COUNT QUERIES ----------

    const adminTests = await generateTestresult.count({
      where: {  studentId: userId }   // assuming you have a createdBy field
    });

    let userTests = 0;
    if (MeTest.rawAttributes.hasOwnProperty("createdBy")) {
      userTests = await MeTest.count({
        where: { createdBy: userId },
      });
    } else if (MeTest.rawAttributes.hasOwnProperty("studentId")) {
      userTests = await MeTest.count({
        where: { studentId: userId },
      });
    }
// yahan pe hum status add karenge in the  generateTestresult model kyuki wahan pe bata nhi rha h ki student ne test complete kiya ya nhi
    const examPlanTests = await FullTestResults.count({
      where: {
        studentId: userId,
        testName: { [Op.like]: "System Test%" }, // Matches testName starting with 'SystemTest'
      },
    });

    const fullTests = await FullTestResults.count({
      where: { studentId: userId,
         testName: { [Op.like]:"Full Test" }},
    });

    const totalTests = adminTests+ userTests + examPlanTests + fullTests;

    // ---------- RESPONSE ----------
    const result = {
      totalTests,
      adminTests,
      userTests,
      examPlanTests,
      fullTests,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching test statistics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getRecentTests = async (req, res) => {
  try {
    // ✅ Extract token from header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const secret = config.get("jwtSecret");
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Invalid or expired token" });
    }

    const userId = decoded.id;

    // ---------- QUERY: Recent Admin Tests ----------
    const adminTests = await generateTestresult.findAll({
      where: { studentId: userId },
      order: [['createdAt', 'DESC']],  // Sort by most recent
      limit: 5,  // Fetch the most recent 5 admin tests
      attributes: ['testname', 'score', 'createdAt', ]  // You can customize the fields as needed
    });

    // ---------- QUERY: Recent User Tests ----------
    const userTests = await MeTest.findAll({
      where: { studentId: userId },
      order: [['createdAt', 'DESC']],  // Sort by most recent
      limit: 5,  // Fetch the most recent 5 user tests
      attributes: ['testname', 'score', 'createdAt']  // Customize the fields as needed
    });

    // ---------- QUERY: Recent Exam Plan Tests ----------
    const examPlanTests = await FullTestResults.findAll({
      where: {
        studentId: userId,
        testName: { [Op.like]: "System Test%" },  // Matches tests starting with 'System Test'
      },
      order: [['createdAt', 'DESC']],  // Sort by most recent
      limit: 5,  // Fetch the most recent 5 exam plan tests
      attributes: ['testname','correctAnswersCount','createdAt', ]  // Customize the fields as needed
    });

    // ---------- QUERY: Recent Full Tests ----------
    const fullTests = await FullTestResults.findAll({
      where: {
        studentId: userId,
        testName: { [Op.like]: "Full Test%" },  // Matches tests starting with 'Full Test'
      },
      order: [['createdAt', 'DESC']],  // Sort by most recent
      limit: 5,  // Fetch the most recent 5 full tests
      attributes: ['testname','correctAnswersCount', 'createdAt',]  // Customize the fields as needed
    });

    // Combine the results
    const result = {
      adminTests,
      userTests,
      examPlanTests,
      fullTests,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching recent test statistics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getTestAccuracy = async (req, res) => {
  try {
    // ✅ Extract token from header
    const token = req.headers.authorization?.split(" ")[1];
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

    // Function to calculate accuracy
    const calculateAccuracy = (correctAnswers, totalQuestions) => {
      return totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    };

    // ---------- Admin Tests Accuracy ----------
    const adminTests = await generateTestresult.findAll({
      where: { studentId: userId },
      order: [['createdAt', 'DESC']],  // Sort by most recent
      limit: 5,
      attributes: ['testname', 'correctAnswers', 'totalquestions', 'subjectWiseMarks']
    });

    // ---------- User Tests Accuracy ----------
    const userTests = await MeTest.findAll({
      where: { studentId: userId },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['testname', 'score', 'totalQuestions', 'subjectWiseMarks']
    });

    // ---------- Exam Plan Tests Accuracy ----------
    const examPlanTests = await FullTestResults.findAll({
      where: {
        studentId: userId,
        testName: { [Op.like]: "System Test%" }
      },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['testname', 'correctAnswers', 'totalquestions', 'subjectWisePerformance']
    });

    // ---------- Full Tests Accuracy ----------
    const fullTests = await FullTestResults.findAll({
      where: {
        studentId: userId,
        testName: { [Op.like]: "Full Test%" }
      },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['testname', 'correctAnswers', 'totalquestions', 'subjectWisePerformance']
    });

    // Calculate accuracy for all tests
    const calculateSubjectAccuracy = (subjectWiseMarks, subject) => {
      return subjectWiseMarks && subjectWiseMarks[subject] 
        ? (subjectWiseMarks[subject] / subjectWiseMarks.total) * 100 
        : 0;
    };

    // ---------- Result Preparation ----------
    const result = {
      adminTests: adminTests.map(test => {
        const accuracy = calculateAccuracy(test.correctAnswers, test.totalquestions);
        return {
          testname: test.testname,
          accuracy,
          phy: calculateSubjectAccuracy(test.subjectWiseMarks, "phy"),
          chem: calculateSubjectAccuracy(test.subjectWiseMarks, "chem"),
          bio: calculateSubjectAccuracy(test.subjectWiseMarks, "bio")
        };
      }),
      userTests: userTests.map(test => {
        const accuracy = calculateAccuracy(test.correctAnswers, test.totalquestions);
        return {
          testname: test.testname,
          accuracy,
          phy: calculateSubjectAccuracy(test.subjectWiseMarks, "phy"),
          chem: calculateSubjectAccuracy(test.subjectWiseMarks, "chem"),
          bio: calculateSubjectAccuracy(test.subjectWiseMarks, "bio")
        };
      }),
      examPlanTests: examPlanTests.map(test => {
        const accuracy = calculateAccuracy(test.correctAnswers, test.totalquestions);
        return {
          testname: test.testname,
          accuracy,
          phy: calculateSubjectAccuracy(test.subjectWiseMarks, "phy"),
          chem: calculateSubjectAccuracy(test.subjectWiseMarks, "chem"),
          bio: calculateSubjectAccuracy(test.subjectWiseMarks, "bio")
        };
      }),
      fullTests: fullTests.map(test => {
        const accuracy = calculateAccuracy(test.correctAnswers, test.totalquestions);
        return {
          testname: test.testname,
          accuracy,
          phy: calculateSubjectAccuracy(test.subjectWiseMarks, "phy"),
          chem: calculateSubjectAccuracy(test.subjectWiseMarks, "chem"),
          bio: calculateSubjectAccuracy(test.subjectWiseMarks, "bio")
        };
      })
    };

    res.status(200).json(result);

  } catch (error) {
    console.error("Error fetching accuracy of tests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


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

export {
  getStudentName,
  getTestStatistics,
  getSubjectWiseMarks,
  getpendingTest,
  getVerifiedUser,
  getSubjectWiseAverageMarks,
  getRecentTests,
  getTestAccuracy,
};
