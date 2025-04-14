import { Op } from "sequelize";
import MeTest from "../models/saved.js";  // Import the MeTest model
import Student from "../models/student.model.js"; // Import the Student model

// Controller to get performance data for all students based on the MeTest results (customizable test results)
export const getLastTestResultsPerformanceForAllStudents1 = async (req, res) => {
    try {
        // Step 1: Get all students along with their full names (firstName, lastName)
        const students = await Student.findAll({
            attributes: ["id", "firstName", "lastName"], // Fetch id, firstName, and lastName
        });

        if (!students || students.length === 0) {
            return res.status(404).json({ message: "No students found." });
        }

        // Step 2: Get only selected MeTest result fields for matching student IDs and include studentId
        const meTestResults = await MeTest.findAll({
            where: {
                studentId: {
                    [Op.in]: students.map((student) => student.id), // Match student IDs
                },
            },
            attributes: [
                "studentId", // Include the studentId to show the student's ID
                "testName",
                "selectedChapters",
                "difficultyLevel",
                "status",
                "score",
                "totalQuestions",
                "overAllMarks",
                "subjectWiseMarks",
            ],
        });

        // Step 3: Initialize counters for total marks and accuracy calculations
        let totalMarksObtained = 0;
        let totalMarksAvailable = 0;
        let totalTests = 0;

        // Step 4: Combine test results with student fullName, subject names, accuracy, and average marks
        const resultWithFullName = students.map((student) => {
            // Get all test results for the current student
            const studentMeTestResults = meTestResults.filter(
                (testResult) => testResult.studentId === student.id
            );

            // If no test results found for this student, skip
            if (studentMeTestResults.length === 0) {
                return null;
            }

            // Calculate total marks obtained by the student
            const totalMarksForStudent = studentMeTestResults.reduce(
                (acc, test) => acc + test.score,
                0
            );

            // Calculate accuracy (overall accuracy) using totalQuestions and overAllMarks
            const totalPossibleMarks = studentMeTestResults.reduce(
                (acc, test) => acc + test.totalQuestions * test.overAllMarks,
                0
            );

            const accuracy = ((totalMarksForStudent / totalPossibleMarks) * 100).toFixed(2); // Accuracy formula
            const averageMarks = (totalMarksForStudent / studentMeTestResults.length).toFixed(2);

            // Update the total marks counters
            totalMarksObtained += totalMarksForStudent;
            totalMarksAvailable += totalPossibleMarks;
            totalTests += studentMeTestResults.length;

            // Dynamically extract subject names from subjectWiseMarks
            const subjectWisePerformance = studentMeTestResults.map((test) => {
                const parsedSubjectWiseMarks = test.subjectWiseMarks ? JSON.parse(test.subjectWiseMarks) : {};

                // Get all the subject names dynamically from the parsed subjectWiseMarks
                return Object.keys(parsedSubjectWiseMarks); // Get only the subject names
            }).flat(); // Flatten the array to get all subjects in one array

            // Remove duplicates from subjectWisePerformance (if any subject appears multiple times)
            const uniqueSubjects = [...new Set(subjectWisePerformance)];

            return {
                studentId: student.id,
                fullName: `${student.firstName} ${student.lastName}`,
                subjectWisePerformance: uniqueSubjects, // Only subject names (without marks)
                testNames: studentMeTestResults.map((test) => test.testName), // List of test names
                testsTaken: studentMeTestResults.length, // Count of tests taken
                accuracy, // Overall accuracy percentage
                averageMarks, // Overall average marks obtained by this student
                totalMarksForStudent, // This will be used to rank students based on marks
            };
        }).filter(result => result !== null); // Remove students with no test results

        // Step 5: Sort students by testsTaken to rank them (descending order)
        resultWithFullName.sort((a, b) => b.testsTaken - a.testsTaken); // Rank by testsTaken

        // Step 6: Assign ranks based on sorted order
        resultWithFullName.forEach((result, index) => {
            result.rank = index + 1; // Rank starts from 1
        });

        // Send the final response
        return res.status(200).json({
            message: "Test summaries for MeTest fetched successfully",
            count: resultWithFullName.length,
            results: resultWithFullName,
        });
    } catch (error) {
        console.error("Error fetching MeTest summaries:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
