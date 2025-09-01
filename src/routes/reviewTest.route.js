import express from "express";
import { studentAuth } from "../middleware/studentAuth.js";
import { allTestReviewByTestType, getUserTestAnalytics } from "../controller/testresult.controller.js";
const route = express();

route.get("/alltest/:testType/:testId", allTestReviewByTestType);
route.get("/analytics", studentAuth, getUserTestAnalytics);

export default route;