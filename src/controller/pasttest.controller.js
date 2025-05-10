import jwt from "jsonwebtoken";
import config from "config";
import FullTestResults from "../models/fullTestResults.model.js";
import MeTest from "../models/saved.js";

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

    const fullTestData = await FullTestResults.findAll({
      where: { studentId: userId },
      attributes: [
        'id', 'testName', 'difficultyLevel', 'correctAnswers', 'wrongAnswers',
        'notAttempted', 'correctAnswersCount', 'wrongAnswersCount',
        'notAttemptedCount', 'subjectWisePerformance',
      ],
    });

    const meTestData = await MeTest.findAll({
      where: { studentId: userId },
      attributes: [
        'id', 'testName', 'subjectWiseMarks', 'difficultyLevel',
        'selectedChapters', 'correct', 'incorrect', 'unattempted',
      ],
    });

    const testAnalytics = [];

    const fullTestAnalytics = fullTestData.map(test => {
      let {
        correctAnswers,
        wrongAnswers,
        notAttempted,
        subjectWisePerformance
      } = test;
      const subjects = [];

      try {
        if (typeof correctAnswers === 'string') correctAnswers = JSON.parse(correctAnswers);
        if (typeof wrongAnswers === 'string') wrongAnswers = JSON.parse(wrongAnswers);
        if (typeof notAttempted === 'string') notAttempted = JSON.parse(notAttempted);

        // Handle double-encoded subjectWisePerformance
        if (typeof subjectWisePerformance === 'string') {
          try {
            subjectWisePerformance = JSON.parse(JSON.parse(subjectWisePerformance));
          } catch (err) {
            console.error(`Double parsing failed for test ${test.id}`, err);
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
        console.error(`Error parsing data in test ${test.id}:`, err);
      }

      // Fallback: Extract from correct/wrong answers
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
      };
    }).filter(Boolean);

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
      };
    }).filter(Boolean);

    testAnalytics.push(...fullTestAnalytics, ...meTestAnalytics);

    if (testAnalytics.length === 0) {
      return res.status(404).json({ error: "No valid test data found for this user" });
    }

    return res.status(200).json({ testAnalytics });
  } catch (error) {
    console.error("Error fetching test data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export { pastTest };
