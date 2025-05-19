import express from 'express'
import reviewquestion from '../controller/reviewquestion.controller.js';

const router = express.Router();
router.post('/', reviewquestion);


export default router;