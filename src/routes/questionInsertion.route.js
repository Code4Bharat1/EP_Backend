import express from 'express'
import { createPdfEntry, createQuestionWithDetails } from '../controller/questionInsertions.controller.js';

const router = express.Router();

router.post("/chatper-wise-question", createQuestionWithDetails);
router.post("/pdfid", createPdfEntry)


export default router;