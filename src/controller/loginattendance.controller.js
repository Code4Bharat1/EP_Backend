import { Op, Sequelize } from "sequelize";
import FullTestResults from "../models/fullTestResults.model.js";
import Saved from "../models/saved.js";
import Student from "../models/student.model.js";
import { RecommendedTest } from "../models/recommendedtest.model.js";

// Controller to get the test count for Full Test, Me Test, Recommend Test by Day
export const getLoginAttendancePerformance = async (req, res) => {
  try {
    // Step 1: Get all students along with their full names (firstName, lastName)
    const students = await Student.findAll({
      attributes: ["id", "firstName", "lastName"], // Fetch id, firstName, and lastName
    });

    if (!students || students.length === 0) {
      return res.status(404).json({ message: "No students found." });
    }

    // Step 2: Get the test results for each student across the three tables, grouped by day
    const fullTestResults = await FullTestResults.findAll({
      where: {
        studentId: {
          [Op.in]: students.map((student) => student.id),
        },
      },
      attributes: [
        "studentId",
        "testName",
        [Sequelize.fn("DATE", Sequelize.col("createdAt")), "day"], // Extract day from createdAt
      ],
      group: ["studentId", "day", "testName"], // Group by studentId, day, and testName
    });

    const savedTestResults = await Saved.findAll({
      where: {
        studentId: {
          [Op.in]: students.map((student) => student.id),
        },
      },
      attributes: [
        "studentId",
        "testName",
        [Sequelize.fn("DATE", Sequelize.col("createdAt")), "day"], // Extract day from createdAt
      ],
      group: ["studentId", "day", "testName"], // Group by studentId, day, and testName
    });

    const recommendTestResults = await RecommendedTest.findAll({
      where: {
        studentId: {
          [Op.in]: students.map((student) => student.id),
        },
      },
      attributes: [
        "studentId",
        "testName",
        [Sequelize.fn("DATE", Sequelize.col("createdAt")), "day"], // Extract day from createdAt
      ],
      group: ["studentId", "day", "testName"], // Group by studentId, day, and testName
    });

    // Step 3: Prepare the results in the required format (studentId, FullTest, MeTest, RecommendedTest, fullName, day)
    const resultWithTestData = students.map((student) => {
      // Fixing potential type mismatch between studentId and test data
      const studentId = Number(student.id);  // Explicitly convert studentId to a number

      const studentFullTestResults = fullTestResults.filter(
        (test) => Number(test.studentId) === studentId  // Ensure comparison is by number
      );
      const studentSavedTestResults = savedTestResults.filter(
        (test) => Number(test.studentId) === studentId  // Ensure comparison is by number
      );
      const studentRecommendTestResults = recommendTestResults.filter(
        (test) => Number(test.studentId) === studentId  // Ensure comparison is by number
      );

      // Group the test results by day and count FullTest, MeTest, and RecommendTest for each day
      const attendanceByDay = {};

      // Counting FullTest for each day
      studentFullTestResults.forEach((test) => {
        const day = test.dataValues.day;
        if (!attendanceByDay[day]) {
          attendanceByDay[day] = { FullTest: 0, MeTest: 0, RecommendedTest: 0 };
        }
        attendanceByDay[day].FullTest += 1; // Increment FullTest count for the day
      });

      // Counting MeTest for each day
      studentSavedTestResults.forEach((test) => {
        const day = test.dataValues.day;
        if (!attendanceByDay[day]) {
          attendanceByDay[day] = { FullTest: 0, MeTest: 0, RecommendedTest: 0 };
        }
        attendanceByDay[day].MeTest += 1; // Increment MeTest count for the day
      });

      // Counting RecommendedTest for each day
      studentRecommendTestResults.forEach((test) => {
        const day = test.dataValues.day;
        if (!attendanceByDay[day]) {
          attendanceByDay[day] = { FullTest: 0, MeTest: 0, RecommendedTest: 0 };
        }
        attendanceByDay[day].RecommendedTest += 1; // Increment RecommendTest count for the day
      });

      const result = {
        studentId: student.id,
        fullName: `${student.firstName} ${student.lastName}`,
        attendance: [],
      };

      // Populate the attendance data for each day
      for (let day in attendanceByDay) {
        result.attendance.push({
          day,
          FullTest: attendanceByDay[day].FullTest,
          MeTest: attendanceByDay[day].MeTest,
          RecommendedTest: attendanceByDay[day].RecommendedTest,
        });
      }

      return result;
    });

    return res.status(200).json({
      message: "Test performance data fetched successfully",
      results: resultWithTestData, // Student-specific test counts with fullName and attendance by day
    });
  } catch (error) {
    console.error("Error fetching test performance data:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
