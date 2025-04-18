import express from "express";
import {getpendingTest, getStudentName, getSubjectWiseAverageMarks, getSubjectWiseMarks, getVerifiedUser} from '../controller/dashboard.controller.js'
import { getTestStatistics } from "../controller/dashboard.controller.js";

const router = express.Router();

router.get("/name", getStudentName);
router.get('/testcount', getTestStatistics);
router.get('/success', getSubjectWiseMarks);
router.get('/pending', getpendingTest);
router.get('/users', getVerifiedUser)
router.get("/average", getSubjectWiseAverageMarks);

export default router;