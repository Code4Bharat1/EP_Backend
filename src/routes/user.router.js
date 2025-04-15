import express from 'express';
import { getAttendanceForAllStudents } from '../controller/attendance.controller.js';

const router = express.Router();

// GET /api/top-performers?mode=Practice or Customized
router.post("/test" ,getAttendanceForAllStudents)
export default router;
