import express from 'express';
import { getHighestTestResultsForAdminStudents } from '../controller/practice.controller.js';
import { verifyToken } from '../middleware/jwtDecoder.middleware.js';
const router = express.Router();

router.get('/practice' , verifyToken , getHighestTestResultsForAdminStudents );  // Prefix your routes with `/api`

export default router;