import express from 'express';
import { createTeacherQuestion , getChapterData} from "../controller/teacher.controller.js";
import { verifyToken } from '../middleware/jwtDecoder.middleware.js';
const router = express.Router();

// Define your teacher-related routes here
router.post('/question', verifyToken, createTeacherQuestion);
router.get("/chapterData" , getChapterData)

export default router;