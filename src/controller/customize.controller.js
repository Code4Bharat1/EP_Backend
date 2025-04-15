import { Op } from "sequelize";
import GenerateTestResult from "../models/generateTestresult.model.js";  // Import the GenerateTestResult model
import Student from "../models/student.model.js";  // Import the Student model
import moment from 'moment';  // For date manipulation (e.g., to filter by date range)

export const getTestCustomizeSummariesForAllStudents = async (req, res) => {
    try {
        const { filterType, studentId } = req.query; // Can be 'year', 'month', or 'week' and optionally 'studentId'

        // Step 1: Get all students or a specific student based on studentId query
        let students = [];

        if (studentId) {
            // If studentId is provided, fetch that student only
            students = await Student.findAll({
                where: { id: studentId },
                attributes: ["id", "firstName", "lastName"],
            });
        } else {
            // Fetch all students if no studentId is provided
            students = await Student.findAll({
                attributes: ["id", "firstName", "lastName"], // Fetch id, firstName, and lastName
            });
        }

        if (!students || students.length === 0) {
            return res.status(404).json({ message: "No students found." });
        }

        // Step 2: Determine the date range based on the filter
        let dateRange = {};

        switch (filterType) {
            case 'year':
                dateRange = {
                    [Op.or]: [
                        {
                            createdAt: {
                                [Op.gte]: moment().startOf('year').toDate(),
                                [Op.lte]: moment().endOf('year').toDate()
                            }
                        },
                        {
                            updatedAt: {
                                [Op.gte]: moment().startOf('year').toDate(),
                                [Op.lte]: moment().endOf('year').toDate()
                            }
                        }
                    ]
                };
                break;
            case 'month':
                dateRange = {
                    [Op.or]: [
                        {
                            createdAt: {
                                [Op.gte]: moment().startOf('month').toDate(),
                                [Op.lte]: moment().endOf('month').toDate()
                            }
                        },
                        {
                            updatedAt: {
                                [Op.gte]: moment().startOf('month').toDate(),
                                [Op.lte]: moment().endOf('month').toDate()
                            }
                        }
                    ]
                };
                break;
            case 'week':
                dateRange = {
                    [Op.or]: [
                        {
                            createdAt: {
                                [Op.gte]: moment().startOf('week').toDate(),
                                [Op.lte]: moment().endOf('week').toDate()
                            }
                        },
                        {
                            updatedAt: {
                                [Op.gte]: moment().startOf('week').toDate(),
                                [Op.lte]: moment().endOf('week').toDate()
                            }
                        }
                    ]
                };
                break;
            default:
                dateRange = {};  // No filter
        }

        // Step 3: Get GenerateTestResults for each student from the GenerateTestResult table
        const generateTestResults = await GenerateTestResult.findAll({
            where: {
                studentId: {
                    [Op.in]: students.map((student) => student.id), // Match student IDs
                },
                ...dateRange  // Apply date range filter
            },
            attributes: [
                "studentId", // studentId to link the student
                "testname",   // Test name
                "score",      // Obtained score in the test
                "totalquestions", // Total questions in the test
                "subjectWiseMarks", // Subject-wise marks if needed
                "createdAt", // Added to filter based on created date
                "updatedAt"  // Added to filter based on updated date
            ],
        });

        // Step 4: Initialize counters for totalTests, averageMarks, subject counts, and highest marks
        const resultWithFullName = students.map((student) => {
            // Get all GenerateTestResults for the current student
            const studentGenerateTestResults = generateTestResults.filter(
                (testResult) => testResult.studentId === student.id
            );

            // If no test results found for this student, skip
            if (studentGenerateTestResults.length === 0) {
                return null;
            }

            // Initialize counters for totalTests, averageMarks, subject-specific counts, and highest marks
            let totalTests = studentGenerateTestResults.length;
            let totalMarksObtained = 0;
            let physicsCount = 0, chemistryCount = 0, biologyCount = 0; // Initialize subject counts
            let highestScore = 0;  // Track highest score

            // Extract data for each test
            const testsData = studentGenerateTestResults.map((test) => {
                const totalMarks = test.totalquestions * 4;
                totalMarksObtained += test.score;

                // Update highest score if the current test has a higher score
                highestScore = Math.max(highestScore, test.score);

                // Extract subjects from subjectWiseMarks (assuming it is a JSON object)
                let subjectWisePerformance = [];
                if (test.subjectWiseMarks) {
                    try {
                        const parsedSubjectWiseMarks = JSON.parse(test.subjectWiseMarks);
                        subjectWisePerformance = Object.keys(parsedSubjectWiseMarks); // Extract subject names
                    } catch (error) {
                        console.error("Error parsing subjectWiseMarks:", error);
                    }
                }

                // Count the subject-wise tests
                subjectWisePerformance.forEach((subject) => {
                    if (subject === "Physics") physicsCount++;
                    if (subject === "Chemistry") chemistryCount++;
                    if (subject === "Biology") biologyCount++;
                });

                // Parsing testName to handle JSON strings or plain strings
                let testName = test.testname;
                try {
                    // Try parsing the testname if it's in JSON format
                    const parsedTestName = JSON.parse(test.testname);
                    if (parsedTestName.title) {
                        testName = parsedTestName.title;  // If the test name is inside `title`, use it
                    } else if (parsedTestName.name) {
                        testName = parsedTestName.name;  // If the test name is inside `name`, use it
                    }
                } catch (error) { }

                return {
                    testName: testName,  // Test name (parsed or plain)
                    subjects: subjectWisePerformance, // List of subjects (extracted from subjectWiseMarks)
                    score: test.score,       // Test score
                    totalMarks: totalMarks,  // Total marks (calculated as totalquestions * 4)
                    createdAt: test.createdAt, // Add createdAt to the test data
                    updatedAt: test.updatedAt  // Add updatedAt to the test data
                };
            });

            const averageMarks = (totalMarksObtained / totalTests).toFixed(2);

            return {
                fullName: `${student.firstName} ${student.lastName}`,
                studentId: student.id,
                tests: testsData,
                totalMarksObtained,
                totalTests,
                averageMarks,
                highestScore,  // Add highest score to the data
                physicsCount,   // Physics test count
                chemistryCount, // Chemistry test count
                biologyCount,   // Biology test count
            };
        }).filter(result => result !== null); // Remove any null results

        // Step 5: Flatten the results and format them accordingly
        const flattenedResults = resultWithFullName.flatMap(student => {
            return student.tests.map(test => ({
                fullName: student.fullName,
                studentId: student.studentId,
                testName: test.testName, // Display the parsed test name
                subjects: test.subjects,
                score: test.score,
                totalMarks: test.totalMarks,
                totalTests: student.totalTests,
                averageMarks: student.averageMarks,
                highestScore: student.highestScore,  // Include highest score
                physicsCount: student.physicsCount,   // Physics test count
                chemistryCount: student.chemistryCount, // Chemistry test count
                biologyCount: student.biologyCount,   // Biology test count
                createdAt: test.createdAt, // Added createdAt to test data
                updatedAt: test.updatedAt  // Added updatedAt to test data
            }));
        });

        // Step 6: Add overall summary for the total tests by subject for all students
        const overallSummary = {
            totalPhysicsTests: generateTestResults.filter(test => test.subjectWiseMarks.includes("Physics")).length,
            totalChemistryTests: generateTestResults.filter(test => test.subjectWiseMarks.includes("Chemistry")).length,
            totalBiologyTests: generateTestResults.filter(test => test.subjectWiseMarks.includes("Biology")).length,
            totalCount: 0, // Initialize the total count
        };

        // Calculate the total count by adding the individual test counts
        overallSummary.totalCount = overallSummary.totalPhysicsTests + overallSummary.totalChemistryTests + overallSummary.totalBiologyTests;

        // Step 7: Return the final response
        return res.status(200).json({
            message: "Test summaries for GenerateTestResults fetched successfully",
            count: flattenedResults.length,
            results: flattenedResults,
            overallSummary: overallSummary
        });
    } catch (error) {
        console.error("Error fetching GenerateTestResults summaries:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
