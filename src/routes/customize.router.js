import express from 'express';
import { getTestCustomizeSummariesForAllStudents } from '../controller/customize.controller.js';  // Corrected import path

const router = express.Router();

// Define the route to handle GET requests at '/customize'
router.get('/customize', getTestCustomizeSummariesForAllStudents);

export default router;
