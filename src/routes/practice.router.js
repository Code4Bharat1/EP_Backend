import express from 'express';
import { getHighestTestResultsForAllStudents } from '../controller/practice.controller.js';

const router = express.Router();

router.get('/practice', getHighestTestResultsForAllStudents );  // Prefix your routes with `/api`

export default router;