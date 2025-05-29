import { dataofquestions } from "../../public/cleaned.js";
import {
  Pdf,
  Question,
  Option,
  Diagram,
} from "../models/everytestmode.refrence.js";
import { Op } from "sequelize";
import levenshtein from "fast-levenshtein";

const fetchQuestions = async (req, res) => {
  try {
    const subjectTargets = {
      Physics: 45,
      Chemistry: 45,
      Biology: 90,
    };

    const questionCountPerSubject = {
      Physics: 0,
      Chemistry: 0,
      Biology: 0,
    };

    const subjectIndexTracker = {
      Physics: 1,
      Chemistry: 1,
      Biology: 1,
    };

    const subjectChapterMap = {};

    // Fetch all PDFs
    const allPdfs = await Pdf.findAll({
      attributes: ["id", "subject", "topic_tags"],
    });

    // Match chapters to closest PDF tag using Levenshtein
    for (const [subject, chapters] of Object.entries(dataofquestions)) {
      if (!subjectTargets[subject]) continue;

      subjectChapterMap[subject] = [];

      for (const chapterKey of Object.keys(chapters)) {
        const chapter = chapterKey.split(":").pop().trim().toLowerCase();
        const closestMatch = allPdfs
          .filter((pdf) => pdf.subject.toLowerCase() === subject.toLowerCase())
          .map((pdf) => ({
            id: pdf.id,
            tag: pdf.topic_tags.toLowerCase().trim(),
            distance: levenshtein.get(chapter, pdf.topic_tags.toLowerCase().trim()),
          }))
          .sort((a, b) => a.distance - b.distance)[0];

        if (closestMatch) {
          subjectChapterMap[subject].push({
            chapter,
            pdf_id: closestMatch.id,
          });
        }
      }
    }

    const questionsWithOptions = [];

    for (const subject of Object.keys(subjectTargets)) {
      const targetCount = subjectTargets[subject];
      let totalCollected = 0;
      const usedQuestionIds = new Set();
      const chapterPdfPairs = subjectChapterMap[subject] || [];

      while (totalCollected < targetCount) {
        for (const { chapter, pdf_id } of chapterPdfPairs) {
          const fetched = await Question.findAll({
            where: { pdf_id },
            include: [
              { model: Option, as: "options" },
              { model: Diagram, required: false },
            ],
          });

          // Remove duplicates
          const unused = fetched.filter((q) => !usedQuestionIds.has(q.id));

          const needed = targetCount - totalCollected;
          const selected = unused.sort(() => 0.5 - Math.random()).slice(0, needed);

          for (const question of selected) {
            const options = question.options.map((opt) => opt.dataValues);
            const correctOption = options.find((opt) => opt.is_correct);
            const diagramPath =
              question.Diagrams?.length > 0
                ? question.Diagrams[0].dataValues.diagram_path
                : null;

            questionsWithOptions.push({
              index: subjectIndexTracker[subject], // ✅ Index per subject
              question: {
                ...question.dataValues,
                subject,
                chapter,
              },
              options,
              correctAnswer: correctOption,
              diagram: diagramPath,
            });

            usedQuestionIds.add(question.id);
            totalCollected++;
            questionCountPerSubject[subject]++;
            subjectIndexTracker[subject]++;

            if (totalCollected >= targetCount) break;
          }

          if (totalCollected >= targetCount) break;
        }

        // If we run out of unique questions, stop trying
        if (totalCollected < targetCount) break;
      }
    }

    if (questionsWithOptions.length === 0) {
      return res.status(404).json({ error: "No questions found." });
    }

    res.status(200).json({
      questions: questionsWithOptions,
      questionCountPerSubject,
    });

  } catch (error) {
    console.error("Error fetching questions:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export { fetchQuestions };
  