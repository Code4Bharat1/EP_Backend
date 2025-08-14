// controllers/coach.controller.js
import StudentAnalytics from "../models/studentAnalytics.model.js";
import { buildCoachInput } from "../service/coachInput.js";
import { generateAndSaveCoachPlan } from "../service/coachPlan.service.js";
import { evaluateGate } from "../service/gating.js";
function resolveStudentId(req) {
  // Prefer auth middleware if you have one: req.user.id
  if (req.user?.id) return req.user.id;
  // fallback: query/body for Postman testing
  return Number(req.query.studentId ?? req.body.studentId);
}

export async function getCoachPlan(req, res) {
  try {
    const studentId = resolveStudentId(req);
    if (!studentId) return res.status(400).json({ error: "studentId required" });

    const row = await StudentAnalytics.findOne({ where: { student_id: studentId } });
    if (!row?.ai_plan) {
      const plan = await generateAndSaveCoachPlan(studentId);
      return res.json({ studentId, ai_plan: plan, generated: true });
    }
    return res.json({ studentId, ai_plan: row.ai_plan, generated: false });
  } catch (e) {
    return res.status(500).json({ error: "Failed to fetch plan", details: e.message });
  }
}

export async function refreshCoachPlan(req, res) {
  try {
    const studentId = resolveStudentId(req);
    if (!studentId) return res.status(400).json({ error: "studentId required" });
    const plan = await generateAndSaveCoachPlan(studentId);
    return res.json({ studentId, ai_plan: plan, generated: true });
  } catch (e) {
    return res.status(500).json({ error: "Failed to generate plan", details: e.message });
  }
}

export async function canStartTest(req, res) {
  try {
    const studentId = resolveStudentId(req);
    const type = String(req.query.type || "full");
    if (!studentId) return res.status(400).json({ error: "studentId required" });

    const input = await buildCoachInput(studentId);
    const gate = evaluateGate(input, input.targets);

    // if blocked, surface recommended tasks from ai_plan (if any)
    const row = await StudentAnalytics.findOne({ where: { student_id: studentId } });
    const tasks = row?.ai_plan?.tasks ?? [];

    return res.json({
      studentId,
      type,
      allowed: gate.allowed,
      reasons: gate.reasons,
      targets: gate.targets,
      recommended_tasks: gate.allowed ? [] : tasks
    });
  } catch (e) {
    return res.status(500).json({ error: "Failed to evaluate gate", details: e.message });
  }
}
