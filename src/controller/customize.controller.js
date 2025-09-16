import { Op } from "sequelize";
import GenerateTestResult from "../models/generateTestresult.model.js";  // Import the GenerateTestResult model
import Student from "../models/student.model.js";  // Import the Student model
import moment from 'moment';  // For date manipulation (e.g., to filter by date range)

export const getTestCustomizeSummariesForAllStudents = async (req, res) => {
    try {
        const { filterType } = req.query;
        const  addedByAdminId  = req.adminId

        if (!addedByAdminId) {
            return res.status(400).json({ message: "addedByAdminId is required" });
        }

        // Step 1: Get all students added by this admin
        const students = await Student.findAll({
            where: { addedByAdminId },
            attributes: ["id", "firstName", "lastName"]
        });

        if (!students || students.length === 0) {
            return res.status(404).json({ message: "No students found for this admin." });
        }

        // Step 2: Determine date range
        let dateRange = {};
        switch (filterType) {
            case 'year':
                dateRange = {
                    [Op.or]: [
                        { createdAt: { [Op.gte]: moment().startOf('year').toDate(), [Op.lte]: moment().endOf('year').toDate() } },
                        { updatedAt: { [Op.gte]: moment().startOf('year').toDate(), [Op.lte]: moment().endOf('year').toDate() } }
                    ]
                };
                break;
            case 'month':
                dateRange = {
                    [Op.or]: [
                        { createdAt: { [Op.gte]: moment().startOf('month').toDate(), [Op.lte]: moment().endOf('month').toDate() } },
                        { updatedAt: { [Op.gte]: moment().startOf('month').toDate(), [Op.lte]: moment().endOf('month').toDate() } }
                    ]
                };
                break;
            case 'week':
                dateRange = {
                    [Op.or]: [
                        { createdAt: { [Op.gte]: moment().startOf('week').toDate(), [Op.lte]: moment().endOf('week').toDate() } },
                        { updatedAt: { [Op.gte]: moment().startOf('week').toDate(), [Op.lte]: moment().endOf('week').toDate() } }
                    ]
                };
                break;
            default:
                dateRange = {};
        }

        // Step 3: Fetch test results for these students
        const generateTestResults = await GenerateTestResult.findAll({
            where: {
                studentId: { [Op.in]: students.map(s => s.id) },
                ...dateRange
            },
            attributes: ["studentId", "testname", "score", "totalquestions", "subjectWiseMarks", "createdAt", "updatedAt"]
        });

        // Step 4: Build summaries
        const resultWithFullName = students.map(student => {
            const studentTests = generateTestResults.filter(t => t.studentId === student.id);
            if (!studentTests.length) return null;

            let totalTests = studentTests.length;
            let totalMarksObtained = 0, highestScore = 0;
            let physicsCount = 0, chemistryCount = 0, biologyCount = 0;

            const testsData = studentTests.map(test => {
                const totalMarks = test.totalquestions * 4;
                totalMarksObtained += test.score;
                highestScore = Math.max(highestScore, test.score);

                let subjects = [];
                if (test.subjectWiseMarks) {
                    try {
                        subjects = Object.keys(JSON.parse(test.subjectWiseMarks));
                        subjects.forEach(sub => {
                            if (sub === "Physics") physicsCount++;
                            if (sub === "Chemistry") chemistryCount++;
                            if (sub === "Biology") biologyCount++;
                        });
                    } catch {}
                }

                let testName = test.testname;
                try {
                    const parsedName = JSON.parse(test.testname);
                    testName = parsedName.title || parsedName.name || testName;
                } catch {}

                return {
                    testName,
                    subjects,
                    score: test.score,
                    totalMarks,
                    createdAt: test.createdAt,
                    updatedAt: test.updatedAt
                };
            });

            return {
                fullName: `${student.firstName} ${student.lastName}`,
                studentId: student.id,
                tests: testsData,
                totalMarksObtained,
                totalTests,
                averageMarks: (totalMarksObtained / totalTests).toFixed(2),
                highestScore,
                physicsCount,
                chemistryCount,
                biologyCount
            };
        }).filter(r => r !== null);

        // Step 5: Flatten results
        const flattenedResults = resultWithFullName.flatMap(student =>
            student.tests.map(test => ({
                fullName: student.fullName,
                studentId: student.studentId,
                testName: test.testName,
                subjects: test.subjects,
                score: test.score,
                totalMarks: test.totalMarks,
                totalTests: student.totalTests,
                averageMarks: student.averageMarks,
                highestScore: student.highestScore,
                physicsCount: student.physicsCount,
                chemistryCount: student.chemistryCount,
                biologyCount: student.biologyCount,
                createdAt: test.createdAt,
                updatedAt: test.updatedAt
            }))
        );

        // Step 6: Overall summary
        const overallSummary = {
            totalPhysicsTests: generateTestResults.filter(t => t.subjectWiseMarks.includes("Physics")).length,
            totalChemistryTests: generateTestResults.filter(t => t.subjectWiseMarks.includes("Chemistry")).length,
            totalBiologyTests: generateTestResults.filter(t => t.subjectWiseMarks.includes("Biology")).length,
        };
        overallSummary.totalCount = overallSummary.totalPhysicsTests + overallSummary.totalChemistryTests + overallSummary.totalBiologyTests;

        return res.status(200).json({
            message: "Test summaries fetched successfully",
            count: flattenedResults.length,
            results: flattenedResults,
            overallSummary
        });

    } catch (error) {
        console.error("Error fetching test summaries:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

