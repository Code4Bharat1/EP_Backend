import FastQuizQuestion from '../models/FastQuizQuestion.model.js';
import { sequelizeCon } from '../init/dbConnection.js';

const getRandomQuestions = async (req, res) => {
  try {
    let { numberOfQuestions } = req.body;

    numberOfQuestions = parseInt(numberOfQuestions, 10);
    if (isNaN(numberOfQuestions) || numberOfQuestions <= 0) {
      return res.status(400).json({ message: "Invalid number of questions requested" });
    }

    const totalQuestions = await FastQuizQuestion.count();

    if (totalQuestions === 0) {
      return res.status(404).json({ message: "No questions found in database" });
    }

    // Limit the number of questions to total available
    if (numberOfQuestions > totalQuestions) {
      numberOfQuestions = totalQuestions;
    }

    // Fetch random questions
    const questions = await FastQuizQuestion.findAll({
      order: sequelizeCon.random(),
      limit: numberOfQuestions,
    });

    return res.status(200).json({
      message: "Random questions retrieved successfully",
      questions,
    });

  } catch (error) {
    console.error("Error fetching random questions:", error.message);
    return res.status(500).json({ message: "Server error while retrieving questions" });
  }
};

export default getRandomQuestions;
