// services/coachInput.js
import StudentAnalytics from "../models/studentAnalytics.model.js";

// safe JSON parse (handles DB JSON or longtext)
function parseField(v, fallback) {
  if (v == null) return fallback;
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

export async function buildCoachInput(studentId, targets = { overall: 45, subject: 50 }) {
  const row = await StudentAnalytics.findOne({ where: { student_id: studentId } });
  if (!row) {
    return {
      studentId,
      recent_windows: { overall_last5: null, Physics_last5: null, Chemistry_last5: null, Biology_last5: null },
      subject_mastery: {},
      chapter_mastery: {},
      targets,
    };
  }

  const subject_mastery = parseField(row.subject_mastery, {});
  const chapter_mastery = parseField(row.chapter_mastery, {});
  const recent_windows  = parseField(row.recent_windows, {
    overall_last5: null, Physics_last5: null, Chemistry_last5: null, Biology_last5: null
  });

  // derive “weak chapters” per subject (lowest score with attempts >= 2)
  const weak = [];
  for (const [subject, chapters] of Object.entries(chapter_mastery || {})) {
    for (const [chapter, v] of Object.entries(chapters || {})) {
      const score = Number(v?.score ?? 0);
      const attempts = Number(v?.attempts ?? 0);
      if (attempts >= 2) {
        weak.push({ subject, chapter, score, attempts });
      }
    }
  }
  weak.sort((a, b) => a.score - b.score); // lowest first

  // group top 2 per subject
  const focus = [];
  const bySubj = {};
  for (const item of weak) {
    bySubj[item.subject] ??= [];
    if (bySubj[item.subject].length < 2) bySubj[item.subject].push({
      name: item.chapter, why: "low score & sufficient attempts", score: item.score
    });
  }
  for (const [subject, chapters] of Object.entries(bySubj)) {
    focus.push({ subject, chapters });
  }

  return {
    studentId,
    recent_windows,
    subject_mastery,
    chapter_mastery,
    focus_suggestion: focus, // hint for the LLM
    targets,
  };
}
