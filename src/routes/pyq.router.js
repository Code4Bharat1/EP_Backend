import express from 'express'
import { createPreviousYearQuestion } from '../controller/pyq.controller.js';

const router = express.Router();

router.post("/create-questions", createPreviousYearQuestion);


export default router;