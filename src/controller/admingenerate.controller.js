import { Pdf } from "../models/everytestmode.refrence.js"; // Adjust path as needed
import { Question } from "../models/everytestmode.refrence.js";

//Create different controller for different subject as it was unable to fetch the chapter names and question efficiently...

const fetchPdfIdsBySubjects = async (req, res) => {
  try {
    // Load JSON data instead of querying PDF table
    const jsonData = loadJsonData();

    if (!jsonData) {
      return res.status(500).json({ error: "Failed to load JSON data." });
    }

    // Set subject to "Physics"
    const selectedSubjects = ["Physics"];

    if (!selectedSubjects || selectedSubjects.length === 0) {
      return res.status(400).json({ error: "Please provide subject names." });
    }

    // Extract Physics chapters from JSON data
    const physicsChapters = jsonData.Physics ? Object.keys(jsonData.Physics) : [];
    //console.log("Chapter Names:", physicsChapters);

    if (physicsChapters.length === 0) {
      return res.status(404).json({ error: "No Physics chapters found in JSON data." });
    }

    const firstChapterName = physicsChapters[0];
    const firstChapterTopics = jsonData.Physics[firstChapterName];

    //console.log("First Chapter Name:", firstChapterName);
    //console.log("First Chapter Topics:", firstChapterTopics);

    // Extract all topics from all chapters with their details
    const allTopics = [];

    physicsChapters.forEach(chapterName => {
      const topicsArray = jsonData.Physics[chapterName]; // This is the array of topics

      if (Array.isArray(topicsArray)) {
        topicsArray.forEach(topic => {
          allTopics.push({
            chapter_name: chapterName,   // ✅ Use current chapter name
            topic_name: topic.name,
            topic_id: topic.topic_id
          });
        });
      }
    });

    if (allTopics.length === 0) {
      return res.status(404).json({ error: "No topics found in Physics chapters." });
    }

    // Extract topic_ids for querying questions
    const topicIds = allTopics.map(topic => topic.topic_id).filter(Boolean);

    // Log the topics with their details
    //console.log("Physics Topics:", allTopics);

    // Fetch corresponding questions from the Question table
    const questions = await Question.findAll({
      where: {
        pdf_id: topicIds,
      },
      attributes: ['id', 'pdf_id', 'question_text'],
    });

    if (questions.length === 0) {
      return res.status(404).json({ error: "No questions found for the selected topics." });
    }

    // Return the questions along with chapter and topic information
    const questionsWithTopicDetails = questions.map((question) => {
      const topicInfo = allTopics.find((topic) => topic.topic_id === question.pdf_id);
      return {
        ...question.dataValues,
        chapter_name: topicInfo ? topicInfo.chapter_name : null,
        topic_name: topicInfo ? topicInfo.topic_name : null
      };
    });

    res.status(200).json({
      questions: questionsWithTopicDetails,
      total_topics: allTopics,
      total_topics_length: allTopics.length,
      total_questions: questions.length
    });
  } catch (error) {
    console.error("Error fetching PDFs and questions for Physics:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//Questions to fetch from chemistry section
const fetchPdfIdsBySubjectsForChemistry = async (req, res) => {
  try {
    // Load JSON data instead of querying PDF table
    const jsonData = loadJsonData();

    if (!jsonData) {
      return res.status(500).json({ error: "Failed to load JSON data." });
    }

    // Set subject to "Chemistry" for now
    const selectedSubjects = ["Chemistry"];

    if (!selectedSubjects || selectedSubjects.length === 0) {
      return res.status(400).json({ error: "Please provide subject names." });
    }

    // Extract Chemistry chapters from JSON data
    const chemistryChapters = jsonData.Chemistry ? Object.keys(jsonData.Chemistry) : [];
    //console.log("chapter name : ", chemistryChapters)
    if (chemistryChapters.length === 0) {
      return res.status(404).json({ error: "No Chemistry chapters found in JSON data." });
    }

    const firstChapterName = chemistryChapters[0];
    const firstChapterTopics = jsonData.Chemistry[firstChapterName];

    //console.log("First Chapter Name:", firstChapterName);
    //console.log("First Chapter Topics:", firstChapterTopics);

    // Extract all topics from all chapters with their details
    const allTopics = [];

    chemistryChapters.forEach(chapterName => {
      const topicsArray = jsonData.Chemistry[chapterName]; // This is the array of topics

      if (Array.isArray(topicsArray)) {
        topicsArray.forEach(topic => {
          allTopics.push({
            chapter_name: chapterName,   // ✅ Use current chapter name
            topic_name: topic.name,
            topic_id: topic.topic_id
          });
        });
      }

    });



    if (allTopics.length === 0) {
      return res.status(404).json({ error: "No topics found in Chemistry chapters." });
    }

    // Extract topic tags for querying questions
    const topicTags = allTopics.map(topic => topic.topic_id).filter(Boolean);

    // Log the topics with their details
    //console.log("Chemistry Topics:", allTopics);

    // Step 2: Use the topic_tags to fetch corresponding questions from the Question table
    const questions = await Question.findAll({
      where: {
        pdf_id: topicTags, // Match topic_tag in the Question table
      },
      attributes: ['id', 'pdf_id', 'question_text'], // Fetch question id, text, and associated topic_tag
    });

    if (questions.length === 0) {
      return res.status(404).json({ error: "No questions found for the selected topics." });
    }

    // Return the questions along with the chapter and topic information
    const questionsWithTopicDetails = questions.map((question) => {
      const topicInfo = allTopics.find((topic) => topic.topic_id === question.pdf_id);
      return {
        ...question.dataValues,
        chapter_name: topicInfo ? topicInfo.chapter_name : null,
        topic_name: topicInfo ? topicInfo.topic_name : null
      };
    });

    res.status(200).json({

      questions: questionsWithTopicDetails,
      total_topics: allTopics,
      total_topics_length: allTopics.length,
      total_questions: questions.length
    });
    console.log(chaptersList)
  } catch (error) {
    console.error("Error fetching PDFs and questions for Chemistry:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const fetchPdfIdsBySubjectsForBiology = async (req, res) => {
  try {
    // Load JSON data instead of querying PDF table
    const jsonData = loadJsonData();

    if (!jsonData) {
      return res.status(500).json({ error: "Failed to load JSON data." });
    }

    // Set subject to "Biology"
    const selectedSubjects = ["Biology"]; 

    if (!selectedSubjects || selectedSubjects.length === 0) {
      return res.status(400).json({ error: "Please provide subject names." });
    }

    // Extract Biology chapters from JSON data
    const biologyChapters = jsonData.Biology ? Object.keys(jsonData.Biology) : [];
    //console.log("Chapter Names:", biologyChapters);

    if (biologyChapters.length === 0) {
      return res.status(404).json({ error: "No Biology chapters found in JSON data." });
    }

    const firstChapterName = biologyChapters[0];
    const firstChapterTopics = jsonData.Biology[firstChapterName];

    //console.log("First Chapter Name:", firstChapterName);
    //console.log("First Chapter Topics:", firstChapterTopics);

    // Extract all topics from all chapters with their details
    const allTopics = [];

    biologyChapters.forEach(chapterName => {
      const topicsArray = jsonData.Biology[chapterName]; // This is the array of topics

      if (Array.isArray(topicsArray)) {
        topicsArray.forEach(topic => {
          allTopics.push({
            chapter_name: chapterName,   // ✅ Use current chapter name
            topic_name: topic.name,
            topic_id: topic.topic_id
          });
        });
      }
    });

    if (allTopics.length === 0) {
      return res.status(404).json({ error: "No topics found in Biology chapters." });
    }

    // Extract topic_ids for querying questions
    const topicIds = allTopics.map(topic => topic.topic_id).filter(Boolean);

    // Log the topics with their details
    //console.log("Biology Topics:", allTopics);

    // Fetch corresponding questions from the Question table
    const questions = await Question.findAll({
      where: {
        pdf_id: topicIds,
      },
      attributes: ['id', 'pdf_id', 'question_text'],
    });

    if (questions.length === 0) {
      return res.status(404).json({ error: "No questions found for the selected topics." });
    }

    // Return the questions along with chapter and topic information
    const questionsWithTopicDetails = questions.map((question) => {
      const topicInfo = allTopics.find((topic) => topic.topic_id === question.pdf_id);
      return {
        ...question.dataValues,
        chapter_name: topicInfo ? topicInfo.chapter_name : null,
        topic_name: topicInfo ? topicInfo.topic_name : null
      };
    });

    res.status(200).json({
      questions: questionsWithTopicDetails,
      total_topics: allTopics,
      total_topics_length: allTopics.length,
      total_questions: questions.length
    });
  } catch (error) {
    console.error("Error fetching PDFs and questions for Biology:", error.message, error.stack);
    console.error("Error fetching PDFs and questions for Biology:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export { fetchPdfIdsBySubjects , fetchPdfIdsBySubjectsForChemistry, fetchPdfIdsBySubjectsForBiology};