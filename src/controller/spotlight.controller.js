import { Op } from "sequelize";
import FullTestResults from "../models/fullTestResults.model.js";
import Student from "../models/student.model.js";

// Controller to get selected fields of FullTestResults for all students based on test count (ascending)
export const getLastTestResultsPerformanceForAllStudents = async (req, res) => {
  try {
    // ✔ GET NUMERIC ADMIN ID (same as your working functions)
    const adminId = req.user?.adminId;
    console.log("🔥 Controller: Admin ID =", adminId);

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized - Missing Admin ID" });
    }

    const adminIdStr = String(adminId);

    // ✔ Step 1: Get only this admin's students
    const students = await Student.findAll({
      where: { addedByAdminId: adminIdStr },
      attributes: ["id", "firstName", "lastName"],
    });

    if (!students || students.length === 0) {
      return res.status(200).json({ 
        message: "No students found for this admin.",
        results: [] 
      });
    }

    const studentIds = students.map((student) => student.id);

    // ✔ Step 2: Get test results only for this admin's students
    const testResults = await FullTestResults.findAll({
      where: {
        studentId: {
          [Op.in]: studentIds,
        },
      },
      attributes: [
        "studentId",
        "testName",
        "marksObtained",
        "totalMarks",
        "subjectWisePerformance",
      ],
    });

    // Step 3: Initialize counters for total marks and accuracy calculations
    let totalMarksObtained = 0;
    let totalMarksAvailable = 0;
    let totalTests = 0;

    // Step 4: Combine test results with student fullName, subject names, accuracy, and average marks
    const resultWithFullName = students.map((student) => {
      // Get all test results for the current student
      const studentTestResults = testResults.filter(
        (testResult) => testResult.studentId === student.id
      );

      // If no test results found for this student, skip
      if (studentTestResults.length === 0) {
        return null;
      }

      // Filter only "Full Test" results
      const fullTestResults = studentTestResults.filter(
        (test) => test.testName === "Full Test"
      );

      // Count the number of "Full Test" taken by the student
      const fullTestCount = fullTestResults.length;

      // Count the number of tests this student has taken
      const testsTaken = studentTestResults.length;

      // Calculate total possible marks for the student (tests taken * 720)
      const totalPossibleMarks = testsTaken * 720;

      // Calculate total marks obtained by the student
      const totalMarksForStudent = studentTestResults.reduce(
        (acc, test) => acc + test.marksObtained,
        0
      );

      // Calculate accuracy (overall accuracy) and average marks
      const accuracy = totalPossibleMarks > 0 
        ? ((totalMarksForStudent / totalPossibleMarks) * 100).toFixed(2) 
        : "0.00";
      
      const averageMarks = testsTaken > 0 
        ? (totalMarksForStudent / testsTaken).toFixed(2) 
        : "0.00";

      // Update the total marks counters
      totalMarksObtained += totalMarksForStudent;
      totalMarksAvailable += totalPossibleMarks;
      totalTests += testsTaken;

      // Static subject names: Physics, Chemistry, Biology
      const subjectNames = ["Physics", "Chemistry", "Biology"];

      return {
        studentId: student.id,
        fullName: `${student.firstName} ${student.lastName}`,
        subjectWisePerformance: subjectNames,
        testNames: studentTestResults.map((test) => test.testName),
        testsTaken,
        fullTestCount,
        accuracy,
        averageMarks,
        totalMarksForStudent,
      };
    }).filter((result) => result !== null);

    // Step 5: Sort students by fullTestCount in ascending order (fewer tests = higher rank)
    resultWithFullName.sort((a, b) => a.fullTestCount - b.fullTestCount);

    // Step 6: Assign ranks based on sorted order
    resultWithFullName.forEach((result, index) => {
      result.rank = index + 1;
    });

    // Step 7: Calculate overall averages for all students
    const overallAccuracy = totalMarksAvailable > 0 
      ? ((totalMarksObtained / totalMarksAvailable) * 100).toFixed(2) 
      : "0.00";
    
    const overallAverageMarks = totalTests > 0 
      ? (totalMarksObtained / totalTests).toFixed(2) 
      : "0.00";

    return res.status(200).json({
      message: "Test summaries fetched successfully",
      count: resultWithFullName.length,
      results: resultWithFullName,
      overall: {
        overallAccuracy,
        overallAverageMarks,
      },
    });
  } catch (error) {
    console.error("Error fetching test summaries:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};