import { Op } from "sequelize";
import FullTestResults from "../models/fullTestResults.model.js";
import Student from "../models/student.model.js";

// Controller to get selected fields of FullTestResults for all students based on test count (ascending)
export const getLastTestResultsPerformanceForAllStudents = async (req, res) => {
  try {
    // Step 1: Get all students along with their full names (firstName, lastName)
    const students = await Student.findAll({
      attributes: ["id", "firstName", "lastName"], // Fetch id, firstName, and lastName
    });

    if (!students || students.length === 0) {
      return res.status(404).json({ message: "No students found." });
    }

    // Step 2: Get only selected test result fields for matching student IDs and include studentId
    const testResults = await FullTestResults.findAll({
      where: {
        studentId: {
          [Op.in]: students.map((student) => student.id), // Match student IDs
        },
      },
      attributes: [
        "studentId", // Include the studentId to show the student's ID
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
    const resultWithFullName = students.map((student, index) => {
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
      const accuracy = ((totalMarksForStudent / totalPossibleMarks) * 100).toFixed(2); // Accuracy formula
      const averageMarks = (totalMarksForStudent / testsTaken).toFixed(2);

      // Update the total marks counters
      totalMarksObtained += totalMarksForStudent;
      totalMarksAvailable += totalPossibleMarks;
      totalTests += testsTaken;

      // Static subject names: Physics, Chemistry, Biology
      const subjectNames = ["Physics", "Chemistry", "Biology"];

      return {
        studentId: student.id,
        fullName: `${student.firstName} ${student.lastName}`,
        subjectWisePerformance: subjectNames, // Only show subject names (Physics, Chemistry, Biology)
        testNames: studentTestResults.map((test) => test.testName), // List of test names
        testsTaken,
        fullTestCount, // Count of how many "Full Test" the student has taken
        accuracy, // Overall accuracy percentage
        averageMarks, // Overall average marks obtained by this student
        totalMarksForStudent, // This will be used to rank students based on average marks
      };
    }).filter((result) => result !== null); // Remove students with no test results

    // Step 5: Sort students by fullTestCount in ascending order (fewer tests = higher rank)
    resultWithFullName.sort((a, b) => a.fullTestCount - b.fullTestCount);

    // Step 6: Assign ranks based on sorted order
    resultWithFullName.forEach((result, index) => {
      result.rank = index + 1; // Rank starts from 1
    });

    // Step 7: Calculate overall averages for all students
    const overallAccuracy = ((totalMarksObtained / totalMarksAvailable) * 100).toFixed(2);
    const overallAverageMarks = (totalMarksObtained / totalTests).toFixed(2);

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
