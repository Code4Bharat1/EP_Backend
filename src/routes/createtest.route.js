import express from "express";
import { fetchQuestions, submitTest, getSolutions, viewAnalytics } from "../controller/createtest.controller.js";

const router = express.Router();
router.post("/fetch-questions", fetchQuestions);
router.post("/submit-test", submitTest);
router.post("/getsolutions", getSolutions);
router.get("/viewanalytics", viewAnalytics);

export default router;
