import { Op } from "sequelize";
import { Question } from "../models/everytestmode.refrence.js";
import { Option } from "../models/everytestmode.refrence.js";
import { sequelizeCon } from "../init/dbConnection.js";

const getRandomQuestions = async (req, res) => {
  try {
    let { numberOfQuestions, excludeIds } = req.body;
    numberOfQuestions = parseInt(numberOfQuestions, 10);
    if (!Array.isArray(excludeIds)) excludeIds = [];

    const baseFilter = {};
    if (excludeIds.length) baseFilter.id = { [Op.notIn]: excludeIds };

    const filtered = await Question.findAll({
      where: baseFilter,
      order: sequelizeCon.random(),
      limit: numberOfQuestions,
      include: [{
        model: Option,
        as: 'options',
        attributes: ['id', 'question_id', 'option_text', 'is_correct']
      }]
    });

    const remaining = numberOfQuestions - filtered.length;
    let filler = [];
    if (remaining > 0) {
      const allExcluded = [...excludeIds, ...filtered.map((q) => q.id)];
      filler = await Question.findAll({
        where: {
          id: { [Op.notIn]: allExcluded },
        },
        order: sequelizeCon.random(),
        limit: remaining,
        include: [{
          model: Option,
          as: 'options',
          attributes: ['id', 'question_id', 'option_text', 'is_correct']
        }]
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