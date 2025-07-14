import { Pdf } from "../models/everytestmode.refrence.js"; // Adjust path as needed
import { Question } from "../models/everytestmode.refrence.js";
import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize'; // For advanced querying

function loadJsonData() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'neet_topics.json'); // adjust path as needed
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error("Error loading JSON file:", error.message);
    return null;
  }
}

// Helper function to get all topics for a subject
const getAllTopicsForSubject = (jsonData, subject) => {
  const chapters = jsonData[subject] ? Object.keys(jsonData[subject]) : [];
  const allTopics = [];

  chapters.forEach(chapterName => {
    const topicsArray = jsonData[subject][chapterName];
    
    if (Array.isArray(topicsArray)) {
      topicsArray.forEach(topic => {
        allTopics.push({
          chapter_name: chapterName,
          topic_name: topic.name,
          topic_id: topic.topic_id
        });
      });
    }
  });

  return allTopics;
};

// Generic function to fetch questions with pagination
const fetchQuestionsWithPagination = async (req, res, subject) => {
  try {
    const jsonData = loadJsonData();

    if (!jsonData) {
      return res.status(500).json({ error: "Failed to load JSON data." });
    }

    // Extract query parameters
    const {
      page = 1,
      limit = 10,
      chapter_name = null,
      topic_ids = null,
      question_count = null
    } = req.query;

    // Convert to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const questionCountNum = question_count ? parseInt(question_count) : null;

    // Calculate offset for pagination
    const offset = (pageNum - 1) * limitNum;

    // Get all topics for the subject
    const allTopics = getAllTopicsForSubject(jsonData, subject);

    if (allTopics.length === 0) {
      return res.status(404).json({ error: `No topics found for ${subject}.` });
    }

    // Filter topics based on query parameters
    let filteredTopics = allTopics;

    // Filter by chapter if provided
    if (chapter_name) {
      filteredTopics = allTopics.filter(topic => topic.chapter_name === chapter_name);
    }

    // Filter by specific topic IDs if provided
    if (topic_ids) {
      const topicIdArray = topic_ids.split(',').map(id => parseInt(id.trim()));
      filteredTopics = allTopics.filter(topic => topicIdArray.includes(topic.topic_id));
    }

    if (filteredTopics.length === 0) {
      return res.status(404).json({ error: "No topics found matching the criteria." });
    }

    // Extract topic_ids for querying questions
    const topicIds = filteredTopics.map(topic => topic.topic_id).filter(Boolean);

    // Build query options
    const queryOptions = {
      where: {
        pdf_id: topicIds,
      },
      attributes: ['id', 'pdf_id', 'question_text'],
      offset: offset,
      limit: questionCountNum || limitNum, // Use question_count if provided, otherwise use limit
      order: [['id', 'ASC']] // Consistent ordering
    };

    // Get total count for pagination info
    const totalCount = await Question.count({
      where: {
        pdf_id: topicIds,
      }
    });

    // Fetch questions with pagination
    const questions = await Question.findAll(queryOptions);

    if (questions.length === 0) {
      return res.status(404).json({ error: "No questions found for the selected criteria." });
    }

    // Map questions with topic details
    const questionsWithTopicDetails = questions.map((question) => {
      const topicInfo = filteredTopics.find((topic) => topic.topic_id === question.pdf_id);
      return {
        ...question.dataValues,
        chapter_name: topicInfo ? topicInfo.chapter_name : null,
        topic_name: topicInfo ? topicInfo.topic_name : null
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / (questionCountNum || limitNum));
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      questions: questionsWithTopicDetails,
      pagination: {
        current_page: pageNum,
        total_pages: totalPages,
        total_questions: totalCount,
        questions_per_page: questionCountNum || limitNum,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage,
        next_page: hasNextPage ? pageNum + 1 : null,
        prev_page: hasPrevPage ? pageNum - 1 : null
      },
      filter_info: {
        subject: subject,
        chapter_name: chapter_name,
        filtered_topics_count: filteredTopics.length,
        total_topics_count: allTopics.length
      }
    });

  } catch (error) {
    console.error(`Error fetching questions for ${subject}:`, error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Physics questions with pagination
const fetchPhysicsQuestions = async (req, res) => {
  return fetchQuestionsWithPagination(req, res, 'Physics');
};

// Chemistry questions with pagination
const fetchChemistryQuestions = async (req, res) => {
  return fetchQuestionsWithPagination(req, res, 'Chemistry');
};

// Biology questions with pagination
const fetchBiologyQuestions = async (req, res) => {
  return fetchQuestionsWithPagination(req, res, 'Biology');
};

// Get chapters and topics metadata (lightweight endpoint)
const getSubjectMetadata = async (req, res) => {
  try {
    const { subject } = req.params;
    const jsonData = loadJsonData();

    if (!jsonData) {
      return res.status(500).json({ error: "Failed to load JSON data." });
    }

    if (!jsonData[subject]) {
      return res.status(404).json({ error: `Subject ${subject} not found.` });
    }

    const chapters = jsonData[subject];
    const metadata = {
      subject: subject,
      chapters: Object.keys(chapters).map(chapterName => ({
        chapter_name: chapterName,
        topics: chapters[chapterName].map(topic => ({
          topic_name: topic.name,
          topic_id: topic.topic_id
        })),
        topics_count: chapters[chapterName].length
      })),
      total_chapters: Object.keys(chapters).length,
      total_topics: Object.values(chapters).flat().length
    };

    res.status(200).json(metadata);
  } catch (error) {
    console.error("Error fetching subject metadata:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get question count for specific filters (useful for frontend planning)
const getQuestionCount = async (req, res) => {
  try {
    const { subject } = req.params;
    const { chapter_name = null, topic_ids = null } = req.query;
    
    const jsonData = loadJsonData();

    if (!jsonData) {
      return res.status(500).json({ error: "Failed to load JSON data." });
    }

    const allTopics = getAllTopicsForSubject(jsonData, subject);
    let filteredTopics = allTopics;

    // Apply filters
    if (chapter_name) {
      filteredTopics = allTopics.filter(topic => topic.chapter_name === chapter_name);
    }

    if (topic_ids) {
      const topicIdArray = topic_ids.split(',').map(id => parseInt(id.trim()));
      filteredTopics = allTopics.filter(topic => topicIdArray.includes(topic.topic_id));
    }

    const topicIds = filteredTopics.map(topic => topic.topic_id).filter(Boolean);

    const totalCount = await Question.count({
      where: {
        pdf_id: topicIds,
      }
    });

    res.status(200).json({
      subject: subject,
      chapter_name: chapter_name,
      total_questions: totalCount,
      filtered_topics_count: filteredTopics.length
    });

  } catch (error) {
    console.error("Error getting question count:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export { 
  fetchPhysicsQuestions, 
  fetchChemistryQuestions, 
  fetchBiologyQuestions,
  getSubjectMetadata,
  getQuestionCount
};