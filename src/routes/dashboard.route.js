import express from "express";
import {getpendingTest, getStudentName, getSubjectWiseAverageMarks, getSubjectWiseMarks, getVerifiedUser,getRecentTests,getTestAccuracy} from '../controller/dashboard.controller.js'
import { getTestStatistics } from "../controller/dashboard.controller.js";
import { verifyToken } from "../middleware/jwtDecoder.middleware.js";

const router = express.Router();

router.get("/name", getStudentName);// ye  rakhna h 

router.get('/testcount', getTestStatistics);// isko test count karna h  ismein dikhna chahiye total no of test taken by student ,test created by admins, user created tests.
router.get('/success', getSubjectWiseMarks);// Total tests milake ek subject mein kitne marks aaye uski accuracy 
router.get('/pending', verifyToken, getpendingTest);// 
router.get('/users', getVerifiedUser)
router.get("/average", getSubjectWiseAverageMarks);
router.get("/recent-tests", getRecentTests); // New route for recent tests
router.get("/accuracy", getTestAccuracy); // New route for test accuracy

export default router;
// total test count ,/ isko test count karna h  ismein dikhna chahiye total no of test taken by student ,test created by admins, user created tests.
// subject wise marks accuracy  overall accuracy in phy ,chem. and bio  overlall jitne bhi test diya h un sab ke marks milake ki accuracy batani h 
// score trend over the time period last suppose 6 tests to unka score mein kitna difference aaya h 
// Average time spent vs the accuracy per subject test 
// 