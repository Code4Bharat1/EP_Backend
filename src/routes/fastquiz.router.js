import express from 'express'
import getRandomQuestions from '../controller/fastQuizQuestion.controller.js'


const router = express.Router();

router.post('/questions', getRandomQuestions);

export default router;