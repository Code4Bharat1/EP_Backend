

import express from 'express'
import { createAdmin, createAdmintest, getStudentTestDetails, getProfile, updateProfile, getTestData, saveGenerateTestResult, getTestDetailsById, getTestQuestionsWithAnswers, getTestSummariesForAllStudents, loginAdmin, updateTest, dashboardStudentData, getTestResults } from '../controller/newadmin.controller.js';
import { verifyToken } from '../middleware/jwtDecoder.middleware.js';
const router = express.Router();

router.post("/signup", createAdmin);
router.post("/login", loginAdmin);
router.get("/student", getTestSummariesForAllStudents);
router.post("/admintest", createAdmintest);
router.post("/test-data", getStudentTestDetails);
router.post("/test-data-by-id", getTestDetailsById);
router.post("/get-questions", getTestQuestionsWithAnswers);
router.post("/save-test", saveGenerateTestResult);
router.post("/update-test", updateTest);
router.post("/student-data", dashboardStudentData);
router.post("/test-result", getTestResults);
router.get("/getProfile",verifyToken, getProfile);
router.put("/updateProfile",verifyToken, updateProfile);
router.get("/getTestData",verifyToken, getTestData);

export default router;