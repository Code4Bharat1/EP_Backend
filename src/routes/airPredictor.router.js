import express from 'express';
import { getAIRPrediction } from '../controller/airPredictor.controller.js';

const router = express.Router();

// Define POST route to handle AIR prediction
router.post('/predict', getAIRPrediction);  // Ensure the correct route is defined

export default router;
