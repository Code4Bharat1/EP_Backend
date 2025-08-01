import TeacherQuestion from "../models/teacherquestion.model.js";
import path from "path";
import fs from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
    topicID,
  } = req.body;

  console.log("this is difficulty:", difficulty);
  console.log("topic ID :", topic);

  // === Basic Validation ===
  if (
    !topicID ||
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
    console.log("Missing or invalid required fields");
    return res.status(400).json({
      message: "Missing or invalid required fields",
    });
  }

  if (!options.includes(answer)) {
    console.log("Answer must be one of the provided options");
    return res.status(400).json({
      message: "Answer must be one of the provided options",
    });
  }

  // Optional: Check difficulty is one of predefined values
  // const validDifficulties = ["easy", "medium", "hard"];
  // if (!validDifficulties.includes(difficulty.toLowerCase())) {
  //   console.log("Difficulty must be one of: easy, medium, hard");
  //   return res.status(400).json({
  //     message: "Difficulty must be one of: easy, medium, hard",
  //   });
  // }

  try {
    await TeacherQuestion.sync({ alter: true });

    const newQuestion = await TeacherQuestion.create({
      teacherId: req.adminId,
      subject: subject.trim(),
      chapter: chapter.trim(),
      topic: topic.trim(),
      topicId : topicID,
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

export const getChapterData = async (req, res) => {
  const filePath = path.join(
    __dirname,
    "..",
    "..",
    "public",
    "neet_topics.json"
  );

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).json({ error: "Failed to read JSON file" });
    }

    try {
      const json = JSON.parse(data);
      res.status(200).json(json); // ✅ send all JSON data
    } catch (parseError) {
      console.error("Invalid JSON format:", parseError);
      res.status(500).json({ error: "Invalid JSON format" });
    }
  });
};
