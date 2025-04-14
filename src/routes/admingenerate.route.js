import express from 'express'
import { fetchPdfIdsBySubjects, fetchPdfIdsBySubjectsForBiology, fetchPdfIdsBySubjectsForChemistry } from '../controller/admingenerate.controller.js';

const router = express.Router();
router.get("/questions", fetchPdfIdsBySubjects);
router.get("/chemistry-questions", fetchPdfIdsBySubjectsForChemistry);
router.get("/biology-questions", fetchPdfIdsBySubjectsForBiology);

export default router;