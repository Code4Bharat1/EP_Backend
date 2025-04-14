import express from 'express'
import { createAdmin, createAdmintest, getAllTestDetails, getTestDetailsById, getTestQuestionsWithAnswers, getTestSummariesForAllStudents, loginAdmin } from '../controller/newadmin.controller.js';

const router = express.Router();

router.post("/signup", createAdmin);
router.post("/login", loginAdmin);
router.get("/student", getTestSummariesForAllStudents);
router.post("/admintest", createAdmintest);
router.get("/test-data", getAllTestDetails);
router.post("/test-data-by-id", getTestDetailsById);
router.post("/get-questions", getTestQuestionsWithAnswers)

export default router;