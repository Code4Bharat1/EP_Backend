import { Op } from "sequelize";
import MeTest from "../models/saved.js";  // Import the MeTest model
import Student from "../models/student.model.js";  // Import the Student model

// Controller to get selected fields of MeTest for the last test of all students
export const getLastTestResultsForAllStudents1 = async (req, res) => {
    try {
        // Step 1: Get all students along with their full names (firstName, lastName)
        const students = await Student.findAll({
            attributes: ["id", "firstName", "lastName"], // Fetch id, firstName, and lastName
        });

        if (!students || students.length === 0) {
            return res.status(404).json({ message: "No students found." });
        }

        // Step 2: Get the last test result for each student from the MeTest table
        const lastTestResults = await MeTest.findAll({
            where: {
                studentId: {
                    [Op.in]: students.map((student) => student.id), // Match student IDs
                },
            },
            attributes: [
                "studentId", // Include the studentId to show the student's ID
                "totalQuestions", // Include the total number of questions
                "overAllMarks", // Include the overall marks
            ],
            order: [["createdAt", "DESC"]], // Order by createdAt to get the last test
        });

        // Step 3: Combine test results with student fullName and calculate score based on totalQuestions
        const resultWithFullName = students.map((student) => {
            const lastTestResult = lastTestResults.find(
                (testResult) => testResult.studentId === student.id
            );

            if (!lastTestResult) {
                return null;
            }

            // Calculate the score (totalQuestions * 4)
            const score = lastTestResult.totalQuestions * 4;

            return {
                studentId: student.id,
                fullName: `${student.firstName} ${student.lastName}`,
                marksObtained: lastTestResult.overAllMarks, // Include overall marks
                totalMarks:score, // Calculate score based on totalQuestions * 4
            };
        }).filter(result => result !== null); // Remove students with no test results

        return res.status(200).json({
            message: "Last MeTest results fetched successfully",
            count: resultWithFullName.length,
            results: resultWithFullName,
        });
    } catch (error) {
        console.error("Error fetching last MeTest results:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
