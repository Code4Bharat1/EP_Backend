import { Pdf } from "../models/everytestmode.refrence.js"; // Adjust path as needed
import { Question } from "../models/everytestmode.refrence.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadJsonData = () => {
  try {
    const jsonFilePath = join(__dirname, "../../public/neet_topics.json"); // Adjust path as needed
    const jsonData = JSON.parse(readFileSync(jsonFilePath, "utf8"));
    return jsonData;
  } catch (error) {
    console.error("Error loading JSON data:", error);
    return null;
  }
};
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
      attributes: ["id", "topic_tags"], // Fetch both 'id' and 'topic_tags' (chapter names)
    });

    if (pdfRecords.length === 0) {
      return res
        .status(404)
        .json({ error: "No PDFs found for the selected subjects." });
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
        pdf_id: pdfData.map((pdf) => pdf.pdf_id), // Match pdf_id in the Question table
      },
      attributes: ["id", "question_text", "pdf_id"], // Fetch question id, text, and associated pdf_id
    });

    if (questions.length === 0) {
      return res
        .status(404)
        .json({ error: "No questions found for the selected PDFs." });
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
    console.error(
      "Error fetching PDFs and questions:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//Questions to fetch from chemistry section
const fetchPdfIdsBySubjectsForChemistry = async (req, res) => {
  try {
    // SQL Query for matching PDF records with topics
    const query = `
      SELECT 
        pdfs.id AS pdf_id,
        pdfs.subject AS pdf_subject,
        pdfs.topic_tags AS pdf_chapter_name,
        topics.topic_id,
        topics.topic_name
      FROM 
        pdfs
      JOIN 
        topics ON pdfs.subject = topics.subject 
               AND FIND_IN_SET(topics.chapter_name, pdfs.topic_tags) > 0
      WHERE 
        pdfs.subject = 'Chemistry';  -- Filter by subject (can be dynamic based on req)
    `;

    // Execute the query using Sequelize's raw query method
    const results = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    // Check if no results found
    if (results.length === 0) {
      return res.status(404).json({ error: "No PDFs found for Chemistry." });
    }

    // Send the results as response
    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching PDFs and topics:", error.message);
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
      attributes: ["id", "topic_tags"], // Fetch both 'id' and 'topic_tags' (chapter names)
    });

    if (pdfRecords.length === 0) {
      return res
        .status(404)
        .json({ error: "No PDFs found for the selected subjects." });
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
        pdf_id: pdfData.map((pdf) => pdf.pdf_id), // Match pdf_id in the Question table
      },
      attributes: ["id", "question_text", "pdf_id"], // Fetch question id, text, and associated pdf_id
    });

    if (questions.length === 0) {
      return res
        .status(404)
        .json({ error: "No questions found for the selected PDFs." });
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
    console.error(
      "Error fetching PDFs and questions for Biology:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export {
  fetchPdfIdsBySubjects,
  fetchPdfIdsBySubjectsForChemistry,
  fetchPdfIdsBySubjectsForBiology,
};
