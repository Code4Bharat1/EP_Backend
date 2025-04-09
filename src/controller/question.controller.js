import { dataofquestions } from "../../public/cleaned.js";
import {
  Pdf,
  Question,
  Option,
  Diagram,
} from "../models/everytestmode.refrence.js"; // Import models
import { Op } from "sequelize";
import levenshtein from "fast-levenshtein"; // Install using `npm install fast-levenshtein`

const fetchQuestions = async (req, res) => {
  try {
    const subjectTargets = {
      Physics: 45,
      Chemistry: 45,
      Biology: 90,
    };

    const distribution = {};
    const subjectChapterPairs = [];
    for (const [subject, chapters] of Object.entries(dataofquestions)) {
      if (!subjectTargets[subject]) continue;
      const chapterNames = Object.keys(chapters);
      for (const chapter of chapterNames) {
        const formattedChapter = chapter.split(":").pop().trim().toLowerCase(); // Remove Unit Prefix
        subjectChapterPairs.push({ subject, chapter: formattedChapter });
      }
    }

    const allPdfs = await Pdf.findAll({
      attributes: ["id", "subject", "topic_tags"],
    });
    const pdfMap = {};
    for (const pdf of allPdfs) {
      const dbChapter = pdf.topic_tags.toLowerCase().trim();
      const key = `${pdf.subject.toLowerCase()}||${dbChapter}`;
      if (!pdfMap[key]) pdfMap[key] = [];
      pdfMap[key].push(pdf.id);
    }

    // Step 4: Function to find closest chapter match using Levenshtein
    const findClosestMatch = (subject, chapter) => {
      let closestMatch = null;
      let closestDistance = Infinity;
      for (const pdf of allPdfs) {
        if (pdf.subject.toLowerCase() !== subject.toLowerCase()) continue;
        const dbChapter = pdf.topic_tags.toLowerCase().trim();
        const distance = levenshtein.get(chapter, dbChapter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestMatch = dbChapter;
        }
      }
      return closestMatch;
    };

    // Step 5: Build the question distribution with PDF IDs
    for (const { subject, chapter } of subjectChapterPairs) {
      const closestMatch = findClosestMatch(subject, chapter);
      const key = `${subject.toLowerCase()}||${closestMatch || chapter}`;
      const pdf_ids = pdfMap[key] || [];

      distribution[subject] = distribution[subject] || {};
      distribution[subject][chapter] = {
        questions: Math.floor(
          subjectTargets[subject] / Object.keys(dataofquestions[subject]).length
        ),
        pdf_id: pdf_ids,
      };
    }

    const questionsWithOptions = [];

    // Step 6: Fetch questions based on the generated distribution
    for (const [subject, chapters] of Object.entries(distribution)) {
      for (const [chapter, details] of Object.entries(chapters)) {
        const { questions, pdf_id } = details;
        if (pdf_id.length === 0) continue; // Skip if no PDFs

        // Pick one random PDF ID
        const randomPdfId = pdf_id[Math.floor(Math.random() * pdf_id.length)];

        // Fetch questions linked to the chosen PDF
        const fetchedQuestions = await Question.findAll({
          where: { pdf_id: randomPdfId },
          include: [
            { model: Option, as: "options" },
            { model: Diagram, required: false },
          ],
        });

        // Shuffle and select required number of questions
        const shuffled = fetchedQuestions.sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, questions);

        // Process the selected questions
        for (let question of selectedQuestions) {
          const options = question.options.map((opt) => opt.dataValues);
          const correctOption = options.find(opt => opt.is_correct); // Find the correct option
          const diagramPath =
            question.Diagrams?.length > 0
              ? question.Diagrams[0].dataValues.diagram_path
              : null;

          questionsWithOptions.push({
            question: {
              ...question.dataValues,
              subject, // Include subject
              chapter, // Include chapter
            },
            options,
            correctAnswer: correctOption, // Include the correct option
            diagram: diagramPath,
          });
        }
      }
    }

    if (questionsWithOptions.length === 0) {
      return res
        .status(404)
        .json({ error: "No questions found based on the distribution." });
    }

    res.status(200).json({ questions: questionsWithOptions });
  } catch (error) {
    console.error("Error fetching questions:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export { fetchQuestions };
