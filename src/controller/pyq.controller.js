import PreviousYearQuestion from "../models/previousyearquestion.model.js";

export const createPreviousYearQuestion = async (req, res) => {
  try {
    const {
      year,
      subject,
      question,
      correctAnswer,
      options,
      solution,
      diagramUrl
    } = req.body;

    // Validate required fields
    if (!year || !subject || !question || !correctAnswer || !options || !solution) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Create entry
    const newQuestion = await PreviousYearQuestion.create({
      Year: year,
      Subject: subject,
      questions: question,
      correctAnswer,
      options,
      solution,
      diagramUrl,
    });

    return res.status(201).json({
      message: "Previous year question added successfully.",
      data: newQuestion,
    });

  } catch (error) {
    console.error("Error creating previous year question:", error);
    return res.status(500).json({ message: "Server error." });
  }
};
