import { Pdf } from "../models/everytestmode.refrence.js"; // Adjust path as needed
import { Question } from "../models/everytestmode.refrence.js";

//Create different controller for different subject as it was unable to fetch the chapter names and question efficiently...

const fetchPdfIdsBySubjects = async (req, res) => {
  try {
    // Set subject to "Physics" for now
    const selectedSubjects = ["Physics"]; 

    if (!selectedSubjects || selectedSubjects.length === 0) {
      return res.status(400).json({ error: "Please provide subject names." });
    }

    // Query the Pdf table to fetch the IDs and chapter names (topic_tags) for the selected subjects
    const pdfRecords = await Pdf.findAll({
      where: {
        subject: selectedSubjects, // Match subjects in the array
      },
      attributes: ['id', 'topic_tags'], // Fetch both 'id' and 'topic_tags' (chapter names)
    });

    if (pdfRecords.length === 0) {
      return res.status(404).json({ error: "No PDFs found for the selected subjects." });
    }

    // Extract IDs and chapter names from the fetched pdfRecords
    const pdfData = pdfRecords.map((pdf) => ({
      pdf_id: pdf.id,
      chapter_name: pdf.topic_tags, // This is the chapter name
    }));

    // // Log the IDs and chapter names to the console
    // console.log("Selected PDFs with Chapter Names:", pdfData);

    // Step 2: Use the pdf_ids to fetch corresponding questions from the Question table
    const questions = await Question.findAll({
      where: {
        pdf_id: pdfData.map(pdf => pdf.pdf_id), // Match pdf_id in the Question table
      },
      attributes: ['id', 'question_text', 'pdf_id'], // Fetch question id, text, and associated pdf_id
    });

    if (questions.length === 0) {
      return res.status(404).json({ error: "No questions found for the selected PDFs." });
    }

    // Return the questions along with the pdf and chapter information in the response
    const questionsWithChapterNames = questions.map((question) => {
      const pdfInfo = pdfData.find((pdf) => pdf.pdf_id === question.pdf_id);
      return {
        ...question.dataValues,
        chapter_name: pdfInfo ? pdfInfo.chapter_name : null, // Add chapter name from pdfData
      };
    });

    res.status(200).json({ questions: questionsWithChapterNames });
  } catch (error) {
    console.error("Error fetching PDFs and questions:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//Questions to fetch from chemistry section
const fetchPdfIdsBySubjectsForChemistry = async (req, res) => {
  try {
    const selectedSubject = "Chemistry";

    // Step 1: Fetch Chemistry PDFs
    const pdfRecords = await Pdf.findAll({
      where: { subject: selectedSubject },
      attributes: ['id', 'filename', 'topic_tags'],
    });

    if (!pdfRecords.length) {
      return res.status(404).json({ error: "No Chemistry PDFs found." });
    }

    // Step 2: Prepare PDF ID map and chapter list
    const pdfMap = {};
    const pdfIds = [];
    const chaptersList = [];

    pdfRecords.forEach((pdf) => {
      const chapterName = pdf.topic_tags || pdf.filename || "Unknown Chapter";
      pdfIds.push(pdf.id);
      pdfMap[pdf.id] = { chapter_name: chapterName };
      chaptersList.push({
        id: pdf.id,
        chapter_name: chapterName,
      });
    });

    // Step 3: Fetch Questions by PDF ID
    const questions = await Question.findAll({
      where: { pdf_id: pdfIds },
      attributes: ['id', 'question_text', 'pdf_id'],
    });

    if (!questions.length) {
      return res.status(404).json({ error: "No questions found for Chemistry." });
    }

    // Step 4: Attach chapter name to each question
    const questionsWithChapterNames = questions.map((q) => ({
      ...q.dataValues,
      chapter_name: pdfMap[q.pdf_id]?.chapter_name || null,
    }));

    // Step 5: Send both questions and chapters
    res.status(200).json({
      questions: questionsWithChapterNames,
      chapters: chaptersList,
    });
    console.log(chaptersList)
  } catch (error) {
    console.error("Error fetching Chemistry questions and chapters:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



const fetchPdfIdsBySubjectsForBiology = async (req, res) => {
  try {
    // Set subject to "Biology"
    const selectedSubjects = ["Biology"]; 

    if (!selectedSubjects || selectedSubjects.length === 0) {
      return res.status(400).json({ error: "Please provide subject names." });
    }

    // Query the Pdf table to fetch the IDs and chapter names (topic_tags) for the selected subjects
    const pdfRecords = await Pdf.findAll({
      where: {
        subject: selectedSubjects, // Match subjects in the array
      },
      attributes: ['id', 'topic_tags'], // Fetch both 'id' and 'topic_tags' (chapter names)
    });

    if (pdfRecords.length === 0) {
      return res.status(404).json({ error: "No PDFs found for the selected subjects." });
    }

    // Extract IDs and chapter names from the fetched pdfRecords
    const pdfData = pdfRecords.map((pdf) => ({
      pdf_id: pdf.id,
      chapter_name: pdf.topic_tags, // This is the chapter name
    }));

    // Log the IDs and chapter names to the console
    console.log("Selected PDFs with Chapter Names for Biology:", pdfData);

    // Step 2: Use the pdf_ids to fetch corresponding questions from the Question table
    const questions = await Question.findAll({
      where: {
        pdf_id: pdfData.map(pdf => pdf.pdf_id), // Match pdf_id in the Question table
      },
      attributes: ['id', 'question_text', 'pdf_id'], // Fetch question id, text, and associated pdf_id
    });

    if (questions.length === 0) {
      return res.status(404).json({ error: "No questions found for the selected PDFs." });
    }

    // Return the questions along with the pdf and chapter information in the response
    const questionsWithChapterNames = questions.map((question) => {
      const pdfInfo = pdfData.find((pdf) => pdf.pdf_id === question.pdf_id);
      return {
        ...question.dataValues,
        chapter_name: pdfInfo ? pdfInfo.chapter_name : null, // Add chapter name from pdfData
      };
    });

    res.status(200).json({ questions: questionsWithChapterNames });
  } catch (error) {
    console.error("Error fetching PDFs and questions for Biology:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export { fetchPdfIdsBySubjects , fetchPdfIdsBySubjectsForChemistry, fetchPdfIdsBySubjectsForBiology};