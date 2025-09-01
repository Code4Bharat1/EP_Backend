import { Op } from "sequelize";
import Student from "../models/student.model.js";
import GenerateTestResult from "../models/generateTestresult.model.js";
import FullTestResults from "../models/fullTestResults.model.js";
import MeTest from '../models/saved.js';
import { Question } from "../models/everytestmode.refrence.js";
import fs from 'fs';
import path from 'path';
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


export const allTestReviewByTestType = async (req, res) => {
    try {
        const { testType, testId } = req.params;

        // Validate that testType and testId are provided
        if (!testType || !testId) {
            return res.status(400).json({
                message: "testType and testId are required"
            });
        }

        let testData;
        let questionIds = [];
        let questions = [];

        // Fetch the test data based on testType
        if (testType === "fulltest") {
            // Search in FullTestResults based on testId
            testData = await FullTestResults.findOne({
                where: { id: testId },
            });
            if (!testData) {
                return res.status(404).json({
                    message: "FullTest not found"
                });
            }

            // Parse correctAnswers, wrongAnswers, and notAttempted to extract question IDs
            const correctAnswers = JSON.parse(testData.correctAnswers);  // Assuming the answers are stored as JSON string
            const wrongAnswers = JSON.parse(testData.wrongAnswers);  // Same as above
            const notAttempted = JSON.parse(testData.notAttempted);  // Same as above

            // Combine all question IDs from the correct, wrong, and not attempted answers
            questionIds = [
                ...correctAnswers.map(item => item[0]),  // Correct answers are in the first position (question ID)
                ...wrongAnswers.map(item => item[0]),    // Wrong answers are in the first position (question ID)
                ...notAttempted.map(item => item[0])     // Not attempted answers are in the first position (question ID)
            ];

            // Fetch questions based on questionIds from the Question model
            questions = await Question.findAll({
                where: {
                    id: questionIds,
                },
            });

            if (!questions.length) {
                return res.status(404).json({
                    message: "Questions not found for the given test"
                });
            }

        } else if (testType === "generate") {
            // Search in GenerateTestResult based on testId
            testData = await GenerateTestResult.findOne({
                where: { testid: testId },
            });
            if (!testData) {
                return res.status(404).json({
                    message: "Generated Test not found"
                });
            }
            // Directly use the testData.answers for the questions
            questions = testData.answers; // Assuming answers already include the questions

        } else if (testType === "meTest") {
            // Search in MeTest based on testId
            testData = await MeTest.findOne({
                where: { id: testId },
            });
            if (!testData) {
                return res.status(404).json({
                    message: "MeTest not found"
                });
            }
            // Directly use the testData.answers for the questions
            questions = testData.answers; // Assuming answers already include the questions
        } else {
            return res.status(400).json({
                message: "Invalid testType"
            });
        }

        // Send the data if found
        res.status(200).json({
            message: `${testType} data retrieved successfully`,
            testData: testData,
            questions: questions, // Send the list of questions
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "An error occurred while retrieving the test data",
            error: error.message,
        });
    }
};

// Load NEET topics data

const neetTopicsPath = path.join(process.cwd(), 'public', 'neet_topics.json');
const neetTopics = JSON.parse(fs.readFileSync(neetTopicsPath, 'utf8'));

// Helper function to extract topic from question text using NEET topics data
function extractTopicFromQuestion(question, subject) {
    if (!subject || !neetTopics[subject]) {
        return null;
    }
    
    const lowerQuestion = question.toLowerCase();
    const subjectTopics = neetTopics[subject];
    
    // Iterate through all units and topics in the subject
    for (const unitName in subjectTopics) {
        const topics = subjectTopics[unitName];
        
        for (const topic of topics) {
            // Check if topic name is in the question
            if (lowerQuestion.includes(topic.name.toLowerCase())) {
                return {
                    topic_id: topic.topic_id,
                    topic_name: topic.name,
                    unit_name: unitName
                };
            }
            
            // Check for partial matches with topic keywords
            const topicWords = topic.name.toLowerCase().split(' ');
            let matchCount = 0;
            
            for (const word of topicWords) {
                if (word.length > 3 && lowerQuestion.includes(word)) {
                    matchCount++;
                }
            }
            
            // If at least 2 significant words match, consider it a match
            if (matchCount >= 2) {
                return {
                    topic_id: topic.topic_id,
                    topic_name: topic.name,
                    unit_name: unitName
                };
            }
        }
    }
    
    return null;
}

// Helper function to process MeTests with topic extraction
function processMeTests(meTests) {
    return meTests.map(test => {
        let answers = test.answers || [];
        
        // Parse the JSON string if it's a string
        if (typeof answers === 'string') {
            try {
                answers = JSON.parse(answers);
            } catch (e) {
                console.error("Error parsing answers JSON:", e);
                answers = {};
            }
        }
        
        // Convert the answers object to an array of objects with topic info
        const answersArray = Object.entries(answers).map(([question, userAnswer]) => {
            const subject = extractCoreSubjectFromQuestion(question);
            const topicInfo = subject ? extractTopicFromQuestion(question, subject) : null;
            
            return {
                question,
                userAnswer,
                subject,
                topic_id: topicInfo ? topicInfo.topic_id : null,
                topic_name: topicInfo ? topicInfo.topic_name : null,
                unit_name: topicInfo ? topicInfo.unit_name : null,
                isCorrect: false // Placeholder - you need to implement actual correctness check
            };
        }).filter(ans => ans.subject); // Only include answers with identifiable core subjects
        
        const totalQuestions = answersArray.length;
        const correctAnswers = answersArray.filter(ans => ans.isCorrect).length;
        const score = totalQuestions > 0 ? (correctAnswers / totalQuestions * 100).toFixed(2) : 0;
        
        return {
            id: test.id,
            type: "meTest",
            date: test.createdAt,
            score: parseFloat(score),
            subjectBreakdown: calculateSubjectBreakdown(answersArray),
            topicBreakdown: calculateTopicBreakdown(answersArray),
            unitBreakdown: calculateUnitBreakdown(answersArray),
            difficultyBreakdown: calculateDifficultyBreakdown(answersArray),
            timeSpent: test.timeSpent || {},
            totalQuestions,
            correctAnswers
        };
    });
}

// Helper function to process Generated Tests with topic extraction
function processGeneratedTests(generatedTests) {
    return generatedTests.map(test => {
        let answers = test.answers || [];
        let userAnswers = test.userAnswers || {};
        
        // Parse the JSON string if it's a string
        if (typeof answers === 'string') {
            try {
                answers = JSON.parse(answers);
            } catch (e) {
                console.error("Error parsing answers JSON:", e);
                answers = [];
            }
        }
        
        // Ensure answers is an array
        if (!Array.isArray(answers)) {
            answers = [];
        }
        
        // Add isCorrect property and topic info by comparing with user answers
        const answersWithCorrectness = answers.map(ans => {
            const userAnswer = userAnswers[ans.questionId];
            const subject = ans.subject || extractCoreSubjectFromQuestion(ans.question);
            const topicInfo = subject ? extractTopicFromQuestion(ans.question, subject) : null;
            
            return {
                ...ans,
                subject,
                topic_id: topicInfo ? topicInfo.topic_id : null,
                topic_name: topicInfo ? topicInfo.topic_name : null,
                unit_name: topicInfo ? topicInfo.unit_name : null,
                isCorrect: userAnswer === ans.correctAnswer
            };
        }).filter(ans => ans.subject); // Only include answers with identifiable core subjects
        
        const totalQuestions = answersWithCorrectness.length;
        const correctAnswers = answersWithCorrectness.filter(ans => ans.isCorrect).length;
        const score = totalQuestions > 0 ? (correctAnswers / totalQuestions * 100).toFixed(2) : 0;
        
        return {
            id: test.testid,
            type: "generate",
            date: test.createdAt,
            score: parseFloat(score),
            subjectBreakdown: calculateSubjectBreakdown(answersWithCorrectness),
            topicBreakdown: calculateTopicBreakdown(answersWithCorrectness),
            unitBreakdown: calculateUnitBreakdown(answersWithCorrectness),
            difficultyBreakdown: calculateDifficultyBreakdown(answersWithCorrectness),
            timeSpent: test.timeSpent || {},
            totalQuestions,
            correctAnswers
        };
    });
}

// Helper function to process Full Tests with topic extraction
function processFullTests(fullTests) {
    return fullTests.map(test => {
        const correctAnswers = JSON.parse(test.correctAnswers || '[]');
        const wrongAnswers = JSON.parse(test.wrongAnswers || '[]');
        const notAttempted = JSON.parse(test.notAttempted || '[]');
        const totalQuestions = correctAnswers.length + wrongAnswers.length + notAttempted.length;
        const correctCount = correctAnswers.length;
        const score = totalQuestions > 0 ? (correctCount / totalQuestions * 100).toFixed(2) : 0;
        
        // For full tests, we need to fetch questions to get subject and topic information
        // This is a simplified version - in a real implementation, you'd fetch questions
        const subjectBreakdown = test.subjectBreakdown ? JSON.parse(test.subjectBreakdown) : {};
        const topicBreakdown = test.topicBreakdown ? JSON.parse(test.topicBreakdown) : {};
        const unitBreakdown = test.unitBreakdown ? JSON.parse(test.unitBreakdown) : {};
        const difficultyBreakdown = test.difficultyBreakdown ? JSON.parse(test.difficultyBreakdown) : {};
        
        return {
            id: test.id,
            type: "fulltest",
            date: test.createdAt,
            score: parseFloat(score),
            subjectBreakdown,
            topicBreakdown,
            unitBreakdown,
            difficultyBreakdown,
            timeSpent: test.timeSpent ? JSON.parse(test.timeSpent) : {},
            totalQuestions,
            correctAnswers: correctCount
        };
    });
}

// Helper function to calculate unit breakdown
function calculateUnitBreakdown(answers) {
    const breakdown = {};
    answers.forEach(answer => {
        const subject = answer.subject;
        const unit = answer.unit_name || 'General';
        
        if (subject) {
            if (!breakdown[subject]) {
                breakdown[subject] = {};
            }
            
            if (!breakdown[subject][unit]) {
                breakdown[subject][unit] = {
                    total: 0,
                    correct: 0
                };
            }
            
            breakdown[subject][unit].total += 1;
            if (answer.isCorrect) {
                breakdown[subject][unit].correct += 1;
            }
        }
    });
    
    // Calculate percentage for each unit
    Object.keys(breakdown).forEach(subject => {
        Object.keys(breakdown[subject]).forEach(unit => {
            const { total, correct } = breakdown[subject][unit];
            breakdown[subject][unit].percentage = total > 0 ? (correct / total * 100).toFixed(2) : 0;
        });
    });
    
    return breakdown;
}

// Enhanced helper function to calculate detailed subject analytics
function calculateDetailedSubjectAnalytics(allTests) {
    // Define core subjects only
    const coreSubjects = ['Physics', 'Chemistry', 'Biology'];
    const subjectAnalytics = {};
    
    // Initialize analytics for each core subject
    coreSubjects.forEach(subject => {
        subjectAnalytics[subject] = {
            totalQuestions: 0,
            correctAnswers: 0,
            averageAccuracy: 0,
            testCount: 0,
            topicPerformance: {},
            unitPerformance: {},
            improvementRate: 0,
            difficultyDistribution: {
                easy: { total: 0, correct: 0 },
                medium: { total: 0, correct: 0 },
                hard: { total: 0, correct: 0 }
            },
            timeSpent: 0,
            averageTimePerQuestion: 0,
            strengths: [],
            weaknesses: [],
            topicMastery: {},
            unitMastery: {}
        };
    });
    
    // Process each test to gather subject-specific data
    allTests.forEach(test => {
        Object.entries(test.subjectBreakdown).forEach(([subject, data]) => {
            // Only process core subjects
            if (coreSubjects.includes(subject)) {
                const analytics = subjectAnalytics[subject];
                analytics.totalQuestions += data.total;
                analytics.correctAnswers += data.correct;
                analytics.testCount += 1;
                
                // Process topic performance
                if (test.topicBreakdown && test.topicBreakdown[subject]) {
                    Object.entries(test.topicBreakdown[subject]).forEach(([topic, topicData]) => {
                        if (!analytics.topicPerformance[topic]) {
                            analytics.topicPerformance[topic] = {
                                total: 0,
                                correct: 0
                            };
                        }
                        analytics.topicPerformance[topic].total += topicData.total;
                        analytics.topicPerformance[topic].correct += topicData.correct;
                    });
                }
                
                // Process unit performance
                if (test.unitBreakdown && test.unitBreakdown[subject]) {
                    Object.entries(test.unitBreakdown[subject]).forEach(([unit, unitData]) => {
                        if (!analytics.unitPerformance[unit]) {
                            analytics.unitPerformance[unit] = {
                                total: 0,
                                correct: 0
                            };
                        }
                        analytics.unitPerformance[unit].total += unitData.total;
                        analytics.unitPerformance[unit].correct += unitData.correct;
                    });
                }
                
                // Process difficulty distribution
                if (test.difficultyBreakdown && test.difficultyBreakdown[subject]) {
                    Object.entries(test.difficultyBreakdown[subject]).forEach(([difficulty, diffData]) => {
                        if (analytics.difficultyDistribution[difficulty]) {
                            analytics.difficultyDistribution[difficulty].total += diffData.total;
                            analytics.difficultyDistribution[difficulty].correct += diffData.correct;
                        }
                    });
                }
                
                // Process time data
                if (test.timeSpent && test.timeSpent[subject]) {
                    analytics.timeSpent += test.timeSpent[subject];
                }
            }
        });
    });
    
    // Calculate derived metrics for each subject
    coreSubjects.forEach(subject => {
        const analytics = subjectAnalytics[subject];
        
        // Calculate average accuracy
        analytics.averageAccuracy = analytics.totalQuestions > 0 
            ? (analytics.correctAnswers / analytics.totalQuestions * 100).toFixed(2) 
            : 0;
        
        // Calculate average time per question
        analytics.averageTimePerQuestion = analytics.totalQuestions > 0 
            ? (analytics.timeSpent / analytics.totalQuestions).toFixed(2) 
            : 0;
        
        // Calculate topic performance percentages and mastery levels
        Object.keys(analytics.topicPerformance).forEach(topic => {
            const topicData = analytics.topicPerformance[topic];
            topicData.percentage = topicData.total > 0 
                ? (topicData.correct / topicData.total * 100).toFixed(2) 
                : 0;
            
            // Determine mastery level
            const accuracy = parseFloat(topicData.percentage);
            if (accuracy >= 80) {
                topicData.mastery = 'Mastered';
            } else if (accuracy >= 60) {
                topicData.mastery = 'Proficient';
            } else if (accuracy >= 40) {
                topicData.mastery = 'Developing';
            } else {
                topicData.mastery = 'Needs Improvement';
            }
        });
        
        // Calculate unit performance percentages and mastery levels
        Object.keys(analytics.unitPerformance).forEach(unit => {
            const unitData = analytics.unitPerformance[unit];
            unitData.percentage = unitData.total > 0 
                ? (unitData.correct / unitData.total * 100).toFixed(2) 
                : 0;
            
            // Determine mastery level
            const accuracy = parseFloat(unitData.percentage);
            if (accuracy >= 80) {
                unitData.mastery = 'Mastered';
            } else if (accuracy >= 60) {
                unitData.mastery = 'Proficient';
            } else if (accuracy >= 40) {
                unitData.mastery = 'Developing';
            } else {
                unitData.mastery = 'Needs Improvement';
            }
        });
        
        // Calculate difficulty performance percentages
        Object.keys(analytics.difficultyDistribution).forEach(difficulty => {
            const diffData = analytics.difficultyDistribution[difficulty];
            diffData.percentage = diffData.total > 0 
                ? (diffData.correct / diffData.total * 100).toFixed(2) 
                : 0;
        });
        
        // Identify strengths and weaknesses based on topic performance
        const sortedTopics = Object.entries(analytics.topicPerformance)
            .sort((a, b) => parseFloat(b[1].percentage) - parseFloat(a[1].percentage));
        
        analytics.strengths = sortedTopics.slice(0, 3).map(([topic, data]) => ({
            topic,
            accuracy: parseFloat(data.percentage),
            mastery: data.mastery
        }));
        
        analytics.weaknesses = sortedTopics.slice(-3).map(([topic, data]) => ({
            topic,
            accuracy: parseFloat(data.percentage),
            mastery: data.mastery
        })).reverse();
        
        // Calculate topic mastery distribution
        analytics.topicMastery = {
            'Mastered': 0,
            'Proficient': 0,
            'Developing': 0,
            'Needs Improvement': 0
        };
        
        Object.values(analytics.topicPerformance).forEach(topic => {
            analytics.topicMastery[topic.mastery]++;
        });
        
        // Calculate unit mastery distribution
        analytics.unitMastery = {
            'Mastered': 0,
            'Proficient': 0,
            'Developing': 0,
            'Needs Improvement': 0
        };
        
        Object.values(analytics.unitPerformance).forEach(unit => {
            analytics.unitMastery[unit.mastery]++;
        });
        
        // Calculate improvement rate
        analytics.improvementRate = parseFloat(analytics.averageAccuracy) > 70 ? 5 : 
                                   parseFloat(analytics.averageAccuracy) > 50 ? 0 : -5;
    });
    
    // Calculate subject comparison metrics
    const subjectComparison = {
        bestSubject: '',
        worstSubject: '',
        subjectScores: {},
        subjectMastery: {}
    };
    
    // Find best and worst performing subjects
    let bestScore = -1;
    let worstScore = 101;
    
    coreSubjects.forEach(subject => {
        const score = parseFloat(subjectAnalytics[subject].averageAccuracy);
        subjectComparison.subjectScores[subject] = score;
        
        // Calculate overall mastery level for the subject
        const masteredTopics = subjectAnalytics[subject].topicMastery['Mastered'];
        const proficientTopics = subjectAnalytics[subject].topicMastery['Proficient'];
        const totalTopics = Object.keys(subjectAnalytics[subject].topicPerformance).length;
        
        let masteryLevel = 'Needs Improvement';
        if (totalTopics > 0) {
            const masteryPercentage = ((masteredTopics + proficientTopics) / totalTopics) * 100;
            if (masteryPercentage >= 80) {
                masteryLevel = 'Mastered';
            } else if (masteryPercentage >= 60) {
                masteryLevel = 'Proficient';
            } else if (masteryPercentage >= 40) {
                masteryLevel = 'Developing';
            }
        }
        
        subjectComparison.subjectMastery[subject] = masteryLevel;
        
        if (score > bestScore) {
            bestScore = score;
            subjectComparison.bestSubject = subject;
        }
        
        if (score < worstScore) {
            worstScore = score;
            subjectComparison.worstSubject = subject;
        }
    });
    
    return {
        subjects: subjectAnalytics,
        comparison: subjectComparison,
        recommendations: generateSubjectRecommendations(subjectAnalytics, neetTopics)
    };
}

// Enhanced helper function to generate subject-specific recommendations
function generateSubjectRecommendations(subjectAnalytics, neetTopics) {
    const recommendations = [];
    
    // Physics recommendations
    const physics = subjectAnalytics.Physics;
    if (physics) {
        if (parseFloat(physics.averageAccuracy) < 50) {
            recommendations.push({
                subject: 'Physics',
                priority: 'high',
                message: 'Focus on fundamental Physics concepts. Start with basic principles before moving to complex problems.',
                topics: physics.weaknesses.slice(0, 2).map(w => w.topic),
                units: getWeakUnits(physics, neetTopics, 'Physics')
            });
        } else if (parseFloat(physics.averageAccuracy) < 70) {
            recommendations.push({
                subject: 'Physics',
                priority: 'medium',
                message: 'Improve Physics problem-solving skills. Practice more numerical problems and derivations.',
                topics: physics.weaknesses.slice(0, 2).map(w => w.topic),
                units: getWeakUnits(physics, neetTopics, 'Physics')
            });
        }
        
        // Check time spent on Physics
        if (parseFloat(physics.averageTimePerQuestion) > 120) {
            recommendations.push({
                subject: 'Physics',
                priority: 'medium',
                message: 'Work on time management for Physics questions. You\'re spending too much time per question.',
                topics: [],
                units: []
            });
        }
    }
    
    // Chemistry recommendations
    const chemistry = subjectAnalytics.Chemistry;
    if (chemistry) {
        if (parseFloat(chemistry.averageAccuracy) < 50) {
            recommendations.push({
                subject: 'Chemistry',
                priority: 'high',
                message: 'Strengthen Chemistry basics. Focus on understanding periodic table trends and chemical reactions.',
                topics: chemistry.weaknesses.slice(0, 2).map(w => w.topic),
                units: getWeakUnits(chemistry, neetTopics, 'Chemistry')
            });
        } else if (parseFloat(chemistry.averageAccuracy) < 70) {
            recommendations.push({
                subject: 'Chemistry',
                priority: 'medium',
                message: 'Practice more Chemistry problems, especially organic reactions and equations balancing.',
                topics: chemistry.weaknesses.slice(0, 2).map(w => w.topic),
                units: getWeakUnits(chemistry, neetTopics, 'Chemistry')
            });
        }
        
        // Check difficulty distribution
        if (parseFloat(chemistry.difficultyDistribution.hard.percentage) < 30) {
            recommendations.push({
                subject: 'Chemistry',
                priority: 'medium',
                message: 'Challenge yourself with more difficult Chemistry problems to improve your understanding.',
                topics: [],
                units: []
            });
        }
    }
    
    // Biology recommendations
    const biology = subjectAnalytics.Biology;
    if (biology) {
        if (parseFloat(biology.averageAccuracy) < 50) {
            recommendations.push({
                subject: 'Biology',
                priority: 'high',
                message: 'Review fundamental Biology concepts. Focus on cell biology, genetics, and human physiology.',
                topics: biology.weaknesses.slice(0, 2).map(w => w.topic),
                units: getWeakUnits(biology, neetTopics, 'Biology')
            });
        } else if (parseFloat(biology.averageAccuracy) < 70) {
            recommendations.push({
                subject: 'Biology',
                priority: 'medium',
                message: 'Improve Biology diagram-based answers and terminology. Practice labeling diagrams.',
                topics: biology.weaknesses.slice(0, 2).map(w => w.topic),
                units: getWeakUnits(biology, neetTopics, 'Biology')
            });
        }
        
        // Check time spent on Biology
        if (parseFloat(biology.averageTimePerQuestion) < 30) {
            recommendations.push({
                subject: 'Biology',
                priority: 'low',
                message: 'You\'re rushing through Biology questions. Take more time to read questions carefully.',
                topics: [],
                units: []
            });
        }
    }
    
    // Cross-subject recommendations
    const physicsScore = parseFloat(physics?.averageAccuracy || 0);
    const chemistryScore = parseFloat(chemistry?.averageAccuracy || 0);
    const biologyScore = parseFloat(biology?.averageAccuracy || 0);
    
    if (Math.abs(physicsScore - chemistryScore) > 20) {
        recommendations.push({
            subject: 'Cross-Subject',
            priority: 'medium',
            message: 'Balance your preparation between Physics and Chemistry. There\'s a significant performance gap.',
            topics: [],
            units: []
        });
    }
    
    if (Math.abs(chemistryScore - biologyScore) > 20) {
        recommendations.push({
            subject: 'Cross-Subject',
            priority: 'medium',
            message: 'Balance your preparation between Chemistry and Biology. There\'s a significant performance gap.',
            topics: [],
            units: []
        });
    }
    
    return recommendations;
}

// Helper function to get weak units for a subject
function getWeakUnits(subjectAnalytics, neetTopics, subject) {
    const weakUnits = [];
    
    // Get units sorted by performance (lowest first)
    const sortedUnits = Object.entries(subjectAnalytics.unitPerformance)
        .sort((a, b) => parseFloat(a[1].percentage) - parseFloat(b[1].percentage));
    
    // Return the top 2 weakest units
    return sortedUnits.slice(0, 2).map(([unit, data]) => unit);
}

// Helper function to extract core subject from question text
function extractCoreSubjectFromQuestion(question) {
    const lowerQuestion = question.toLowerCase();
    
    // Physics keywords
    if (lowerQuestion.includes('physics') || 
        lowerQuestion.includes('force') || 
        lowerQuestion.includes('energy') || 
        lowerQuestion.includes('motion') || 
        lowerQuestion.includes('electric') || 
        lowerQuestion.includes('magnetic') || 
        lowerQuestion.includes('thermodynamic') ||
        lowerQuestion.includes('quantum') ||
        lowerQuestion.includes('relativity') ||
        lowerQuestion.includes('wave') ||
        lowerQuestion.includes('optics') ||
        lowerQuestion.includes('mechanics')) {
        return 'Physics';
    }
    
    // Chemistry keywords
    if (lowerQuestion.includes('chemistry') || 
        lowerQuestion.includes('reaction') || 
        lowerQuestion.includes('compound') || 
        lowerQuestion.includes('element') || 
        lowerQuestion.includes('acid') || 
        lowerQuestion.includes('base') || 
        lowerQuestion.includes('organic') ||
        lowerQuestion.includes('inorganic') ||
        lowerQuestion.includes('periodic') ||
        lowerQuestion.includes('molecule') ||
        lowerQuestion.includes('bond') ||
        lowerQuestion.includes('solution') ||
        lowerQuestion.includes('equilibrium')) {
        return 'Chemistry';
    }
    
    // Biology keywords
    if (lowerQuestion.includes('biology') || 
        lowerQuestion.includes('cell') || 
        lowerQuestion.includes('gene') || 
        lowerQuestion.includes('species') || 
        lowerQuestion.includes('organism') || 
        lowerQuestion.includes('ecosystem') || 
        lowerQuestion.includes('human body') ||
        lowerQuestion.includes('plant') ||
        lowerQuestion.includes('animal') ||
        lowerQuestion.includes('physiology') ||
        lowerQuestion.includes('anatomy') ||
        lowerQuestion.includes('evolution') ||
        lowerQuestion.includes('genetics') ||
        lowerQuestion.includes('ecology')) {
        return 'Biology';
    }
    
    // Return null if not identifiable as a core subject
    return null;
}

// Helper function to calculate subject breakdown (core subjects only)
function calculateSubjectBreakdown(answers) {
    const breakdown = {};
    answers.forEach(answer => {
        const subject = answer.subject;
        if (subject) { // Only process if subject is identified
            if (!breakdown[subject]) {
                breakdown[subject] = {
                    total: 0,
                    correct: 0
                };
            }
            breakdown[subject].total += 1;
            if (answer.isCorrect) {
                breakdown[subject].correct += 1;
            }
        }
    });
    
    // Calculate percentage for each subject
    Object.keys(breakdown).forEach(subject => {
        const { total, correct } = breakdown[subject];
        breakdown[subject].percentage = total > 0 ? (correct / total * 100).toFixed(2) : 0;
    });
    
    return breakdown;
}

// Helper function to calculate topic breakdown (core subjects only)
function calculateTopicBreakdown(answers) {
    const breakdown = {};
    answers.forEach(answer => {
        const subject = answer.subject;
        const topic = answer.topic_name || 'General';
        
        if (subject) { // Only process if subject is identified
            if (!breakdown[subject]) {
                breakdown[subject] = {};
            }
            
            if (!breakdown[subject][topic]) {
                breakdown[subject][topic] = {
                    total: 0,
                    correct: 0
                };
            }
            
            breakdown[subject][topic].total += 1;
            if (answer.isCorrect) {
                breakdown[subject][topic].correct += 1;
            }
        }
    });
    
    return breakdown;
}

// Helper function to calculate difficulty breakdown (core subjects only)
function calculateDifficultyBreakdown(answers) {
    const breakdown = {};
    answers.forEach(answer => {
        const subject = answer.subject;
        const difficulty = answer.difficulty || 'medium'; // default to medium if not specified
        
        if (subject) { // Only process if subject is identified
            if (!breakdown[subject]) {
                breakdown[subject] = {
                    easy: { total: 0, correct: 0 },
                    medium: { total: 0, correct: 0 },
                    hard: { total: 0, correct: 0 }
                };
            }
            
            breakdown[subject][difficulty].total += 1;
            if (answer.isCorrect) {
                breakdown[subject][difficulty].correct += 1;
            }
        }
    });
    
    return breakdown;
}

// Helper function to calculate overall analytics
function calculateOverallAnalytics(allTests) {
    if (allTests.length === 0) {
        return {
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            improvementRate: 0
        };
    }
    const scores = allTests.map(test => test.score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    // Calculate improvement rate (compare first and last tests)
    const firstTest = allTests[0];
    const lastTest = allTests[allTests.length - 1];
    const improvementRate = firstTest && lastTest ?
        ((lastTest.score - firstTest.score) / firstTest.score * 100).toFixed(2) : 0;
    return {
        averageScore: parseFloat(averageScore.toFixed(2)),
        highestScore,
        lowestScore,
        improvementRate: parseFloat(improvementRate)
    };
}

// Helper function to calculate subject performance (core subjects only)
function calculateSubjectPerformance(allTests) {
    const subjectStats = {};
    const coreSubjects = ['Physics', 'Chemistry', 'Biology'];
    
    // Initialize core subjects
    coreSubjects.forEach(subject => {
        subjectStats[subject] = {
            totalQuestions: 0,
            correctAnswers: 0,
            testsCount: 0
        };
    });
    
    allTests.forEach(test => {
        Object.entries(test.subjectBreakdown).forEach(([subject, data]) => {
            if (coreSubjects.includes(subject)) {
                subjectStats[subject].totalQuestions += data.total;
                subjectStats[subject].correctAnswers += data.correct;
                subjectStats[subject].testsCount += 1;
            }
        });
    });
    
    // Calculate average accuracy for each subject
    Object.keys(subjectStats).forEach(subject => {
        const stats = subjectStats[subject];
        stats.averageAccuracy = stats.totalQuestions > 0 ?
            (stats.correctAnswers / stats.totalQuestions * 100).toFixed(2) : 0;
    });
    
    return subjectStats;
}

// Helper function to identify areas for improvement (core subjects only)
function identifyImprovementAreas(allTests, subjectPerformance) {
    const coreSubjects = ['Physics', 'Chemistry', 'Biology'];
    
    // Find subjects with lowest average accuracy
    const sortedSubjects = Object.entries(subjectPerformance)
        .filter(([subject]) => coreSubjects.includes(subject))
        .sort((a, b) => parseFloat(a[1].averageAccuracy) - parseFloat(b[1].averageAccuracy))
        .map(([subject, data]) => ({
            subject,
            accuracy: parseFloat(data.averageAccuracy),
            testsCount: data.testsCount
        }));
    
    // Get the weakest subjects
    const weakSubjects = sortedSubjects;
    
    // Generate specific recommendations
    const recommendations = [];
    
    // Overall performance recommendations
    const overallAccuracy = Object.values(subjectPerformance)
        .filter(stats => coreSubjects.includes(Object.keys(subjectPerformance).find(key => subjectPerformance[key] === stats)))
        .reduce((sum, data) => {
            return sum + parseFloat(data.averageAccuracy) * data.totalQuestions;
        }, 0) / Object.values(subjectPerformance)
            .filter(stats => coreSubjects.includes(Object.keys(subjectPerformance).find(key => subjectPerformance[key] === stats)))
            .reduce((sum, data) => sum + data.totalQuestions, 0);
    
    if (overallAccuracy < 60) {
        recommendations.push("Focus on fundamental concepts as overall performance needs improvement");
    }
    
    // Subject-specific recommendations
    weakSubjects.forEach(({ subject, accuracy }) => {
        if (accuracy < 50) {
            recommendations.push(`Strengthen ${subject} fundamentals (current accuracy: ${accuracy}%)`);
        } else if (accuracy < 70) {
            recommendations.push(`Practice more ${subject} problems to improve accuracy (current: ${accuracy}%)`);
        }
    });
    
    return {
        weakSubjects,
        recommendations,
        overallAccuracy: parseFloat(overallAccuracy.toFixed(2))
    };
}

// Helper function to calculate progress trends
function calculateProgressTrends(allTests) {
    if (allTests.length < 2) {
        return {
            trend: "insufficient_data",
            message: "Take more tests to analyze progress trends"
        };
    }
    
    // Group tests by month for trend analysis
    const monthlyData = {};
    allTests.forEach(test => {
        const date = new Date(test.date);
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
                totalTests: 0,
                totalScore: 0,
                scores: []
            };
        }
        monthlyData[monthYear].totalTests += 1;
        monthlyData[monthYear].totalScore += test.score;
        monthlyData[monthYear].scores.push(test.score);
    });
    
    // Calculate monthly averages
    const monthlyTrends = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        averageScore: data.totalScore / data.totalTests,
        testCount: data.totalTests
    })).sort((a, b) => a.month.localeCompare(b.month));
    
    // Determine trend direction
    let trend = "stable";
    if (monthlyTrends.length >= 2) {
        const firstMonth = monthlyTrends[0];
        const lastMonth = monthlyTrends[monthlyTrends.length - 1];
        if (lastMonth.averageScore > firstMonth.averageScore + 5) {
            trend = "improving";
        } else if (lastMonth.averageScore < firstMonth.averageScore - 5) {
            trend = "declining";
        }
    }
    
    return {
        trend,
        monthlyTrends,
        message: trend === "improving" ? "Your performance is improving over time" :
            trend === "declining" ? "Your performance is declining, focus on weak areas" :
                "Your performance is stable, keep practicing to improve"
    };
}

export const getUserTestAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch all tests for the user
        const [meTests, generatedTests, fullTests] = await Promise.all([
            MeTest.findAll({ where: { studentId: userId } }),
            GenerateTestResult.findAll({ where: { studentId: userId } }),
            FullTestResults.findAll({ where: { studentId: userId } })
        ]);
        
        // Process all tests
        const allTests = [
            ...processMeTests(meTests),
            ...processGeneratedTests(generatedTests),
            ...processFullTests(fullTests)
        ];
        
        // Sort tests by date
        allTests.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculate overall analytics
        const overallAnalytics = calculateOverallAnalytics(allTests);
        
        // Calculate subject-wise performance for core subjects only
        const subjectPerformance = calculateSubjectPerformance(allTests);
        
        // Identify areas for improvement
        const improvementAreas = identifyImprovementAreas(allTests, subjectPerformance);
        
        // Calculate progress trends
        const progressTrends = calculateProgressTrends(allTests);
        
        // Calculate detailed subject analytics for core subjects
        const detailedSubjectAnalytics = calculateDetailedSubjectAnalytics(allTests);
        
        // Return comprehensive analytics
        res.status(200).json({
            message: "User test analytics retrieved successfully",
            summary: {
                totalTests: allTests.length,
                averageScore: overallAnalytics.averageScore,
                highestScore: overallAnalytics.highestScore,
                lowestScore: overallAnalytics.lowestScore,
                improvementRate: overallAnalytics.improvementRate
            },
            subjectPerformance,
            improvementAreas,
            progressTrends,
            detailedSubjectAnalytics,
            recentTests: allTests.slice(-5).map(test => ({
                id: test.id,
                type: test.type,
                date: test.date,
                score: test.score
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "An error occurred while retrieving user analytics",
            error: error.message,
        });
    }
};