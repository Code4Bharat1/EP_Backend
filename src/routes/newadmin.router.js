

import express from 'express'
import { createAdmin, getUpcomingTestByBatch, createAdmintest,getTestbyAdminId, getStudentTestDetails, getBatchByStudentTest , getProfile, updateProfile, getTestData, saveGenerateTestResult, getTestDetailsById, getTestQuestionsWithAnswers, getTestSummariesForAllStudents, loginAdmin, updateTest, dashboardStudentData, getTestResults, dashboardDetails, getAdminColors,getAdminColorsByStudentId , getUserSubmittedTestsByEmail, deleteAdmintest} from '../controller/newadmin.controller.js';
import { verifyToken } from '../middleware/jwtDecoder.middleware.js';
import { studentAuth } from '../middleware/studentAuth.js';
import { deleteAdminById } from '../controller/superAdmin.controller.js';
const router = express.Router();

router.post("/signup", createAdmin);
router.post("/login", loginAdmin);
router.get("/student", getTestSummariesForAllStudents);
router.post("/admintest", createAdmintest);
router.post("/test-data", getStudentTestDetails);
router.post("/admin-tests", getTestbyAdminId);
router.post("/test-data-by-id", getTestDetailsById);
router.post("/get-questions", getTestQuestionsWithAnswers);
router.post("/save-test", saveGenerateTestResult);
router.post("/update-test", updateTest);
router.post("/student-data", dashboardStudentData);
router.post("/test-result", getTestResults);
router.get("/getProfile",verifyToken, getProfile);
router.put("/updateProfile",verifyToken, updateProfile);
router.get("/getTestData",verifyToken, getTestData);
router.post("/dashboard-details", dashboardDetails);
router.get("/upcomingtest-data", verifyToken, getUpcomingTestByBatch);
router.post("/colors", getAdminColors);
router.post("/studentcolors", getAdminColorsByStudentId);
router.get("/getStudentTestDetails", studentAuth , getBatchByStudentTest);
router.post("/getUserSubmittedTestsByEmail", getUserSubmittedTestsByEmail);

// delete test 
router.delete("/delete-admin-test" , deleteAdmintest)

export default router;