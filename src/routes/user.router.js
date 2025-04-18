import express from 'express';
import { getAttendanceForAllStudents } from '../controller/attendance.controller.js';
import { getLastTestResultsForAllStudents } from '../controller/recent.controller.js';

const router = express.Router();

// GET /api/top-performers?mode=Practice or Customized
router.post("/test" ,getAttendanceForAllStudents)
router.post("/recent", getLastTestResultsForAllStudents)

export default router;
