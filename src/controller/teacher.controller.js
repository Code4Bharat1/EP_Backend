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

  console.log("this is difficulty:",difficulty)

  // === Basic Validation ===
  if (
    !teacherId ||
    !subject ||
    !chapter ||
    !topic ||
    !question ||
    !options ||
    !Array.isArray(options) ||
    options.length < 2 ||
    !answer ||
    !difficulty
  ) {
    console.log("Missing or invalid required fields")
    return res.status(400).json({
      message: "Missing or invalid required fields",
    });
  }

  if (!options.includes(answer)) {
    console.log("Answer must be one of the provided options")
    return res.status(400).json({
      message: "Answer must be one of the provided options",
    });
  }

  // Optional: Check difficulty is one of predefined values
  const validDifficulties = ["easy", "medium", "hard"];
  if (!validDifficulties.includes(difficulty.toLowerCase())) {
    console.log("Answer must be one of the provided options")
    return res.status(400).json({
      message: "Difficulty must be one of: easy, medium, hard",
    });
  }

  try {
    await TeacherQuestion.sync({ alter: true });

    const newQuestion = await TeacherQuestion.create({
      teacherId : req.adminId,
      subject: subject.trim(),
      chapter: chapter.trim(),
      topic: topic.trim(),
      question: question.trim(),
      options,
      answer,
      difficulty: difficulty.toLowerCase(),
      explanation: explanation ? explanation.trim() : "",
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
