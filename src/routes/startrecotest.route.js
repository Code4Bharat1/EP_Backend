import express from "express";
import {
  startrecotest,
  getrcoequestions,
  submitrecotest,
  getTestResult
} from "../controller/startrecotest.controller.js";
import { studentAuth } from "../middleware/studentAuth.js";
const router = express.Router();

router.get("/start-test", startrecotest);

router.post("/get-questions",getrcoequestions);

router.post("/submit", studentAuth, submitrecotest);

router.get("/getTestResult/:testId", getTestResult);

export default router;