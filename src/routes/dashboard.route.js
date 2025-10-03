import express from "express";
import {getpendingTest, getStudentName, getSubjectWiseAverageMarks, getSubjectWiseMarks, getVerifiedUser} from '../controller/dashboard.controller.js'
import { getTestStatistics } from "../controller/dashboard.controller.js";
import { verifyToken } from "../middleware/jwtDecoder.middleware.js";
import { getPendingTests } from "../controller/dashboard.controller.js";
const router = express.Router();

router.get("/name", getStudentName);
router.get('/success', getSubjectWiseMarks);
router.get('/pending', verifyToken, getpendingTest);
router.get('/users', getVerifiedUser)
router.get("/average", getSubjectWiseAverageMarks);


router.get('/testcount', getTestStatistics);
router.get("/:studentId/pending-tests" , getPendingTests)

export default router;