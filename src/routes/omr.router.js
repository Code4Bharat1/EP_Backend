import express from 'express'
import { omrGeneratedAnswers } from '../controller/omr.controller.js';

const router = express.Router();

router.post("/omr-marks",omrGeneratedAnswers)

export default router;