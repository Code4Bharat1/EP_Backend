import express from "express";
import { studentAuth } from "../middleware/studentAuth.js";
import {
  getSubjectsAndChapters,
  saveSelectedChapters,
  getSelectedChapters,
  fetchQuestions,
  submitTest,
} from "../controller/test.controller.js";

const router = express.Router();

router.get("/subjects", getSubjectsAndChapters);
router.post("/save-selected-chapters", studentAuth, saveSelectedChapters);
router.get("/selected-chapters", studentAuth, getSelectedChapters);
router.get("/fetch-questions", studentAuth, fetchQuestions);
router.post("/submit", studentAuth, submitTest);

export default router;
