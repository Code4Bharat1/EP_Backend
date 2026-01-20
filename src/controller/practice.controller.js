//  practice.controller.js

import { Op } from "sequelize";
import MeTest from "../models/saved.js";  // Import the MeTest model
import FullTestResults from "../models/fullTestResults.model.js";  // Import the FullTestResults model
import Student from "../models/student.model.js";  // Import the Student model

// Unified Controller to get highest test results for all students (both FullTest and MeTest)
export const getHighestTestResultsForAdminStudents = async (req, res) => {
    try {
        const { adminId } = req.user // or req.query (depends on your route)

        if (!adminId) {
            return res.status(400).json({ message: "Admin ID is required." });
        }

        // Step 1: Get all students created by this admin
        const students = await Student.findAll({
            where: { addedByAdminId: adminId }, // <-- filter students by admin
            attributes: ["id", "firstName", "lastName"],
        });

        if (!students || students.length === 0) {
            return res.status(404).json({ message: "No students found for this admin." });
        }

        // Step 2: Get all FullTestResults for these students
        const fullTestResults = await FullTestResults.findAll({
            where: {
                studentId: {
                    [Op.in]: students.map((student) => student.id),
                },
            },
            attributes: ["studentId", "testName", "marksObtained", "totalQuestions"],
        });

        // Step 3: Get all MeTest results for these students
        const meTestResults = await MeTest.findAll({
            where: {
                studentId: {
                    [Op.in]: students.map((student) => student.id),
                },
            },
            attributes: ["studentId", "testName", "score", "totalQuestions"],
        });

        // Step 4: Prepare results (same as before, but now only for admin's students)
        const results = students
            .map((student) => {
                const studentFullTestResults = fullTestResults.filter(
                    (test) => test.studentId === student.id
                );
                const studentMeTestResults = meTestResults.filter(
                    (test) => test.studentId === student.id
                );

                if (studentFullTestResults.length === 0 && studentMeTestResults.length === 0) {
                    return null;
                }

                const highestFullTestResult = studentFullTestResults.reduce(
                    (prev, current) =>
                        prev.marksObtained > current.marksObtained ? prev : current,
                    { marksObtained: 0 }
                );

                const highestMeTestResult = studentMeTestResults.reduce(
                    (prev, current) => (prev.score > current.score ? prev : current),
                    { score: 0 }
                );

                const subjectNames = ["Physics", "Chemistry", "Biology"];
                const resultsArr = [];

                if (highestFullTestResult.marksObtained > 0) {
                    resultsArr.push({
                        fullName: `${student.firstName} ${student.lastName}`,
                        studentId: student.id,
                        testName: highestFullTestResult.testName,
                        subject: subjectNames.join(", "),
                        marksObtained: highestFullTestResult.marksObtained,
                        totalMarks: highestFullTestResult.totalQuestions * 4,
                    });
                }

                if (highestMeTestResult.score > 0) {
                    resultsArr.push({
                        fullName: `${student.firstName} ${student.lastName}`,
                        studentId: student.id,
                        testName: highestMeTestResult.testName,
                        subject: subjectNames.join(", "),
                        marksObtained: highestMeTestResult.score,
                        totalMarks: highestMeTestResult.totalQuestions * 4,
                    });
                }

                return resultsArr;
            })
            .filter((r) => r !== null)
            .flat();

        return res.status(200).json({
            message: "Highest test results for admin's students fetched successfully",
            count: results.length,
            results,
        });
    } catch (error) {
        console.error("Error fetching results:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

