import express from 'express';
import { getInactiveStudents } from '../controller/studentlogout.controller.js';

const router = express.Router();

// Route to get the list of students who have not logged in for 7 days
router.get("/studentslogged", getInactiveStudents);

export default router;
