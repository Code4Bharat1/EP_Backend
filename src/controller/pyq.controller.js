import { Sequelize } from "sequelize";
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


export const getDistinctYears = async (req, res) => {
  try {
    const years = await PreviousYearQuestion.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("Year")), "Year"]
      ],
      order: [["Year", "DESC"]],
    });

    const formattedYears = years.map(entry => entry.Year);
    res.status(200).json({ years: formattedYears });
  } catch (error) {
    console.error("Error fetching distinct years:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const getQuestionsByYear = async (req, res) => {
  const { year } = req.body;
  // console.log("selected year ", year);

  if (!year) {
    return res.status(400).json({ error: "Year is required in the request body" });
  }

  try {
    const questions = await PreviousYearQuestion.findAll({
      where: { Year: year },
      attributes: [
        "Subject",
        "questions",
        "options",
        "correctAnswer",
        "solution",
        "diagramUrl"
      ],
      order: [["Subject", "ASC"]],
    });

    const result = {};

    questions.forEach(q => {
      if (!result[q.Subject]) {
        result[q.Subject] = [];
      }

      // Ensure options is a plain object (JSON)
      let formattedOptions = {};
      try {
        if (typeof q.options === "string") {
          formattedOptions = JSON.parse(q.options);
        } else if (typeof q.options === "object" && q.options !== null) {
          formattedOptions = q.options;
        }
      } catch (err) {
        console.warn("Invalid options format, defaulting to empty object");
        formattedOptions = {};
      }

      result[q.Subject].push({
        question: q.questions,
        options: formattedOptions, // retain object format (a, b, c, d)
        correctAnswer: q.correctAnswer,
        diagramUrl: q.diagramUrl,
      });
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching questions by year:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
