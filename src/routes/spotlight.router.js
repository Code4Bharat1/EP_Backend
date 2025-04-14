import express from 'express';
import { getLastTestResultsPerformanceForAllStudents } from '../controller/spotlight.controller.js';
import { getLastTestResultsPerformanceForAllStudents1 } from '../controller/spotlightcustomize.controller.js';
const router = express.Router();

router.get('/newresult', getLastTestResultsPerformanceForAllStudents);  // Prefix your routes with `/api`
router.get('/customresult', getLastTestResultsPerformanceForAllStudents1);
export default router;