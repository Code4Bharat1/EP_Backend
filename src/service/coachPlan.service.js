// services/coachPlan.service.js
import StudentAnalytics from "../models/studentAnalytics.model.js";
import { buildCoachInput } from "./coachInput.js";
import { getGemini, parseJsonLoose } from "./geminiClient.js";

function fallbackPlan(input) {
  // Deterministic, safe plan if LLM fails
  const subjects = ["Physics", "Chemistry", "Biology"];
  const tasks = [];
  for (const fs of input.focus_suggestion.slice(0, 2)) {
    tasks.push({
      id: `remedial-${fs.subject.toLowerCase()}-01`,
      type: "remedial_quiz",
      subject: fs.subject,
      chapters: fs.chapters.map(ch => ch.name).slice(0, 2),
      attempts_required: 2,
      target_percent: 60,
      status: "pending",
    });
  }
  return {
    summary: {
      overall_last5: input.recent_windows.overall_last5 ?? null,
      subjects: subjects.map(s => ({
        name: s, score: input.subject_mastery?.[s]?.score ?? null,
        last5: input.recent_windows?.[`${s}_last5`] ?? null
      })),
      primary_weak_subjects: input.focus_suggestion.map(x => x.subject),
    },
    focus: input.focus_suggestion.map(x => ({
      subject: x.subject,
      chapters: x.chapters.map(ch => ({ name: ch.name, why: ch.why }))
    })),
    plan: {
      next_7_days: [
        { day: 1, blocks: [{ type: "learn", subject: tasks[0]?.subject ?? "Physics", chapter: tasks[0]?.chapters?.[0] ?? "Any", duration_min: 60 }]},
        { day: 2, blocks: [{ type: "quiz", questions: 30, subject: tasks[0]?.subject ?? "Physics", chapters: tasks[0]?.chapters ?? [], target_percent: 60 }]},
      ],
      test_readiness_rules: [
        { metric: "overall_last5", op: ">=", value: input.targets.overall },
        { metric: "Physics_last5", op: ">=", value: input.targets.subject },
        { metric: "Chemistry_last5", op: ">=", value: input.targets.subject },
        { metric: "Biology_last5", op: ">=", value: input.targets.subject }
      ],
    },
    tasks,
    tone_coach_notes: [
      "Short, daily reps beat long gaps.",
      "Focus accuracy first; speed comes next."
    ],
  };
}

export async function generateAndSaveCoachPlan(studentId) {
  const input = await buildCoachInput(studentId);
  const model = getGemini("gemini-1.5-flash");

  const system = `You are a NEET preparation coach. 
Return STRICT JSON only. No prose outside JSON.
Fields: summary, focus, plan, tasks, tone_coach_notes.
Keep items concrete (chapters), time-boxed, and aligned to targets:
overall ≥ ${input.targets.overall} and each subject ≥ ${input.targets.subject}.
`;

  const user = `COACH_INPUT:\n${JSON.stringify(input, null, 2)}\nReturn ONLY a JSON object.`;

  let planObj = null;
  try {
    const resp = await model.generateContent([{ text: system }, { text: user }]);
    const text = resp?.response?.text?.() ?? "";
    planObj = parseJsonLoose(text);
  } catch (e) {
    // ignore; will fallback
  }

  if (!planObj) planObj = fallbackPlan(input);

  // persist
  const [row] = await StudentAnalytics.findOrCreate({
    where: { student_id: studentId },
    defaults: {
      student_id: studentId,
      subject_mastery: {},
      chapter_mastery: {},
      topic_mastery: {},
      recent_windows: { overall_last5: null, Physics_last5: null, Chemistry_last5: null, Biology_last5: null },
      ai_plan: planObj,
    },
  });

  row.ai_plan = planObj;
  await row.save();
  return planObj;
}
