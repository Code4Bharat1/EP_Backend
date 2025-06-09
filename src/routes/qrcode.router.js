import express from 'express'
import { getQuestionCountByTestId, getStudentsByBatchName, verifyStudentIdsForAdmin } from '../controller/qrocode.controller.js';

const router = express.Router();

router.post("/students", getStudentsByBatchName)
router.post("/verify-students", verifyStudentIdsForAdmin);
router.post("/question-count", getQuestionCountByTestId);

export default router;