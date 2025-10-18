import express from "express";
import { createSession, getSessions, getSessionById } from "../controller/sessionController.js";

const router = express.Router();

router.post("/", createSession);   // Add new session
router.get("/", getSessions);      // Get all sessions
router.get("/:id", getSessionById); // Get one session

export default router;
