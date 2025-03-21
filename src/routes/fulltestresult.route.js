import express from "express";
import { submitTest, getResults, getReviewMistakes } from "../controller/fulltestresult.controller.js";
import { studentAuth } from "../middleware/studentAuth.js";

const router = express.Router();

// Submit Test API (Requires Authentication)
router.post("/submit", studentAuth, submitTest);

router.get("/results", studentAuth, getResults);

router.get("/review", studentAuth, getReviewMistakes);

export default router;
