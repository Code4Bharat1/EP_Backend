import { Op } from "sequelize";
import Student from "../models/student.model.js";
import GenerateTestResult from "../models/generateTestresult.model.js";
import FullTestResults from "../models/fullTestResults.model.js";
import MeTest from "../models/saved.js";
import { Question } from "../models/everytestmode.refrence.js";
import fs from "fs";
import path from "path";
// Controller to get selected fields of FullTestResults for the last test of all students
export const getLastTestResultsForAllStudents = async (req, res) => {
  try {
    const adminId = req.user?.adminId; 
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const students = await Student.findAll({
      where: { addedByAdminId: adminId },
      attributes: ["id", "firstName", "lastName"],
    });

    if (!students.length) return res.status(200).json({ results: [] });

    const ids = students.map(s => s.id);

    const tests = await FullTestResults.findAll({
      where: { studentId: { [Op.in]: ids } },
      attributes: ["studentId", "marksObtained", "totalMarks"],
      order: [["createdAt", "DESC"]],
    });

    const results = students.map(student => {
      const t = tests.find(x => x.studentId === student.id);
      if (!t) return null;

      return {
        studentId: student.id,
        fullName: `${student.firstName} ${student.lastName}`,
        marksObtained: t.marksObtained,
        totalMarks: t.totalMarks
      };
    }).filter(Boolean);

    return res.status(200).json({ results });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


export const allTestReviewByTestType = async (req, res) => {
  try {
    const { testType, testId } = req.params;

    // Validate that testType and testId are provided
    if (!testType || !testId) {
      return res.status(400).json({
        message: "testType and testId are required",
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
          message: "FullTest not found",
        });
      }

      // Parse correctAnswers, wrongAnswers, and notAttempted to extract question IDs
      const correctAnswers = JSON.parse(testData.correctAnswers); // Assuming the answers are stored as JSON string
      const wrongAnswers = JSON.parse(testData.wrongAnswers); // Same as above
      const notAttempted = JSON.parse(testData.notAttempted); // Same as above

      // Combine all question IDs from the correct, wrong, and not attempted answers
      questionIds = [
        ...correctAnswers.map((item) => item[0]), // Correct answers are in the first position (question ID)
        ...wrongAnswers.map((item) => item[0]), // Wrong answers are in the first position (question ID)
        ...notAttempted.map((item) => item[0]), // Not attempted answers are in the first position (question ID)
      ];

      questions = await Question.findAll({
  where: {
    id: questionIds,
  },
});

if (!questions.length) {
  return res.status(200).json({
    message: "No questions were attempted",
    testData,
    questions: [],
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
          message: "MeTest not found",
        });
      }
      // Directly use the testData.answers for the questions
      questions = testData.answers; // Assuming answers already include the questions
    } else {
      return res.status(400).json({
        message: "Invalid testType",
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
// src/controllers/analytics.controller.js
const neetTopicsPath = path.join(process.cwd(), "public", "neet_topics.json");
const neetTopics = JSON.parse(fs.readFileSync(neetTopicsPath, "utf8"));

// Helper function to extract core subject from question text
function extractCoreSubjectFromQuestion(question) {
  const lowerQuestion = question.toLowerCase();

  // Physics keywords
  if (
    lowerQuestion.includes("physics") ||
    lowerQuestion.includes("force") ||
    lowerQuestion.includes("energy") ||
    lowerQuestion.includes("motion") ||
    lowerQuestion.includes("electric") ||
    lowerQuestion.includes("magnetic") ||
    lowerQuestion.includes("thermodynamic") ||
    lowerQuestion.includes("quantum") ||
    lowerQuestion.includes("relativity") ||
    lowerQuestion.includes("wave") ||
    lowerQuestion.includes("optics") ||
    lowerQuestion.includes("mechanics")
  ) {
    return "Physics";
  }

  // Chemistry keywords
  if (
    lowerQuestion.includes("chemistry") ||
    lowerQuestion.includes("reaction") ||
    lowerQuestion.includes("compound") ||
    lowerQuestion.includes("element") ||
    lowerQuestion.includes("acid") ||
    lowerQuestion.includes("base") ||
    lowerQuestion.includes("organic") ||
    lowerQuestion.includes("inorganic") ||
    lowerQuestion.includes("periodic") ||
    lowerQuestion.includes("molecule") ||
    lowerQuestion.includes("bond") ||
    lowerQuestion.includes("solution") ||
    lowerQuestion.includes("equilibrium")
  ) {
    return "Chemistry";
  }

  // Biology keywords
  if (
    lowerQuestion.includes("biology") ||
    lowerQuestion.includes("cell") ||
    lowerQuestion.includes("gene") ||
    lowerQuestion.includes("species") ||
    lowerQuestion.includes("organism") ||
    lowerQuestion.includes("ecosystem") ||
    lowerQuestion.includes("human body") ||
    lowerQuestion.includes("plant") ||
    lowerQuestion.includes("animal") ||
    lowerQuestion.includes("physiology") ||
    lowerQuestion.includes("anatomy") ||
    lowerQuestion.includes("evolution") ||
    lowerQuestion.includes("genetics") ||
    lowerQuestion.includes("ecology")
  ) {
    return "Biology";
  }

  return null;
}

// Helper function to determine if an answer is correct
function isAnswerCorrect(question, userAnswer, testType, correctAnswer) {
  // For generated tests, we have the correct answer
  if (testType === "generate" && correctAnswer) {
    return userAnswer === correctAnswer;
  }

  // For MeTests, check if we have stored correct answers
  if (testType === "meTest" && question.correctAnswer) {
    return userAnswer === question.correctAnswer;
  }

  // For FullTests, we assume correctness is already determined
  if (testType === "fulltest") {
    return userAnswer !== null && userAnswer !== undefined && userAnswer !== "";
  }

  // Default case - if user answered something, consider it correct for now
  // This is a fallback and should be improved
  return userAnswer !== null && userAnswer !== undefined && userAnswer !== "";
}

// Process MeTests
// Also update the processMeTests function to use stored values when available
function processMeTests(meTests) {
    return meTests.map(test => {
        let answers = test.answers || {};
        
        if (typeof answers === 'string') {
            try {
                answers = JSON.parse(answers);
            } catch (e) {
                console.error("Error parsing answers JSON:", e);
                answers = {};
            }
        }
        
        // Use stored values if available
        const totalQuestions = test.totalQuestions || 0;
        const correctAnswers = test.correct || 0;
        const score = totalQuestions > 0 ? (correctAnswers / totalQuestions * 100).toFixed(2) : 0;
        
        // Create subject breakdown
        let subjectBreakdown = {};
        
        // If we have stored subjectWiseMarks, use it
        if (test.subjectWiseMarks && typeof test.subjectWiseMarks === 'object') {
            Object.entries(test.subjectWiseMarks).forEach(([subject, marks]) => {
                // Calculate approximate correct answers based on marks
                const estimatedCorrect = Math.round(marks / 4); // Assuming 4 marks per question
                
                subjectBreakdown[subject] = {
                    total: totalQuestions, // This is an approximation
                    correct: estimatedCorrect,
                    percentage: totalQuestions > 0 ? (estimatedCorrect / totalQuestions * 100).toFixed(2) : 0
                };
            });
        }
        
        // If we don't have subjectWiseMarks, try to extract from answers
        if (Object.keys(subjectBreakdown).length === 0 && Object.keys(answers).length > 0) {
            const answersArray = Object.entries(answers).map(([question, userAnswer]) => {
                const subject = extractCoreSubjectFromQuestion(question);
                
                return {
                    question,
                    userAnswer,
                    subject,
                    isCorrect: false // We'll use stored correct count instead
                };
            }).filter(ans => ans.subject);
            
            subjectBreakdown = calculateSubjectBreakdown(answersArray);
            
            // Override correct counts with stored values
            Object.keys(subjectBreakdown).forEach(subject => {
                subjectBreakdown[subject].correct = correctAnswers;
                subjectBreakdown[subject].percentage = totalQuestions > 0 ? 
                    (correctAnswers / totalQuestions * 100).toFixed(2) : 0;
            });
        }
        
        return {
            id: test.id,
            type: "meTest",
            date: test.createdAt,
            score: parseFloat(score),
            subjectBreakdown,
            totalQuestions,
            correctAnswers
        };
    });
}

// Process Generated Tests
// Process Generated Tests - FIXED
function processGeneratedTests(generatedTests) {
  return generatedTests.map((test) => {
    // Use the stored values directly
    const totalQuestions = test.totalquestions || 0;
    const correctAnswers = test.correctAnswers || 0;
    const overallMarks = test.overallmarks || 100; // Default to 100 if not provided
    const score =
      totalQuestions > 0
        ? ((correctAnswers / totalQuestions) * 100).toFixed(2)
        : 0;

    // Create subject breakdown from subjectWiseMarks
    const subjectBreakdown = {};

    if (test.subjectWiseMarks && typeof test.subjectWiseMarks === "object") {
      Object.entries(test.subjectWiseMarks).forEach(([subject, marks]) => {
        // Calculate approximate correct answers based on marks
        // This assumes each question has the same marks value
        const marksPerQuestion = overallMarks / totalQuestions;
        const estimatedCorrect = Math.round(marks / marksPerQuestion);

        subjectBreakdown[subject] = {
          total: totalQuestions, // This is an approximation
          correct: estimatedCorrect,
          percentage:
            totalQuestions > 0
              ? ((estimatedCorrect / totalQuestions) * 100).toFixed(2)
              : 0,
        };
      });
    }

    // If we don't have subjectWiseMarks, try to extract from answers array
    if (
      Object.keys(subjectBreakdown).length === 0 &&
      test.answers &&
      Array.isArray(test.answers)
    ) {
      const subjectCounts = {};

      test.answers.forEach((ans) => {
        const subject =
          ans.subject || extractCoreSubjectFromQuestion(ans.question);
        if (subject) {
          if (!subjectCounts[subject]) {
            subjectCounts[subject] = 0;
          }
          subjectCounts[subject]++;
        }
      });

      Object.entries(subjectCounts).forEach(([subject, count]) => {
        // Distribute correct answers proportionally
        const proportion = count / totalQuestions;
        const estimatedCorrect = Math.round(correctAnswers * proportion);

        subjectBreakdown[subject] = {
          total: count,
          correct: estimatedCorrect,
          percentage:
            count > 0 ? ((estimatedCorrect / count) * 100).toFixed(2) : 0,
        };
      });
    }

    return {
      id: test.testid,
      type: "generate",
      date: test.createdAt,
      score: parseFloat(score),
      subjectBreakdown,
      totalQuestions,
      correctAnswers,
    };
  });
}

// Process Full Tests
// Update the FullTestResults processing to use stored values
function processFullTests(fullTests) {
    return fullTests.map(test => {
        const correctAnswers = test.correctAnswers || 0;
        const wrongAnswers = test.wrongAnswers || 0;
        const notAttempted = test.notAttempted || 0;
        const totalQuestions = correctAnswers + wrongAnswers + notAttempted;
        const correctCount = correctAnswers;
        const score = totalQuestions > 0 ? (correctCount / totalQuestions * 100).toFixed(2) : 0;
        
        // Use stored subjectWisePerformance if available
        let subjectBreakdown = {};
        
        if (test.subjectWisePerformance && typeof test.subjectWisePerformance === 'object') {
            Object.entries(test.subjectWisePerformance).forEach(([subject, data]) => {
                subjectBreakdown[subject] = {
                    total: data.total || 0,
                    correct: data.correct || 0,
                    percentage: data.total > 0 ? (data.correct / data.total * 100).toFixed(2) : 0
                };
            });
        }
        
        return {
            id: test.id,
            type: "fulltest",
            date: test.createdAt,
            score: parseFloat(score),
            subjectBreakdown,
            totalQuestions,
            correctAnswers: correctCount
        };
    });
}

// Calculate subject breakdown
function calculateSubjectBreakdown(answers) {
  const breakdown = {};
  answers.forEach((answer) => {
    const subject = answer.subject;
    if (subject) {
      if (!breakdown[subject]) {
        breakdown[subject] = { total: 0, correct: 0 };
      }
      breakdown[subject].total += 1;
      if (answer.isCorrect) {
        breakdown[subject].correct += 1;
      }
    }
  });

  Object.keys(breakdown).forEach((subject) => {
    const { total, correct } = breakdown[subject];
    breakdown[subject].percentage =
      total > 0 ? ((correct / total) * 100).toFixed(2) : 0;
  });

  return breakdown;
}

// Calculate focused analytics (subject-wise and test-wise only)
function calculateFocusedAnalytics(allTests) {
  // Debug log to check test data
  // console.log(
  //   "Processing tests:",
  //   allTests.map((t) => ({ id: t.id, type: t.type, score: t.score }))
  // );

  // Check if user has taken at least 5 tests for comprehensive analytics
  const MIN_TESTS_FOR_ANALYTICS = 5;
  const hasEnoughTests = allTests.length >= MIN_TESTS_FOR_ANALYTICS;

  // Create data limitation message if needed
  const dataLimitation = hasEnoughTests
    ? null
    : {
        message: `You have taken ${allTests.length} test${allTests.length !== 1 ? "s" : ""} which is not enough data for a comprehensive analysis. Please take at least ${MIN_TESTS_FOR_ANALYTICS} tests for better insights.`,
        testsTaken: allTests.length,
        testsNeeded: MIN_TESTS_FOR_ANALYTICS,
      };

  // Overall Performance
  const scores = allTests.map((test) => test.score);
  const averageScore =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

  // Progress Trend (compare last 2 tests with previous 2)
  let progressTrend = "stable";
  if (allTests.length >= 4) {
    const recentTests = allTests.slice(-2);
    const previousTests = allTests.slice(-4, -2);

    const recentAvg =
      recentTests.reduce((sum, test) => sum + test.score, 0) /
      recentTests.length;
    const previousAvg =
      previousTests.reduce((sum, test) => sum + test.score, 0) /
      previousTests.length;

    if (recentAvg > previousAvg + 5) progressTrend = "improving";
    else if (recentAvg < previousAvg - 5) progressTrend = "declining";
  }

  // Subject-wise Performance
  const subjectPerformance = {};
  const coreSubjects = ["Physics", "Chemistry", "Biology"];

  // Initialize subjects
  coreSubjects.forEach((subject) => {
    subjectPerformance[subject] = {
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      testsCount: 0,
    };
  });

  // Aggregate data across all tests
  allTests.forEach((test) => {
    if (test.subjectBreakdown) {
      Object.entries(test.subjectBreakdown).forEach(([subject, data]) => {
        if (coreSubjects.includes(subject)) {
          subjectPerformance[subject].totalQuestions += data.total;
          subjectPerformance[subject].correctAnswers += data.correct;
          subjectPerformance[subject].testsCount += 1;
        }
      });
    }
  });

  // Calculate accuracy for each subject
  coreSubjects.forEach((subject) => {
    const perf = subjectPerformance[subject];
    perf.accuracy =
      perf.totalQuestions > 0
        ? ((perf.correctAnswers / perf.totalQuestions) * 100).toFixed(2)
        : 0;
  });

  // Test-wise Performance (last 5 tests)
  const testPerformance = allTests.slice(-5).map((test) => ({
    id: test.id,
    type: test.type,
    date: test.date,
    score: test.score,
    subjectBreakdown: test.subjectBreakdown || {},
  }));

  // Identify weakest subject
  const weakestSubject = coreSubjects.reduce((weakest, subject) => {
    if (
      !weakest ||
      parseFloat(subjectPerformance[subject].accuracy) <
        parseFloat(subjectPerformance[weakest].accuracy)
    ) {
      return subject;
    }
    return weakest;
  }, null);

  // Identify strongest subject
  const strongestSubject = coreSubjects.reduce((strongest, subject) => {
    if (
      !strongest ||
      parseFloat(subjectPerformance[subject].accuracy) >
        parseFloat(subjectPerformance[strongest].accuracy)
    ) {
      return subject;
    }
    return strongest;
  }, null);

  // Generate recommendations
  const recommendations = [];

  // Overall performance recommendations
  if (averageScore < 50) {
    recommendations.push("Focus on fundamental concepts across all subjects");
  } else if (averageScore < 70) {
    recommendations.push("Practice more problems to improve your score");
  }

  // Subject-specific recommendations
  if (
    weakestSubject &&
    parseFloat(subjectPerformance[weakestSubject].accuracy) < 60
  ) {
    recommendations.push(`Strengthen your basics in ${weakestSubject}`);
  }

  // Progress-based recommendations
  if (progressTrend === "declining") {
    recommendations.push(
      "Your performance is declining. Review your weak areas"
    );
  } else if (progressTrend === "stable" && averageScore < 70) {
    recommendations.push(
      "Try different study techniques to improve your performance"
    );
  }

  // Data limitation recommendation
  if (!hasEnoughTests) {
    recommendations.push(
      `Take ${MIN_TESTS_FOR_ANALYTICS - allTests.length} more test${MIN_TESTS_FOR_ANALYTICS - allTests.length > 1 ? "s" : ""} to get more accurate insights`
    );
  }

  // Special case for when all answers are incorrect
  if (averageScore === 0 && allTests.length > 0) {
    recommendations.push(
      "It looks like none of your answers were marked correct. This might be due to a technical issue. Please contact support."
    );
  }

  return {
    dataLimitation,
    overallPerformance: {
      averageScore: parseFloat(averageScore.toFixed(2)),
      highestScore,
      lowestScore,
      progressTrend,
    },
    subjectPerformance,
    testPerformance,
    subjectComparison: {
      strongest: strongestSubject,
      weakest: weakestSubject,
    },
    recommendations,
  };
}

// Main controller function
export const getUserTestAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all tests for the user
    const [meTests, generatedTests, fullTests] = await Promise.all([
      MeTest.findAll({ where: { studentId: userId } }),
      GenerateTestResult.findAll({ where: { studentId: userId } }),
      FullTestResults.findAll({ where: { studentId: userId } }),
    ]);

    // Process all tests
    const allTests = [
      ...processMeTests(meTests),
      ...processGeneratedTests(generatedTests),
      ...processFullTests(fullTests),
    ];

    // Sort tests by date
    allTests.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate focused analytics
    const analytics = calculateFocusedAnalytics(allTests);

    // Return analytics
    res.status(200).json({
      message: "User test analytics retrieved successfully",
      analytics,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "An error occurred while retrieving user analytics",
      error: error.message,
    });
  }
};
