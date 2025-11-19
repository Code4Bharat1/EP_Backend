import express from 'express';
import { getLastTestResultsForAllStudents } from '../controller/testresult.controller.js';
import { getLastTestResultsForAllStudents1 } from '../controller/testresultcustomize.controller.js';
import { verifyAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/result',verifyAdmin, getLastTestResultsForAllStudents);  // Prefix your routes with `/api`
router.get('/customizedresult',verifyAdmin ,getLastTestResultsForAllStudents1)
export default router;