import jwt from "jsonwebtoken";
import config from "config";
import FullTestResults from "../models/fullTestResults.model.js";
import MeTest from '../models/saved.js'; // Adjust the import according to your project structure

const pastTest = async (req, res) => {
  try {
    // Decode the token to get user information (same logic as before)
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const secret = config.get("jwtSecret");
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(403).json({ error: "Unauthorized: Invalid or expired token" });
    }

    const userId = decoded.id;

    // Fetch data from FullTestResults model
    const fullTestData = await FullTestResults.findAll({
      where: { studentId: userId },
      attributes: [
        'testName',
        'difficultyLevel',
        'correctAnswers',
        'wrongAnswers',
        'notAttempted',
        'correctAnswersCount',
        'wrongAnswersCount',
        'notAttemptedCount',
        'subjectWisePerformance',
      ],
    });

    // Fetch data from MeTest model
    const meTestData = await MeTest.findAll({
      where: { studentId: userId },
      attributes: [
        'testName',
        'subjectWiseMarks',
        'difficultyLevel',
        'selectedChapters',
        'correct',
        'incorrect',
        'unattempted',
      ],
    });

    // Initialize arrays to hold the analytics
    const testAnalytics = [];

    // Process FullTestResults data
    const fullTestAnalytics = fullTestData.map((test) => {
      try {
        let correctAnswers = test.correctAnswers;
        let wrongAnswers = test.wrongAnswers;
        let notAttempted = test.notAttempted;

        // Log the raw data of correctAnswers for debugging

        // If correctAnswers is a string (JSON format), parse it
        if (typeof correctAnswers === 'string') {
          try {
            // Parse the string into an array
            correctAnswers = JSON.parse(correctAnswers);
          } catch (parseError) {
            console.error(`Failed to parse correctAnswers for test ${test.testName}:`, parseError);
            correctAnswers = []; // Fallback to an empty array if parsing fails
          }
        }

        // Extract only the subjects from the correctAnswers (1st index of each array in correctAnswers)
        const subjects = correctAnswers.map(item => item[1]); // Extract subject (1st index)

        // Prepare the full test analytics data
        return {
          testName: test.testName,
          difficultyLevel: test.difficultyLevel,
          subjects,
          correctAnswers,
          wrongAnswers,
          notAttempted,
          correctAnswersCount: test.correctAnswersCount,
          wrongAnswersCount: test.wrongAnswersCount,
          notAttemptedCount: test.notAttemptedCount,
        };
      } catch (parseError) {
        // Handle case if parsing fails
        console.error(`Failed to parse correctAnswers for full test ${test.testName}:`, parseError);
        return null;
      }
    }).filter(test => test !== null);

    // Process MeTest data
    const meTestAnalytics = meTestData.map((test) => {
      try {
        let subjectWiseMarks = test.subjectWiseMarks;
        let questionTimeUsed = test.questionTimeUsed;

        // If subjectWiseMarks is a string (JSON format), parse it
        if (typeof subjectWiseMarks === 'string') {
          subjectWiseMarks = JSON.parse(subjectWiseMarks);
        }

        // Extract only the subjects (keys of the subjectWiseMarks object)
        const subjects = Object.keys(subjectWiseMarks);

        if (!questionTimeUsed) {
          questionTimeUsed = null;
        }

        // Prepare the MeTest analytics data
        return {
          testName: test.testName,
          subjects,
          difficultyLevel: test.difficultyLevel,
          questionTimeUsed,
          correct: test.correct,
          incorrect: test.incorrect,
          unattempted: test.unattempted,
        };
      } catch (parseError) {
        // Handle case if JSON parsing fails
        console.error(`Failed to parse subjectWiseMarks for MeTest ${test.testName}:`, parseError);
        return null;
      }
    }).filter(test => test !== null);

    // Combine both FullTestResults and MeTest analytics
    testAnalytics.push(...fullTestAnalytics, ...meTestAnalytics);

    if (testAnalytics.length === 0) {
      return res.status(404).json({ error: "No valid test data found for this user" });
    }

    // Return the combined test analytics
    res.status(200).json({ testAnalytics });
  } catch (error) {
    console.error("Error fetching test data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export { pastTest };
