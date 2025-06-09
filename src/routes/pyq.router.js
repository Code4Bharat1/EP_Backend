import express from 'express'
import { createPreviousYearQuestion, getDistinctYears, getQuestionsByYear } from '../controller/pyq.controller.js';

const router = express.Router();

router.post("/create-questions", createPreviousYearQuestion);
router.get("/years", getDistinctYears);
router.post('/pyq-questions', getQuestionsByYear);


export default router;