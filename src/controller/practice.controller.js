import { Op } from "sequelize";
import MeTest from "../models/saved.js";  // Import the MeTest model
import FullTestResults from "../models/fullTestResults.model.js";  // Import the FullTestResults model
import Student from "../models/student.model.js";  // Import the Student model

// Unified Controller to get highest test results for all students (both FullTest and MeTest)
export const getHighestTestResultsForAllStudents = async (req, res) => {
    try {
        // Step 1: Get all students along with their full names (firstName, lastName)
        const students = await Student.findAll({
            attributes: ["id", "firstName", "lastName"], // Fetch id, firstName, and lastName
        });

        if (!students || students.length === 0) {
            return res.status(404).json({ message: "No students found." });
        }

        // Step 2: Get FullTestResults for each student from the FullTestResults table
        const fullTestResults = await FullTestResults.findAll({
            where: {
                studentId: {
                    [Op.in]: students.map((student) => student.id), // Match student IDs
                },
            },
            attributes: [
                "id",
                "studentId", // studentId to link the student
                "testName",  // Name of the test
                "marksObtained", // Total marks obtained in the test
                "totalMarks",  // Total possible marks in the test
            ],
        });

        // Step 3: Get MeTest results for each student from the MeTest table
        const meTestResults = await MeTest.findAll({
            where: {
                studentId: {
                    [Op.in]: students.map((student) => student.id), // Match student IDs
                },
            },
            attributes: [
                "id",
                "studentId", // studentId to link the student
                "testName",  // Name of the test
                "score", // Obtained score in the test
                "totalQuestions", // Total number of questions in the test
            ],
        });

        // Step 4: Initialize array to store results for both test types
        const resultWithFullName = students.map((student) => {
            // Get all FullTestResults for the current student
            const studentFullTestResults = fullTestResults.filter(
                (testResult) => testResult.studentId === student.id
            );

            // Get all MeTest results for the current student
            const studentMeTestResults = meTestResults.filter(
                (testResult) => testResult.studentId === student.id
            );

            // If no test results found for this student, skip
            if (studentFullTestResults.length === 0 && studentMeTestResults.length === 0) {
                return null;
            }

            // Step 5: Find the highest score from FullTestResults
            const highestFullTestResult = studentFullTestResults.reduce((prev, current) => {
                return prev.marksObtained > current.marksObtained ? prev : current;
            }, { marksObtained: 0 });

            // Step 6: Find the highest score from MeTest
            const highestMeTestResult = studentMeTestResults.reduce((prev, current) => {
                return prev.score > current.score ? prev : current;
            }, { score: 0 });

            // Step 7: Calculate the total marks for MeTest (totalQuestions * 4)
            const totalMarksMeTest = highestMeTestResult.totalQuestions * 4;

            // Step 8: Constant subjects
            const subjectNames = ["Physics", "Chemistry", "Biology"];

            // Step 9: Prepare the result with both FullTest and MeTest entries for the student
            const results = [];

            // Only include results if the student has FullTest data
            if (highestFullTestResult.marksObtained > 0) {
                results.push({
                    fullName: `${student.firstName} ${student.lastName}`,
                    studentId: student.id, // Include studentId
                    testName: highestFullTestResult.testName,
                    subject: subjectNames.join(", "),
                    marksObtained: highestFullTestResult.marksObtained,
                    totalMarks: highestFullTestResult.totalMarks,
                });
            }

            // Only include results if the student has MeTest data
            if (highestMeTestResult.score > 0) {
                results.push({
                    fullName: `${student.firstName} ${student.lastName}`,
                    studentId: student.id, // Include studentId
                    testName: highestMeTestResult.testName,
                    subject: subjectNames.join(", "),
                    marksObtained: highestMeTestResult.score,
                    totalMarks: totalMarksMeTest,
                });
            }

            return results;
        }).filter(result => result !== null); // Remove students with no test results

        // Flatten the array and return the results in the final response
        const flattenedResults = resultWithFullName.flat();

        // Step 10: Return the final response with the adjusted output format
        return res.status(200).json({
            message: "Highest Test Results fetched successfully",
            count: flattenedResults.length,
            results: flattenedResults,
        });
    } catch (error) {
        console.error("Error fetching highest test results:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
