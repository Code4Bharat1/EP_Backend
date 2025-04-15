import { Sequelize, Op } from "sequelize";
import FullTestResults from "../models/fullTestResults.model.js"; // Import FullTestResults model
import MeTest from "../models/saved.js"; // Import MeTest model
import GenerateTestResult from "../models/generateTestresult.model.js"; // Import GenerateTestResult model
import moment from 'moment'; // Import moment for date manipulation

// Controller to get unique studentId, count of FullTest, count of MeTest, count of GenerateTest, highest mark, total marks, and accuracy for each testName
export const getAttendanceForAllStudents = async (req, res) => {
    try {
        const { studentId, filterType } = req.body; // Get studentId and filterType from the request body

        // Define the date range based on the filter type (weekly, monthly, yearly)
        let dateRange = {};
        const today = moment();

        switch (filterType) {
            case "weekly":
                dateRange = {
                    createdAt: {
                        [Op.gte]: today.startOf('week').toDate(),
                        [Op.lte]: today.endOf('week').toDate(),
                    },
                };
                break;
            case "monthly":
                dateRange = {
                    createdAt: {
                        [Op.gte]: today.startOf('month').toDate(),
                        [Op.lte]: today.endOf('month').toDate(),
                    },
                };
                break;
            case "yearly":
                dateRange = {
                    createdAt: {
                        [Op.gte]: today.startOf('year').toDate(),
                        [Op.lte]: today.endOf('year').toDate(),
                    },
                };
                break;
            default:
                dateRange = {}; // No date filter (fetch all data)
        }

        // Fetch data for FullTestResults
        const fullTestResults = await FullTestResults.findAll({
            attributes: [
                'studentId',
                [Sequelize.fn('COUNT', Sequelize.col('testName')), 'FullTestCount'],
                [Sequelize.fn('MAX', Sequelize.col('marksObtained')), 'highestMarkFull'],
                [Sequelize.fn('MAX', Sequelize.col('totalQuestions')), 'totalQuestionsFull'],
            ],
            group: ['studentId'],
            where: {
                studentId,
                ...dateRange,
            },
        });

        // Fetch data for MeTest
        const meTestResults = await MeTest.findAll({
            attributes: [
                'studentId',
                [Sequelize.fn('COUNT', Sequelize.col('testName')), 'MeTestCount'],
                [Sequelize.fn('MAX', Sequelize.col('score')), 'highestMarkMe'],
                [Sequelize.fn('MAX', Sequelize.col('totalQuestions')), 'totalQuestionsMe'],
                [Sequelize.fn('GROUP_CONCAT', Sequelize.col('testName')), 'MeTestNames']
            ],
            group: ['studentId'],
            where: {
                studentId,
                ...dateRange,
            },
        });

        // Fetch data for GenerateTestResults
        const generateTestResults = await GenerateTestResult.findAll({
            attributes: [
                'studentId',
                [Sequelize.fn('COUNT', Sequelize.col('testname')), 'GenerateTestCount'],
                [Sequelize.fn('MAX', Sequelize.col('score')), 'highestMarkGenerate'],
                [Sequelize.fn('MAX', Sequelize.col('totalquestions')), 'totalQuestionsGenerate'],
                [Sequelize.fn('GROUP_CONCAT', Sequelize.col('testname')), 'GenerateTestNames']
            ],
            group: ['studentId'],
            where: {
                studentId,
                ...dateRange,
            },
        });

        if (!fullTestResults.length && !meTestResults.length && !generateTestResults.length) {
            return res.status(404).json({ message: "No test results found." });
        }

        // Helper function to clean up and extract only the test name from JSON-like strings
        const extractTestNames = (testNames) => {
            if (testNames) {
                return testNames
                    .split(",") // Split by comma if test names are concatenated with commas
                    .map((testName) => {
                        try {
                            const parsed = JSON.parse(testName);
                            return parsed.name || testName; // Return parsed name or original string if not a valid JSON
                        } catch (e) {
                            return testName; // Return as is if not a valid JSON string
                        }
                    })
                    .join(", ");
            }
            return "";
        };

        // Combine the FullTestResults, MeTest, and GenerateTestResult data into a single response per student
        const combinedResults = fullTestResults.map(fullTest => {
            const studentMeTest = meTestResults.find(meTest => meTest.studentId === fullTest.studentId);
            const studentGenerateTest = generateTestResults.find(generateTest => generateTest.studentId === fullTest.studentId);

            // FullTest processing
            const highestMarkFull = fullTest.dataValues.highestMarkFull || 0;
            const totalQuestionsFull = fullTest.dataValues.totalQuestionsFull || 0;
            const totalMarksFull = totalQuestionsFull * 4;
            const accuracyFull = totalMarksFull > 0 ? ((highestMarkFull / totalMarksFull) * 100).toFixed(2) : 0;

            // MeTest processing if available
            const meTestCount = studentMeTest ? studentMeTest.dataValues.MeTestCount : 0;
            const highestMarkMe = studentMeTest ? studentMeTest.dataValues.highestMarkMe : 0;
            const totalQuestionsMe = studentMeTest ? studentMeTest.dataValues.totalQuestionsMe : 0;
            const totalMarksMe = totalQuestionsMe * 4;
            const accuracyMe = totalMarksMe > 0 ? ((highestMarkMe / totalMarksMe) * 100).toFixed(2) : 0;
            const meTestNames = studentMeTest ? extractTestNames(studentMeTest.dataValues.MeTestNames) : "";

            // GenerateTest processing if available
            const generateTestCount = studentGenerateTest ? studentGenerateTest.dataValues.GenerateTestCount : 0;
            const highestMarkGenerate = studentGenerateTest ? studentGenerateTest.dataValues.highestMarkGenerate : 0;
            const totalQuestionsGenerate = studentGenerateTest ? studentGenerateTest.dataValues.totalQuestionsGenerate : 0;
            const totalMarksGenerate = totalQuestionsGenerate * 4;
            const accuracyGenerate = totalMarksGenerate > 0 ? ((highestMarkGenerate / totalMarksGenerate) * 100).toFixed(2) : 0;
            const generateTestNames = studentGenerateTest ? extractTestNames(studentGenerateTest.dataValues.GenerateTestNames) : "";

            // Calculate overall accuracy (average of the three test accuracies)
            const totalAccuracy = (
                (parseFloat(accuracyFull) +
                    parseFloat(accuracyMe) +
                    parseFloat(accuracyGenerate)) / 
                3
            ).toFixed(2);

            return {
                studentId: fullTest.studentId,
                FulltestName: "Full Test",
                FullTestCount: fullTest.dataValues.FullTestCount,
                highestMarkFull,
                totalMarksFull,
                accuracyFull,
                MeTestCount: meTestCount,
                MeTestNames: meTestNames, // All MeTest names concatenated and cleaned
                highestMarkMe,
                totalMarksMe,
                accuracyMe,
                GenerateTestCount: generateTestCount,
                GenerateTestNames: generateTestNames, // All GenerateTest names concatenated and cleaned
                highestMarkGenerate,
                totalMarksGenerate,
                accuracyGenerate,
                totalAccuracy, // Include overall accuracy
            };
        });

        // Step 2: Return the formatted results
        return res.status(200).json({
            message: "Test summaries fetched successfully",
            count: combinedResults.length,
            results: combinedResults,
        });
    } catch (error) {
        console.error("Error fetching test summaries:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
