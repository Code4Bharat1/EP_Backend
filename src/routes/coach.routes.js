// routes/coach.routes.js
import { Router } from "express";
import { getCoachPlan, refreshCoachPlan, canStartTest } from "../controller/coach.controller.js";
const r = Router();

// GET /api/ai/coach/plan?studentId=154
r.get("/ai/coach/plan", getCoachPlan);

// POST /api/ai/coach/refresh  { studentId: 154 }
r.post("/ai/coach/refresh", refreshCoachPlan);

// GET /api/tests/can-start?studentId=154&type=full
r.get("/tests/can-start", canStartTest);

export default r;
