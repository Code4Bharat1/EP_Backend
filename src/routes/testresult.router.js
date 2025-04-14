import express from 'express';
import { getLastTestResultsForAllStudents } from '../controller/testresult.controller.js';
import { getLastTestResultsForAllStudents1 } from '../controller/testresultcustomize.controller.js';

const router = express.Router();

router.get('/result', getLastTestResultsForAllStudents);  // Prefix your routes with `/api`
router.get('/customizedresult' ,getLastTestResultsForAllStudents1)
export default router;