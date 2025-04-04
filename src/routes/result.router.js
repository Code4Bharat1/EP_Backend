import express from "express";
import { fetchQuestions } from "../controller/createtest.controller.js";
import { submitTest } from "../controller/submitTest.controller.js"; // Separate controller

const router = express.Router();

// Route to fetch questions
router.post("/fetch-questions", fetchQuestions);

// Route to submit test answers
router.post("/submit-test", submitTest); // New route for submitting test

export default router;
