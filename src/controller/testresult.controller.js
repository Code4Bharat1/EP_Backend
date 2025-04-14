import { Op } from "sequelize";
import FullTestResults from "../models/fullTestResults.model.js";
import Student from "../models/student.model.js";

// Controller to get selected fields of FullTestResults for the last test of all students
export const getLastTestResultsForAllStudents = async (req, res) => {
    try {
        // Step 1: Get all students along with their full names (firstName, lastName)
        const students = await Student.findAll({
            attributes: ["id", "firstName", "lastName"], // Fetch id, firstName, and lastName
        });

        if (!students || students.length === 0) {
            return res.status(404).json({ message: "No students found." });
        }

        // Step 2: Get the last test result for each student
        const lastTestResults = await FullTestResults.findAll({
            where: {
                studentId: {
                    [Op.in]: students.map((student) => student.id), // Match student IDs
                },
            },
            attributes: [
                "studentId", // Include the studentId to show the student's ID
                "marksObtained",
                "totalMarks",
            ],
            order: [["createdAt", "DESC"]], // Order by createdAt to get the last test
        });

        // Step 3: Combine test results with student fullName, total marks, obtained marks
        const resultWithFullName = students.map((student) => {
            const lastTestResult = lastTestResults.find(
                (testResult) => testResult.studentId === student.id
            );

            if (!lastTestResult) {
                return null;
            }

            return {
                studentId: student.id,
                fullName: `${student.firstName} ${student.lastName}`,
                marksObtained: lastTestResult.marksObtained,
                totalMarks: lastTestResult.totalMarks,
            };
        }).filter(result => result !== null); // Remove students with no test results

        return res.status(200).json({
            message: "Last test results fetched successfully",
            count: resultWithFullName.length,
            results: resultWithFullName,
        });
    } catch (error) {
        console.error("Error fetching last test results:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
