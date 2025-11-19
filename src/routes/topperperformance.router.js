import express from 'express';
import { getTestSummariesForAllStudents } from '../controller/topperperformance.controller.js';
import { getTestSummariesForAllStudents1 } from '../controller/topperperformancecustomize.controller.js';
import { verifyAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// GET /api/top-performers?mode=Practice or Customized
router.get("/topperformance", verifyAdmin,getTestSummariesForAllStudents);
router.get("/topperformancecustomize", verifyAdmin,getTestSummariesForAllStudents1)

export default router;
