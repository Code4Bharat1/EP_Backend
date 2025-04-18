import { Sequelize, Op } from "sequelize";
import FullTestResults from "../models/fullTestResults.model.js"; // Import FullTestResults model
import MeTest from "../models/saved.js"; // Import MeTest model
import GenerateTestResult from "../models/generateTestresult.model.js"; // Import GenerateTestResult model
import moment from 'moment'; // Import moment for date manipulation

// Controller to get unique studentId, last result of each test name, marks, and other details
export const getLastTestResultsForAllStudents = async (req, res) => {
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

        // Fetch the last result for FullTestResults
        const lastFullTestResult = await FullTestResults.findOne({
            attributes: [
                'studentId',
                'testName',
                'marksObtained',
                'totalQuestions',
                'createdAt',
                'updatedAt',  // Adding updatedAt field
            ],
            where: {
                studentId,
                ...dateRange,
            },
            order: [['createdAt', 'DESC']], // Sort by createdAt descending to get the last result
        });

        // Fetch the last result for MeTest
        const lastMeTestResult = await MeTest.findOne({
            attributes: [
                'studentId',
                'testName',
                'score',
                'totalQuestions',
                'createdAt',
                'updatedAt',  // Adding updatedAt field
            ],
            where: {
                studentId,
                ...dateRange,
            },
            order: [['createdAt', 'DESC']], // Sort by createdAt descending to get the last result
        });

        // Fetch the last result for GenerateTestResults
        const lastGenerateTestResult = await GenerateTestResult.findOne({
            attributes: [
                'studentId',
                'testname',
                'score',
                'totalquestions',
                'createdAt',
                'updatedAt',  // Adding updatedAt field
            ],
            where: {
                studentId,
                ...dateRange,
            },
            order: [['createdAt', 'DESC']], // Sort by createdAt descending to get the last result
        });

        // Check if there are no results for any of the tests
        if (!lastFullTestResult && !lastMeTestResult && !lastGenerateTestResult) {
            return res.status(404).json({ message: "No test results found." });
        }

        // Helper function to calculate accuracy, totalMarks, and overall totals
        const calculateAccuracyAndTotalMarks = (marksObtained, totalQuestions) => {
            const totalMarks = totalQuestions * 4; // Calculate totalMarks as totalQuestions * 4
            const accuracy = totalMarks > 0 ? ((marksObtained / totalMarks) * 100).toFixed(2) : 0;
            return { accuracy, totalMarks };
        };

        // Initialize variables for overall totals
        let overallMarks = 0;
        let overallTotalQuestions = 0;

        // Format the response by including the most recent result for each test
        const results = [];

        if (lastFullTestResult) {
            const { accuracy, totalMarks } = calculateAccuracyAndTotalMarks(lastFullTestResult.marksObtained, lastFullTestResult.totalQuestions);
            results.push({
                studentId: lastFullTestResult.studentId,
                testName: lastFullTestResult.testName,
                marks: lastFullTestResult.marksObtained,
                totalQuestions: lastFullTestResult.totalQuestions,
                totalMarks: totalMarks, // Added totalMarks field
                accuracy: accuracy,
                testType: 'Full Test',
                createdAt: lastFullTestResult.createdAt,
                updatedAt: lastFullTestResult.updatedAt,  // Adding updatedAt field
            });

            // Add to overall totals
            overallMarks += lastFullTestResult.marksObtained;
            overallTotalQuestions += lastFullTestResult.totalQuestions;
        }

        if (lastMeTestResult) {
            const { accuracy, totalMarks } = calculateAccuracyAndTotalMarks(lastMeTestResult.score, lastMeTestResult.totalQuestions);
            results.push({
                studentId: lastMeTestResult.studentId,
                testName: lastMeTestResult.testName,
                marks: lastMeTestResult.score,
                totalQuestions: lastMeTestResult.totalQuestions,
                totalMarks: totalMarks, // Added totalMarks field
                accuracy: accuracy,
                testType: 'Me Test',
                createdAt: lastMeTestResult.createdAt,
                updatedAt: lastMeTestResult.updatedAt,  // Adding updatedAt field
            });

            // Add to overall totals
            overallMarks += lastMeTestResult.score;
            overallTotalQuestions += lastMeTestResult.totalQuestions;
        }

        if (lastGenerateTestResult) {
            const { accuracy, totalMarks } = calculateAccuracyAndTotalMarks(lastGenerateTestResult.score, lastGenerateTestResult.totalquestions);
            results.push({
                studentId: lastGenerateTestResult.studentId,
                testName: lastGenerateTestResult.testname,
                marks: lastGenerateTestResult.score,
                totalQuestions: lastGenerateTestResult.totalquestions,
                totalMarks: totalMarks, // Added totalMarks field
                accuracy: accuracy,
                testType: 'Generate Test',
                createdAt: lastGenerateTestResult.createdAt,
                updatedAt: lastGenerateTestResult.updatedAt,  // Adding updatedAt field
            });

            // Add to overall totals
            overallMarks += lastGenerateTestResult.score;
            overallTotalQuestions += lastGenerateTestResult.totalquestions;
        }

        // Add the overall totals to the response
        return res.status(200).json({
            message: "Test summaries fetched successfully",
            results: results,
            lastOverallMark: overallMarks,         // Total marks across all tests
            overallTotalQuestions: overallTotalQuestions, // Total questions across all tests
        });
    } catch (error) {
        console.error("Error fetching test summaries:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
