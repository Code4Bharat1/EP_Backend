import jwt from "jsonwebtoken";
import config from "config";
import FullTestResults from "../models/fullTestResults.model.js";
import MeTest from "../models/saved.js";
import generateTestResult from "../models/generateTestresult.model.js";

const pastTest = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const secret = config.get("jwtSecret");

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(403).json({ error: "Unauthorized: Invalid or expired token" });
    }

    const userId = decoded.id;

    const [fullTestData, meTestData, generatetestData] = await Promise.all([
      FullTestResults.findAll({
        where: { studentId: userId },
        attributes: [
          'id', 'testName', 'difficultyLevel', 'correctAnswers', 'wrongAnswers',
          'notAttempted', 'correctAnswersCount', 'wrongAnswersCount',
          'notAttemptedCount', 'subjectWisePerformance', 'createdAt'
        ]
      }),
      MeTest.findAll({
        where: { studentId: userId },
        attributes: [
          'id', 'testName', 'subjectWiseMarks', 'difficultyLevel',
          'selectedChapters', 'correct', 'incorrect', 'unattempted', 'createdAt'
        ]
      }),
        generateTestResult.findAll({
        where: { studentId: userId },
        attributes: [
          // Alias your real PK "testid" to "id" for consistency
          ["testid", "id"],
          "testname",
          "selectedChapters",
          "answers",
          "score",
          "correctAnswers",
          "incorrectAnswers",
          "unattempted",
          "totalquestions",
          "overallmarks",
          "subjectWiseMarks",
          "createdAt",
        ],
        order: [["createdAt", "DESC"]],
      }),
    ]);

    const fullTestAnalytics = fullTestData.map(test => {
      let { correctAnswers, wrongAnswers, notAttempted, subjectWisePerformance } = test;
      const subjects = [];

      try {
        if (typeof correctAnswers === 'string') correctAnswers = JSON.parse(correctAnswers);
        if (typeof wrongAnswers === 'string') wrongAnswers = JSON.parse(wrongAnswers);
        if (typeof notAttempted === 'string') notAttempted = JSON.parse(notAttempted);

        if (typeof subjectWisePerformance === 'string') {
          try {
            subjectWisePerformance = JSON.parse(JSON.parse(subjectWisePerformance));
          } catch (err) {
            subjectWisePerformance = [];
          }
        }

        if (Array.isArray(subjectWisePerformance)) {
          subjectWisePerformance.forEach(perf => {
            if (Array.isArray(perf) && typeof perf[0] === 'string') {
              subjects.push(perf[0]);
            }
          });
        }
      } catch (err) {
        console.error(`Parsing error in fullTest ${test.testName}:`, err);
      }

      const allAnswers = [...(correctAnswers || []), ...(wrongAnswers || [])];
      allAnswers.forEach(answer => {
        if (Array.isArray(answer) && typeof answer[1] === 'string' && !subjects.includes(answer[1])) {
          subjects.push(answer[1]);
        }
      });

      const uniqueSubjects = [...new Set(subjects)];

      return {
        testId: test.id,
        testName: test.testName,
        difficultyLevel: test.difficultyLevel,
        subjects: uniqueSubjects,
        correctAnswers,
        wrongAnswers,
        notAttempted,
        correctAnswersCount: test.correctAnswersCount,
        wrongAnswersCount: test.wrongAnswersCount,
        notAttemptedCount: test.notAttemptedCount,
        createdAt: test.createdAt
      };
    });

    const meTestAnalytics = meTestData.map(test => {
      let subjectWiseMarks = test.subjectWiseMarks;
      const subjects = [];

      try {
        if (typeof subjectWiseMarks === 'string') {
          subjectWiseMarks = JSON.parse(subjectWiseMarks);
        }
        if (subjectWiseMarks && typeof subjectWiseMarks === 'object') {
          Object.keys(subjectWiseMarks).forEach(key => subjects.push(key));
        }
      } catch (err) {
        console.error(`Parsing error in MeTest ${test.testName}:`, err);
        return null;
      }

      return {
        testId: test.id,
        testName: test.testName,
        subjects,
        difficultyLevel: test.difficultyLevel,
        correct: test.correct,
        incorrect: test.incorrect,
        unattempted: test.unattempted,
        createdAt: test.createdAt
      };
    }).filter(Boolean);

    const generateTestAnalytics = generatetestData.map(test => {
      let subjectWiseMarks = test.subjectWiseMarks;
      const subjects = [];

      try {
        if (typeof subjectWiseMarks === 'string') {
          subjectWiseMarks = JSON.parse(subjectWiseMarks);
        }
        if (subjectWiseMarks && typeof subjectWiseMarks === 'object') {
          Object.keys(subjectWiseMarks).forEach(key => subjects.push(key));
        }
      } catch (err) {
        console.error(`Parsing error in generateTest ${test.testName}:`, err);
        return null;
      }

      return {
        testId: test.id,
        testName: test.testname,
        subjects,
        correct: test.correctAnswers,
        incorrect: test.incorrectAnswers,
        unattempted: test.unattempted,
        createdAt: test.createdAt
      };
    }).filter(Boolean);

    const responsePayload = {
      fullTests: fullTestAnalytics,
      meTests: meTestAnalytics,
      generatedTests: generateTestAnalytics
    };

    const totalTestsCount = fullTestAnalytics.length + meTestAnalytics.length + generateTestAnalytics.length;

    if (totalTestsCount === 0) {
      return res.status(404).json({ error: "No valid test data found for this user" });
    }

    return res.status(200).json(responsePayload);

  } catch (error) {
    console.error("Error fetching test data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export { pastTest };
