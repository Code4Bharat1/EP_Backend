import express from 'express';
import { getInactiveStudents } from '../controller/studentlogout.controller.js';
import { verifyAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Route to get the list of students who have not logged in for 7 days
router.get("/studentslogged",verifyAdmin, getInactiveStudents);

export default router;
