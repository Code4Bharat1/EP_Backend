import express from "express";
import { fetchQuestions } from "../controller/question.controller.js";

const router = express.Router();
router.get("/fetch-questions", fetchQuestions);
export default router;
