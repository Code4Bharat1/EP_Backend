
import express from 'express'
import { getQuestionsBySubjectAndYear } from '../controller/verify-rough.js';

const router = express.Router();
router.post("/get-questions", getQuestionsBySubjectAndYear);

export default router;