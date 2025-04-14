import express from 'express';
import { getLoginAttendancePerformance } from '../controller/loginattendance.controller.js';

const router = express.Router();

router.get('/attendance', getLoginAttendancePerformance);  // Prefix your routes with `/api`

export default router;