import { Op } from "sequelize";
import { Pdf, Topic, Question, Option, Diagram, Solution } from "../models/everytestmode.refrence.js";
// import { SelectedChapters } from "../models/selected.Chapters.js";
import SavedTest from "../models/saved.js";

/**
 * GET /api/test/subjects
 * Returns an array of { subject_name, chapters: [] }
 */
export const getSubjectsAndChapters = async (req, res) => {
  try {
    const subjects = await Pdf.findAll({
      attributes: ["subject"],
      group: ["subject"],
    });
    if (!subjects || subjects.length === 0) {
      return res.status(404).json({ message: "No subjects found in Pdf table." });
    }

    const subjectsData = [];
    for (const item of subjects) {
      const subjectName = item.subject;
      const chapters = await Topic.findAll({
        where: { subject: subjectName },
        attributes: ["id", "topic_name"],
      });
      subjectsData.push({
        subject_name: subjectName,
        chapters: chapters.map((c) => c.topic_name),
      });
    }

    return res.json(subjectsData);
  } catch (error) {
    console.error("Error fetching subjects/chapters:", error);
    return res.status(500).json({ message: "Server error fetching subjects." });
  }
};

/**
 * POST /api/test/save-selected-chapters
 * Expects { selectedChapters: { Physics: [..], ... }, difficultyLevel: "Medium" }
 */
export const saveSelectedChapters = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.studentId;
    if (!studentId) {
      return res.status(401).json({ message: "No student ID found in token." });
    }

    const { selectedChapters, difficultyLevel } = req.body;
    if (!selectedChapters || !difficultyLevel) {
      return res
        .status(400)
        .json({ message: "selectedChapters and difficultyLevel are required." });
    }

    // Upsert (create or update) for this student
    const [record, created] = await SelectedChapters.upsert({
      studentId,
      selectedChapters, // Must be an OBJECT in the DB
      difficultyLevel,
    });

    return res.status(200).json({
      message: created ? "Chapters saved successfully" : "Chapters updated successfully",
      data: record,
    });
  } catch (error) {
    console.error("Error saving chapters:", error);
    return res.status(500).json({ message: "Server error saving chapters." });
  }
};

/**
 * GET /api/test/selected-chapters
 * Returns { studentId, selectedChapters, difficultyLevel }
 */
export const getSelectedChapters = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.studentId;
    if (!studentId) {
      return res.status(401).json({ message: "No student ID found in token." });
    }

    const record = await SelectedChapters.findOne({ where: { studentId } });
    if (!record) {
      return res.status(404).json({ message: "No selected chapters found." });
    }

    return res.json({
      studentId: record.studentId,
      selectedChapters: record.selectedChapters, // Should be an object
      difficultyLevel: record.difficultyLevel,
    });
  } catch (error) {
    console.error("Error getting selected chapters:", error);
    return res.status(500).json({ message: "Server error getting chapters." });
  }
};

/**
 * GET /api/test/fetch-questions
 * Uses the stored selectedChapters + difficultyLevel to fetch relevant questions.
 */
export const fetchQuestions = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.studentId;
    if (!studentId) {
      return res.status(401).json({ message: "No student ID found in token." });
    }

    const record = await SelectedChapters.findOne({ where: { studentId } });
    if (!record) {
      return res.status(404).json({ message: "No selections found for this user." });
    }
    const { selectedChapters, difficultyLevel } = record;
    if (!selectedChapters || Object.keys(selectedChapters).length === 0) {
      return res.status(400).json({ message: "No chapters selected." });
    }

    let allQuestions = [];

    // For each subject => chapter array
    for (const subjectName of Object.keys(selectedChapters)) {
      const chapterNames = selectedChapters[subjectName];

      const topicRecords = await Topic.findAll({
        where: {
          subject: subjectName,
          topic_name: { [Op.in]: chapterNames },
        },
        attributes: ["id"],
      });
      const topicIds = topicRecords.map((t) => t.id);

      if (topicIds.length === 0) continue;

      const questions = await Question.findAll({
        where: {
          subject: subjectName,
          // if you had a difficulty_level column in Question table:
          // difficulty_level: difficultyLevel,
          topic_id: { [Op.in]: topicIds },
        },
        include: [
          { model: Option, as: "options" },
          { model: Solution, required: false },
          { model: Diagram, required: false },
        ],
      });

      const formatted = questions.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        subject: q.subject,
        topic_id: q.topic_id,
        // difficulty_level: q.difficulty_level,
        options: q.options?.map((opt) => opt.get({ plain: true })) || [],
        solutions: q.Solutions?.map((sol) => sol.get({ plain: true })) || [],
        diagrams: q.Diagrams?.map((dia) => dia.get({ plain: true })) || [],
      }));

      allQuestions.push(...formatted);
    }

    if (allQuestions.length === 0) {
      return res.status(404).json({ message: "No questions found for the selected filters." });
    }

    return res.status(200).json(allQuestions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return res.status(500).json({ message: "Error fetching questions." });
  }
};

/**
 * POST /api/test/submit
 * Expects { answers: [...], testName: "My Test" }
 */
export const submitTest = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.studentId;
    if (!studentId) {
      return res.status(401).json({ message: "No student ID found in token." });
    }

    const { answers, testName } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Answers array is required." });
    }

    const record = await SelectedChapters.findOne({ where: { studentId } });
    if (!record) {
      return res.status(400).json({ message: "No test selection found for submission." });
    }

    const saved = await SavedTest.create({
      studentId,
      selectedChapters: record.selectedChapters, // object
      difficultyLevel: record.difficultyLevel,
      testName: testName || "Untitled Test",
      status: "attempted",
      // Possibly store answers if needed
    });

    return res.status(200).json({
      message: "Test submitted successfully",
      data: saved,
    });
  } catch (error) {
    console.error("Error submitting test:", error);
    return res.status(500).json({ message: "Error submitting test." });
  }
};
