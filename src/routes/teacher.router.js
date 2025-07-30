import express from 'express';
import { createTeacherQuestion } from "../controller/teacher.controller.js";
import { verifyToken } from '../middleware/jwtDecoder.middleware.js';
const router = express.Router();

// Define your teacher-related routes here
router.post('/question', verifyToken, createTeacherQuestion);

export default router;