import jwt from "jsonwebtoken";
import config from "config";
import MeTest from "../models/saved.js"; // MeTest model for saving the test
import { Question, Option } from "../models/everytestmode.refrence.js"; // Models for questions and options

// POST /metest/submit-test
const submitTest = async (req, res) => {
  try {
    // Ensure the user is authenticated
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Invalid token format" });
    }

    // ✅ Verify and Decode Token
    const secret = config.get("jwtSecret");
    let studentId;
    try {
      const decoded = jwt.verify(token, secret);
      studentId = decoded.id; // Extract student ID from token
    } catch (err) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Invalid or expired token" });
    }

    console.log("✅ Student ID extracted:", studentId); // Debugging log

    // ✅ Extract test submission data from request body
    const {
      correctAnswers = [],
      wrongAnswers = [],
      notAttempted = [],
      startTime,
      endTime,
    } = req.body;

    if (!correctAnswers || !wrongAnswers || !notAttempted) {
      return res.status(400).json({ error: "Missing required answer data." });
    }

    if (
      !startTime ||
      !endTime ||
      isNaN(new Date(startTime)) ||
      isNaN(new Date(endTime))
    ) {
      return res
        .status(400)
        .json({ error: "Invalid start or end time format." });
    }

    const totalQuestions =
      correctAnswers.length + wrongAnswers.length + notAttempted.length;
    const correctAnswersCount = correctAnswers.length;
    const wrongAnswersCount = wrongAnswers.length;
    const notAttemptedCount = notAttempted.length;
    console.log("✅ Total Questions:", totalQuestions);

    // Calculate the total marks (each question is worth 4 marks)
    const totalMarks = totalQuestions * 4;

    let subjectWisePerformance = [];
    let chapterWisePerformance = [];

    // ✅ Process correct answers
    correctAnswers.forEach(
      ([
        questionId,
        subject,
        chapter,
        selectedOption,
        correctOption,
        marks,
        timeSpent,
      ]) => {
        if (!subject || !chapter) return;

        // Update subject-wise performance
        let existingSubject = subjectWisePerformance.find(
          (s) => s[0] === subject
        );
        if (!existingSubject) {
          existingSubject = [subject, 0, 0, 0, 0]; // ["subject", correct, incorrect, notAttempted, marks]
          subjectWisePerformance.push(existingSubject);
        }
        existingSubject[1] += 1; // Increment correct
        existingSubject[4] += marks || 0; // Increment marks

        let existingChapter = chapterWisePerformance.find(
          (c) => c[0] === chapter
        );
        if (!existingChapter) {
          existingChapter = [chapter, 0, 0, 0]; // ["chapter", correct, incorrect, marks]
          chapterWisePerformance.push(existingChapter);
        }
        existingChapter[1] += 1; // Increment correct
        existingChapter[3] += marks || 0; // Increment marks
      }
    );

    // ✅ Process incorrect answers
    wrongAnswers.forEach(
      ([
        questionId,
        subject,
        chapter,
        selectedOption,
        correctOption,
        marks,
        timeSpent,
      ]) => {
        if (!subject || !chapter) return;

        let existingSubject = subjectWisePerformance.find(
          (s) => s[0] === subject
        );
        if (!existingSubject) {
          existingSubject = [subject, 0, 0, 0, 0]; // ["subject", correct, incorrect, notAttempted, marks]
          subjectWisePerformance.push(existingSubject);
        }
        existingSubject[2] += 1; // Increment incorrect
        existingSubject[4] += marks || 0; // Increment marks

        let existingChapter = chapterWisePerformance.find(
          (c) => c[0] === chapter
        );
        if (!existingChapter) {
          existingChapter = [chapter, 0, 0, 0]; // ["chapter", correct, incorrect, marks]
          chapterWisePerformance.push(existingChapter);
        }
        existingChapter[2] += 1; // Increment incorrect
        existingChapter[3] += marks || 0; // Increment marks
      }
    );

    // ✅ Process unattempted questions
    notAttempted.forEach(([questionId, subject, chapter]) => {
      if (!subject || !chapter) return;

      let existingSubject = subjectWisePerformance.find(
        (s) => s[0] === subject
      );
      if (!existingSubject) {
        existingSubject = [subject, 0, 0, 0, 0]; // ["subject", correct, incorrect, notAttempted, marks]
        subjectWisePerformance.push(existingSubject);
      }
      existingSubject[3] += 1; // Increment notAttempted

      let existingChapter = chapterWisePerformance.find(
        (c) => c[0] === chapter
      );
      if (!existingChapter) {
        existingChapter = [chapter, 0, 0, 0]; // ["chapter", correct, incorrect, marks]
        chapterWisePerformance.push(existingChapter);
      }
    });

    // ✅ Store the test result in the database
    const newTestResult = await MeTest.create({
      studentId,
      testName: "Full Test",
      difficultyLevel: "Simple",
      recommendedBy: "Start Test",
      status: "Completed",
      createdAt: new Date(startTime),
      updatedAt: new Date(endTime),
      totalQuestions,
      correctAnswersCount,
      wrongAnswersCount,
      notAttemptedCount,
      marksObtained: totalMarks, // Marks obtained is equal to totalMarks
      totalMarks,
      subjectWisePerformance: JSON.stringify(subjectWisePerformance), // Now in array format
      chapterWisePerformance: JSON.stringify(chapterWisePerformance), // Now in array format
    });

    res.status(201).json({
      message: "✅ Test submitted successfully!",
      testResult: newTestResult,
    });
  } catch (error) {
    console.error("❌ Error submitting test:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

export { submitTest };
