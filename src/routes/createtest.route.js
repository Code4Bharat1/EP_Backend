import express from "express";
import { fetchQuestions } from "../controller/createtest.controller.js";

const router = express.Router();
router.post("/fetch-questions", fetchQuestions);

export default router;
