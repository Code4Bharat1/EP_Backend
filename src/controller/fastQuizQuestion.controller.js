import { Op } from "sequelize";
import { Question } from "../models/everytestmode.refrence.js";
import { sequelizeCon } from "../init/dbConnection.js";

// getRandomQuestions controller
const getRandomQuestions = async (req, res) => {
  try {
    let { numberOfQuestions, difficulty, excludeIds } = req.body;
    numberOfQuestions = parseInt(numberOfQuestions, 10);
    if (!Array.isArray(excludeIds)) excludeIds = [];

    const usedIds = new Set(excludeIds);
    const baseFilter = {};
    if (difficulty) baseFilter.difficulty_level = difficulty.toLowerCase();
    if (excludeIds.length) baseFilter.id = { [Op.notIn]: excludeIds };

    // First: get filtered (e.g., hard) questions
    const filtered = await Question.findAll({
      where: baseFilter,
      order: sequelizeCon.random(),
      limit: numberOfQuestions,
    });

    const remaining = numberOfQuestions - filtered.length;

    // If needed: fill with random (non-difficulty-filtered) questions
    let filler = [];
    if (remaining > 0) {
      const allExcluded = [...excludeIds, ...filtered.map((q) => q.id)];

      filler = await Question.findAll({
        where: {
          id: { [Op.notIn]: allExcluded },
        },
        order: sequelizeCon.random(),
        limit: remaining,
      });
    }

    const finalSet = [...filtered, ...filler];
    return res.status(200).json({
      totalRequested: numberOfQuestions,
      returned: finalSet.length,
      filteredMatch: filtered.length,
      questions: finalSet,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};


export default getRandomQuestions;
