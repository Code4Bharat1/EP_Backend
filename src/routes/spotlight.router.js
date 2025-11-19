import express from 'express';
import { getLastTestResultsPerformanceForAllStudents } from '../controller/spotlight.controller.js';
import { getLastTestResultsPerformanceForAllStudents1 } from '../controller/spotlightcustomize.controller.js';
import { verifyAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/newresult',verifyAdmin, getLastTestResultsPerformanceForAllStudents);  // Prefix your routes with `/api`
router.get('/customresult',verifyAdmin, getLastTestResultsPerformanceForAllStudents1);
export default router;