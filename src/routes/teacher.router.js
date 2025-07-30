import express from 'express';
import { createTeacherQuestion } from "../controller/teacher.controller.js";
const router = express.Router();

// Define your teacher-related routes here
router.post('/question', createTeacherQuestion);

export default router;