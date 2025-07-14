import express from 'express';
import { 
  fetchPhysicsQuestions, 
  fetchChemistryQuestions, 
  fetchBiologyQuestions,
  getSubjectMetadata,
  getQuestionCount
} from '../controller/admingenerate.controller.js';

const router = express.Router();

// Paginated question endpoints
router.get('/physics/questions', fetchPhysicsQuestions);
router.get('/chemistry/questions', fetchChemistryQuestions);
router.get('/biology/questions', fetchBiologyQuestions);

// Metadata endpoints (lightweight)
router.get('/:subject/metadata', getSubjectMetadata);
router.get('/:subject/question-count', getQuestionCount);

export default router;