import TeacherQuestion from "../models/teacherquestion.model.js";
import { sequelizeCon } from "../init/dbConnection.js";

export const createTeacherQuestion = async (req, res) => {
  const {
    teacherId,
    subject,
    chapter,
    topic,
    question,
    options,
    answer,
    difficulty,
    explanation,
  } = req.body;

  try {
    await TeacherQuestion.sync({ alter: true });
    const newQuestion = await TeacherQuestion.create({
      teacherId,
      subject,
      chapter,
      topic,
      question,
      options,
      answer,
      difficulty,
      explanation,
    });

    res.status(201).json({
      message: "Question created successfully",
      data: newQuestion,
    });
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
