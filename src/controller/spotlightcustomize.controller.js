import { Op } from "sequelize";
import MeTest from "../models/saved.js";
import Student from "../models/student.model.js";

// Controller to get performance data for all students based on the MeTest results
export const getLastTestResultsPerformanceForAllStudents1 = async (req, res) => {
    try {
        // ✔ GET NUMERIC ADMIN ID (same as your working functions)
        const adminId = req.user?.adminId;
        console.log("🔥 Customize Controller: Admin ID =", adminId);

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

        // ✔ Step 2: Get MeTest results only for this admin's students
        const meTestResults = await MeTest.findAll({
            where: {
                studentId: {
                    [Op.in]: studentIds,
                },
            },
            attributes: [
                "studentId",
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
                (acc, test) => acc + (test.score || 0),
                0
            );

            // Calculate accuracy (overall accuracy) using totalQuestions and overAllMarks
            const totalPossibleMarks = studentMeTestResults.reduce(
                (acc, test) => acc + (test.totalQuestions || 0) * (test.overAllMarks || 1),
                0
            );

            const accuracy = totalPossibleMarks > 0
                ? ((totalMarksForStudent / totalPossibleMarks) * 100).toFixed(2)
                : "0.00";
            
            const averageMarks = studentMeTestResults.length > 0
                ? (totalMarksForStudent / studentMeTestResults.length).toFixed(2)
                : "0.00";

            // Update the total marks counters
            totalMarksObtained += totalMarksForStudent;
            totalMarksAvailable += totalPossibleMarks;
            totalTests += studentMeTestResults.length;

            // Dynamically extract subject names from subjectWiseMarks
            const subjectWisePerformance = studentMeTestResults.map((test) => {
                try {
                    const parsedSubjectWiseMarks = test.subjectWiseMarks 
                        ? (typeof test.subjectWiseMarks === 'string' 
                            ? JSON.parse(test.subjectWiseMarks) 
                            : test.subjectWiseMarks)
                        : {};
                    return Object.keys(parsedSubjectWiseMarks);
                } catch (error) {
                    console.error("Error parsing subjectWiseMarks:", error);
                    return [];
                }
            }).flat();

            // Remove duplicates from subjectWisePerformance
            const uniqueSubjects = [...new Set(subjectWisePerformance)];

            return {
                studentId: student.id,
                fullName: `${student.firstName} ${student.lastName}`,
                subjectWisePerformance: uniqueSubjects,
                testNames: studentMeTestResults.map((test) => test.testName),
                testsTaken: studentMeTestResults.length,
                accuracy,
                averageMarks,
                totalMarksForStudent,
            };
        }).filter(result => result !== null);

        // Step 5: Sort students by testsTaken to rank them (descending order)
        resultWithFullName.sort((a, b) => b.testsTaken - a.testsTaken);

        // Step 6: Assign ranks based on sorted order
        resultWithFullName.forEach((result, index) => {
            result.rank = index + 1;
        });

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