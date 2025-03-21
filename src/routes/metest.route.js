// routes/test.routes.js
import express from "express";
import {
  createMeTest,
  getAllMeTests,
  finalizeTest,
  getMeTestById,
  updateMeTest,
  deleteMeTest,
  getCreatedTests,
  getPastTests,
  getSubjectsAndChapters,
  fetchQuestions,
  getTestResult,
  submitTest,
  getCompletedTests
} from "../controller/metest.controller.js";
import { studentAuth } from "../middleware/studentAuth.js";

const router = express.Router();

// CREATE test
router.post("/createMeTest", studentAuth, createMeTest);

// READ all tests (optionally filter by ?status=saved)
router.get("/getAllMeTest", studentAuth, getAllMeTests);

// READ single test by ID
router.get("/getMeTestById/:id", studentAuth, getMeTestById);

// UPDATE test by ID
router.put("/updateMeTest/:id", studentAuth, updateMeTest);

// DELETE test by ID
router.delete("/deleteMeTest/:id", studentAuth, deleteMeTest);

// FINALIZE test (mark as attempted or completed) by ID
router.put("/finalizeTest/:id", studentAuth, finalizeTest);

// GET created tests (status: "saved")
router.get("/getCreatedTests", studentAuth, getCreatedTests);

// GET past tests (status: "attempted" or "completed")
router.get("/getPastTests", studentAuth, getPastTests);

// GET subjects and chapters
router.get("/subjects", getSubjectsAndChapters);

// FETCH questions for a specific test by test ID
router.get("/fetch-questions/:id", studentAuth, fetchQuestions);


// SUBMIT a test (mark as completed and calculate score)
router.post("/submitTest", studentAuth, submitTest);

// GET test result by test ID
router.get("/getTestResult/:testId", studentAuth, getTestResult);

// GET all completed tests for the current student
router.get("/getCompletedTests", studentAuth, getCompletedTests);


export default router;
