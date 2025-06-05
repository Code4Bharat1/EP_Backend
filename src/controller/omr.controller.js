import generateTestResult from "../models/generateTestresult.model.js";
import Student from "../models/student.model.js";

export const omrGeneratedAnswers = async (req, res) => {
  try {
    const {
      studentemail,
      testname,
      answers,
      score,
      correctAnswers,
      incorrectAnswers,
      unattempted,
      totalquestions,
      overallMarks
    } = req.body;

    if (!studentemail) {
      return res.status(400).json({ message: "Student email is required." });
    }

    const student = await Student.findOne({ where: { emailAddress: studentemail } });

    if (!student) {
      return res.status(404).json({ message: "Student not found with this email." });
    }

    const newResult = await generateTestResult.create({
      studentId: student.id,
      testid: null,
      testname: testname || "OMR Test",
      selectedChapters: null,
      answers,
      score,
      correctAnswers,
      incorrectAnswers,
      unattempted,
      totalquestions,
      overallmarks: overallMarks,
      subjectWiseMarks: null,
    });

    return res.status(201).json({
      message: "OMR test result saved successfully.",
      data: newResult,
    });

  } catch (error) {
    console.error("Error saving OMR sheet marks:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
