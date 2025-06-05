// controllers/questionController.js

import { Question, Option, Solution, Diagram,Pdf } from "../models/everytestmode.refrence.js";

export const createQuestionWithDetails = async (req, res) => {
  try {
    const {
      pdfId,
      topicId,
      question,
      options,
      solution,
      diagramPath,
      difficulty_level,
    } = req.body;

    if (!pdfId || !question || !options?.length || !solution) {
      return res.status(400).json({
        message: "Required fields: pdfId, question, options, solution.",
      });
    }

    const validDifficulties = ["simple", "medium", "hard"];
    if (!validDifficulties.includes(difficulty_level)) {
      return res.status(400).json({
        message: "Invalid difficulty_level. Must be one of: simple, medium, hard.",
      });
    }

    // Step 1: Create the question
    const newQuestion = await Question.create({
      pdf_id: pdfId,
      topic_id: topicId || null,
      question_text: question,
      difficulty_level,
    });

    // Step 2: Create the options
    const optionEntries = options.map((opt) => ({
      question_id: newQuestion.id,
      option_text: opt.option_text,
      is_correct: opt.is_correct || false,
    }));
    await Option.bulkCreate(optionEntries);

    // Step 3: Add the solution
    await Solution.create({
      question_id: newQuestion.id,
      solution_text: solution,
    });

    // Step 4: Optionally add a diagram
    if (diagramPath) {
      await Diagram.create({
        question_id: newQuestion.id,
        diagram_path: diagramPath,
      });
    }

    return res.status(201).json({
      message: "Question created successfully",
      questionId: newQuestion.id,
    });
  } catch (error) {
    console.error("Error creating question:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const createPdfEntry = async (req, res) => {
  try {
    const { chapterName, subject, topicTags } = req.body;

    if (!chapterName || !subject || !topicTags) {
      return res.status(400).json({
        message: "Required fields: chapterName, subject, topicTags",
      });
    }

    const pdfEntry = await Pdf.create({
      filename: chapterName,
      subject: subject,
      exam_type: "NEET",
      topic_tags: Array.isArray(topicTags) ? topicTags.join(", ") : topicTags,
      difficulty_level: "simple",
    });

    return res.status(201).json({
      message: "PDF entry created successfully",
      pdfId: pdfEntry.id,
    });
  } catch (error) {
    console.error("Error creating PDF entry:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};