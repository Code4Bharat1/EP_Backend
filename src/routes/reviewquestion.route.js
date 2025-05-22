import express from 'express'
import reviewquestion, { getCombinedTestResults } from '../controller/reviewquestion.controller.js';

const router = express.Router();
router.post('/', reviewquestion);
router.post("/credits", getCombinedTestResults);


export default router;