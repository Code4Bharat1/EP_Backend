import Admintest from "../models/admintest.model.js";
import {Pdf, Question
} from "../models/everytestmode.refrence.js";


import { Op } from "../init/dbConnection.js"; // Ensure Op is imported
import { sequelizeCon } from "../init/dbConnection.js"; 
import { Sequelize } from "sequelize";


const createTest = async (req, res) => {
    try {
      const {
        addedByAdminId,
        testname,
        difficulty,
        subject,
        marks,
        positivemarks,
        negativemarks,
        unitName,
        topic_name,
        duration,
        exam_start_date,
        exam_end_date,
        instruction,
        batch_name,
        status,
      } = req.body;
  
      const newTest = await Admintest.create({
        addedByAdminId,
        testname,
        difficulty,
        subject,
        marks,
        positivemarks,
        negativemarks,
        unitName,
        topic_name,
        duration,
        exam_start_date,
        exam_end_date,
        instruction,
        batch_name,
        status,
      });
  
      res.status(201).json({
        success: true,
        message: "Test created successfully",
        test: newTest,
      });
  
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  const getChapters = async (req, res) => {
    try {
      const { subject } = req.query;
  
      if (!subject) {
        return res.status(400).json({ success: false, message: "Subject is required" });
      }
  
      // Ensure Pdf model is correctly initialized
      if (!Pdf || typeof Pdf.findAll !== "function") {
        throw new Error("Pdf model is not initialized correctly.");
      }
  
      const chapters = await Pdf.findAll({
        attributes: ["topic_tags"],
        where: {
          [Op.and]: [
            Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("subject")), "LIKE", subject.toLowerCase()),
          ],
        },
      });
  
      if (chapters.length === 0) {
        return res.status(404).json({ success: false, message: "No chapters found for the given subject" });
      }
  
      const topicTags = [...new Set(chapters.map((chapter) => chapter.topic_tags).filter(Boolean))];
  
      res.status(200).json({ success: true, subject, topicTags });
    } catch (error) {
      console.error("Error fetching chapters:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };


  const getQuestionsByTopic = async (req, res) => {
    try {
        const { topic, topic_tags, count } = req.query;

        // Allow either "topic" or "topic_tags"
        const selectedTopic = topic || topic_tags;
        const numQuestions = parseInt(count) || 4; // Default to 4 questions if not provided

        if (!selectedTopic) {
            return res.status(400).json({ success: false, message: "Topic is required" });
        }

        // Find PDFs that contain the topic
        const pdfs = await Pdf.findAll({
            attributes: ["id"],
            where: {
                topic_tags: { [Op.like]: `%${selectedTopic}%` },
            },
        });

        if (pdfs.length === 0) {
            return res.status(404).json({ success: false, message: "No questions found for the selected topic" });
        }

        // Extract PDF IDs
        const pdfIds = pdfs.map(pdf => pdf.id);

        // Fetch random questions related to these PDFs
        const questions = await Question.findAll({
            where: { pdf_id: { [Op.in]: pdfIds } },
            attributes: ["id", "question_text"],
            order: Sequelize.literal("RAND()"), // Fetch random questions
            limit: numQuestions // Fetch only 'count' number of questions
        });

        res.status(200).json({ success: true, topic: selectedTopic, questions });
    } catch (error) {
        console.error("Error fetching questions:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};



const getTestDetails = async (req, res) => {
  try {
      const { testId } = req.query;

      if (!testId) {
          return res.status(400).json({ success: false, message: "Test ID is required" });
      }

      // Fetch test details from Admintest table
      const test = await Admintest.findOne({
          where: { id: testId },
          attributes: [
              "id", "testname", "difficulty", "subject", "marks", 
              "positivemarks", "negativemarks", "duration",
              "exam_start_date", "exam_end_date", "instruction", "batch_name", "status"
          ]
      });

      if (!test) {
          return res.status(404).json({ success: false, message: "Test not found" });
      }

      // Fetch selected questions from TestQuestion table
      const selectedQuestions = await TestQuestion.findAll({
          where: { test_id: testId },
          include: [
              {
                  model: Question,
                  attributes: ["id", "question_text"]
              }
          ]
      });

      res.status(200).json({ success: true, test, selectedQuestions });
  } catch (error) {
      console.error("Error fetching test details:", error);
      res.status(500).json({ success: false, message: error.message });
  }
};



const createdTests = async (req, res)=> {

};
 



const getTestCountByAdmin = async (req, res) => {
  try {
    const adminId = req.adminId;

    if (!adminId) {
      return res.status(400).json({ success: false, message: "Admin ID is required" });
    }

    const currentDate = new Date(); // or use moment().toDate()

    // Count active (non-expired) tests
    const testCount = await Admintest.count({
      where: {
        addedByAdminId: adminId,
        exam_end_date: {
          [Op.gte]: currentDate
        }
      }
    });

    res.status(200).json({ success: true, testCount });
  } catch (error) {
    console.error("Error fetching test count:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export {createTest,getChapters,getQuestionsByTopic, getTestDetails,createdTests, getTestCountByAdmin};