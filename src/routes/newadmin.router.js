import express from 'express'
import { createAdmin, createAdmintest, getAllTestDetails, saveGenerateTestResult, getTestDetailsById, getTestQuestionsWithAnswers, getTestSummariesForAllStudents, loginAdmin, updateTest, dashboardStudentData, getTestResults, getProfile } from '../controller/newadmin.controller.js';
import { verifyToken } from '../middleware/jwtDecoder.middleware.js';


const router = express.Router();

router.post("/signup", createAdmin);
router.post("/login", loginAdmin);
router.get("/student", getTestSummariesForAllStudents);
router.post("/admintest", createAdmintest);
router.get("/test-data", getAllTestDetails);
router.post("/test-data-by-id", getTestDetailsById);
router.post("/get-questions", getTestQuestionsWithAnswers);
router.post("/save-test", saveGenerateTestResult);
router.post("/update-test", updateTest);
router.post("/student-data", dashboardStudentData);
router.post("/test-result", getTestResults);
router.get("/getProfile",verifyToken, getProfile);

export default router;