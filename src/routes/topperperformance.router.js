import express from 'express';
import { getTestSummariesForAllStudents } from '../controller/topperperformance.controller.js';
import { getTestSummariesForAllStudents1 } from '../controller/topperperformancecustomize.controller.js';

const router = express.Router();

// GET /api/top-performers?mode=Practice or Customized
router.get("/topperformance", getTestSummariesForAllStudents);
router.get("/topperformancecustomize" ,getTestSummariesForAllStudents1)

export default router;
