import express from 'express'
import { getChapterNames, getQuestionCountBySubject, getTopicsById } from '../controller/topicwise.controller.js';

const router = express.Router();


router.post("/topic-name",getTopicsById);
router.post("/chapter-name", getChapterNames);
router.post("/question-count", getQuestionCountBySubject);

export default router;