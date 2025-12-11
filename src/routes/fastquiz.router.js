// import express from 'express'
// import getRandomQuestions from '../controller/fastQuizQuestion.controller.js'


// const router = express.Router();

// router.post('/questions', getRandomQuestions);

// export default router;



import express from "express";
import getRandomQuestions from "../controller/fastQuizQuestion.controller.js";


const router = express.Router();

// ✅ ✅ ✅ AUTH FIRST → CONTROLLER SECOND
router.post("/questions",  getRandomQuestions);

export default router;



