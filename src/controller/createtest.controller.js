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
    const { selectedSubjects, selectedChapters } = req.body; // Get selectedSubjects and selectedChapters from the request body
    console.log("Selected Subjects: ", selectedSubjects);
    console.log("Selected Chapters: ", selectedChapters);
    const distribution = {};
    const subjectChapterPairs = [];

    // Prepare subject-chapter pairs
    for (const subject of selectedSubjects) {
      const chapters = selectedChapters[subject];
      console.log(`Chapters for ${subject}:`, chapters);
      for (const chapter of chapters) {
        const chapterName = chapter.name.toLowerCase().trim();
        subjectChapterPairs.push({ subject, chapter: chapterName });
      }
    }
    console.log("Subject-Chapter Pairs: ", subjectChapterPairs);
    const allPdfs = await Pdf.findAll({
      attributes: ["id", "subject", "topic_tags"],
    });
    console.log("All PDFs: ", allPdfs);

    const pdfMap = {};
    // Map PDF IDs by subject and chapter
    for (const pdf of allPdfs) {
      const dbChapter = pdf.topic_tags.toLowerCase().trim();
      const key = `${pdf.subject.toLowerCase()}||${dbChapter}`;
      if (!pdfMap[key]) pdfMap[key] = [];
      pdfMap[key].push(pdf.id);
    }
    console.log("PDF Map: ", pdfMap);

    // Function to find closest match between chapter and database topic_tags
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

    // Build distribution for each subject and chapter
    for (const { subject, chapter } of subjectChapterPairs) {
      const closestMatch = findClosestMatch(subject, chapter);
      const key = `${subject.toLowerCase()}||${closestMatch || chapter}`;
      const pdf_ids = pdfMap[key] || [];

      if (!distribution[subject]) {
        distribution[subject] = {};
      }

      distribution[subject][chapter] = {
        pdf_id: pdf_ids,
      };
    }
    console.log("Distribution: ", distribution);

    const questionsWithOptions = [];

    // Fetch questions based on the selected chapters and subjects
    for (const [subject, chapters] of Object.entries(distribution)) {
      for (const [chapter, details] of Object.entries(chapters)) {
        const { pdf_id } = details;
        console.log(
          `Processing subject: ${subject}, chapter: ${chapter}, pdf_ids: ${pdf_id}`
        );

        if (pdf_id.length === 0) continue; // Skip if no PDFs are available

        // Pick a random PDF ID from the available PDFs for the subject and chapter
        const randomPdfId = pdf_id[Math.floor(Math.random() * pdf_id.length)];
        console.log("Random PDF ID: ", randomPdfId);

        // Fetch questions linked to the chosen PDF
        const fetchedQuestions = await Question.findAll({
          where: { pdf_id: randomPdfId },
          include: [
            { model: Option, as: "options" },
            { model: Diagram, required: false },
          ],
        });
        console.log("Fetched Questions: ", fetchedQuestions);

        // Shuffle and select the required number of questions based on `numQuestions`
        const shuffled = fetchedQuestions.sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, 6); // We are selecting 6 questions for the example
        console.log("Selected Questions: ", selectedQuestions);

        // Process the selected questions
        for (let question of selectedQuestions) {
          const options = question.options.map((opt) => opt.dataValues);
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
            diagram: diagramPath,
          });
        }
      }
    }

    if (questionsWithOptions.length === 0) {
      console.log(
        "No questions found based on the selected subjects and chapters."
      );
      return res.status(404).json({
        error:
          "No questions found based on the selected subjects and chapters.",
      });
    }

    console.log("Questions with options: ", questionsWithOptions);
    res.status(200).json({ questions: questionsWithOptions });
  } catch (error) {
    console.error("Error fetching questions:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export { fetchQuestions };

