import express from 'express';
import { getTestCustomizeSummariesForAllStudents } from '../controller/customize.controller.js';  // Corrected import path
import { verifyToken } from '../middleware/jwtDecoder.middleware.js';
const router = express.Router();

// Define the route to handle GET requests at '/customize'
router.get('/customize' , verifyToken , getTestCustomizeSummariesForAllStudents);

export default router;
