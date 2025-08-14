// services/analyticsAggregator.js
import StudentAnalytics from "../models/studentAnalytics.model.js";

// Result/test models
import FullTestResults from "../models/fullTestResults.model.js";
import Admintest from "../models/admintest.model.js";
import GenerateTestResult from "../models/generateTestresult.model.js";
import TestSeriesResult from "../models/TestSeriesResult.js";
import TestSeriesTest from "../models/TestSeriesTest.model.js";

import { BASE_ALPHA, TYPE_WEIGHTS, applyEMA, ensureNode } from "./ema.js";

/* ---------------------------
   Helpers
----------------------------*/

// Normalize subject strings to clean keys
function normSubject(s) {
  if (!s) return null;
  const v = String(s).trim().toLowerCase();
  if (!v) return null;
  if (v.startsWith("phy"))  return "Physics";
  if (v.startsWith("chem")) return "Chemistry";
  if (v.startsWith("bio"))  return "Biology";
  // fallback: Title Case
  return String(s).trim().replace(/\b\w/g, ch => ch.toUpperCase());
}

// Parse values that may be JSON or double-encoded JSON
function parseJsonFieldDeep(v, fallback = {}) {
  if (v == null) return fallback;
  let out = v;
  for (let i = 0; i < 2 && typeof out === "string"; i++) {
    try { out = JSON.parse(out); } catch { return fallback; }
  }
  return out ?? fallback;
}

// Build a map chapter -> subject from detailed answers
function buildChapterSubjectMap(result) {
  const map = {};
  for (const key of ["correctAnswers", "wrongAnswers", "notAttempted"]) {
    const arr = parseJsonFieldDeep(result[key], []);
    if (!Array.isArray(arr)) continue;
    for (const row of arr) {
      if (!Array.isArray(row)) continue;
      const [, subject, chapter] = row; // [qid, subject, chapter, ...]
      const subj = normSubject(subject);
      const chap = String(chapter || "").trim();
      if (subj && chap && !map[chap]) map[chap] = subj; // first seen wins
    }
  }
  return map;
}

function overallPercentFromSubjectWiseMarks(subjectWiseMarks) {
  try {
    const obj = typeof subjectWiseMarks === "string"
      ? JSON.parse(subjectWiseMarks)
      : subjectWiseMarks;
    if (!obj || typeof obj !== "object") return null;

    let obtained = 0, total = 0;
    for (const v of Object.values(obj)) {
      obtained += Number(v?.obtained ?? v?.score ?? 0);
      total    += Number(v?.total    ?? v?.max   ?? 0);
    }
    if (total <= 0) return null;
    return (obtained * 100) / total;
  } catch {
    return null;
  }
}

// --- NEW helper: build subject -> [chapters] from Admintest.topic_name ---
function topicsMapFromAdmin(testDef) {
  try {
    const raw = Array.isArray(testDef.topic_name)
      ? testDef.topic_name
      : JSON.parse(testDef.topic_name || "[]");

    const map = {};
    for (const item of raw) {
      if (!item) continue;
      const subj = normSubject(item.subject || item.Subject);
      let list = [];
      if (Array.isArray(item.topic_names)) list = item.topic_names;
      else if (Array.isArray(item.topics)) list = item.topics;
      else if (item.topic) list = [item.topic];

      for (const ch of list) {
        const name = String(ch || "").trim();
        if (!name || !subj) continue;
        (map[subj] ||= []).push(name);
      }
    }
    return map;
  } catch {
    return {};
  }
}

/* ---------------------------
   Entry point
----------------------------*/

export async function applyResultUpdate({ studentId, testType, testId, resultId }) {
  const [row] = await StudentAnalytics.findOrCreate({
    where: { student_id: studentId },
    defaults: {
      student_id: studentId,
      subject_mastery: {},
      chapter_mastery: {},
      topic_mastery: {},
      recent_windows: { overall_last5: null, Physics_last5: null, Chemistry_last5: null, Biology_last5: null },
      ai_plan: null,
    },
  });

  const subjectMastery = parseJsonFieldDeep(row.subject_mastery, {});
  const chapterMastery = parseJsonFieldDeep(row.chapter_mastery, {});
  const topicMastery   = parseJsonFieldDeep(row.topic_mastery, {});

  const alphaEff = Math.min(1, BASE_ALPHA * (TYPE_WEIGHTS[testType] ?? 1.0));

  if (testType === "full") {
    await updateFromFullLength({ studentId, testId, resultId, alphaEff, subjectMastery, chapterMastery });
  } else if (testType === "teacher") {
    await updateFromTeacher({ studentId, testId, resultId, alphaEff, subjectMastery, chapterMastery, topicMastery });
  } else if (testType === "user") {
    await updateFromUserGenerated({ studentId, testId, resultId, alphaEff, subjectMastery, chapterMastery });
  } else if (testType === "series") {
    await updateFromSeries({ studentId, testId, resultId, alphaEff, subjectMastery });
  }

  row.subject_mastery = subjectMastery;
  row.chapter_mastery = chapterMastery;
  row.topic_mastery = topicMastery;
  row.recent_windows = await recomputeRecentWindows(studentId);

  await row.save();
}

/* ---------------------------
   Updaters
----------------------------*/

async function updateFromFullLength({ studentId, testId, resultId, alphaEff, subjectMastery, chapterMastery }) {
  let result = null;
  if (resultId != null) result = await FullTestResults.findByPk(resultId);
  if (!result && testId != null) result = await FullTestResults.findOne({ where: { id: testId, studentId } });
  if (!result) return;

  const subjectArr = parseJsonFieldDeep(result.subjectWisePerformance, []);
  const chapterArr = parseJsonFieldDeep(result.chapterWisePerformance, []);

  // SUBJECTS: [subject, correct, wrong, notAttempted, marks]
  for (const row of subjectArr) {
    if (!Array.isArray(row)) continue;
    const [subject, correct = 0, wrong = 0, na = 0] = row;
    const subj = normSubject(subject);
    const totalQ = Number(correct) + Number(wrong) + Number(na);
    if (!subj || totalQ <= 0) continue;

    const observed = (Number(correct) / totalQ) * 100;
    const node = ensureNode(subjectMastery, [subj]);
    node.score = applyEMA(node.score ?? 0, observed, alphaEff);
    node.attempts = (node.attempts ?? 0) + 1;
  }

  // CHAPTERS: [chapter, correct, wrong, marks]  (map chapter -> subject)
  const ch2sub = buildChapterSubjectMap(result);

  // Default subject fallback = the subject with most total questions in this test
  let defaultSubject = null;
  let bestTotal = -1;
  for (const row of subjectArr) {
    if (!Array.isArray(row)) continue;
    const [subject, c = 0, w = 0, na = 0] = row;
    const total = Number(c) + Number(w) + Number(na);
    if (total > bestTotal) {
      bestTotal = total;
      defaultSubject = normSubject(subject);
    }
  }

  for (const row of chapterArr) {
    if (!Array.isArray(row)) continue;
    const [chapter, correct = 0, wrong = 0] = row;
    const chap = String(chapter || "").trim();
    const totalQ = Number(correct) + Number(wrong);
    if (!chap || totalQ <= 0) continue;

    const observed = (Number(correct) / totalQ) * 100;
    const subj = ch2sub[chap] || defaultSubject; // no more "_"
    if (!subj) continue;

    const node = ensureNode(chapterMastery, [subj, chap]);
    node.score = applyEMA(node.score ?? 0, observed, alphaEff);
    node.attempts = (node.attempts ?? 0) + 1;
  }
}

// --- REPLACE your updateFromTeacher with this version ---
async function updateFromTeacher({ studentId, testId, resultId, alphaEff, subjectMastery, chapterMastery /*, topicMastery*/ }) {
  const testDef = await Admintest.findByPk(testId);
  if (!testDef) return;

  // find the student's saved result for this admin test
  const result = await GenerateTestResult.findOne({ where: { studentId, testid: testId } })
                || (resultId ? await GenerateTestResult.findByPk(resultId) : null);
  if (!result) return;

  // compute observed % from your fields
  const observed =
    // score / overallmarks
    (result.overallmarks > 0 ? (Number(result.score) * 100) / Number(result.overallmarks) : null) ??
    // fallback: aggregate from subjectWiseMarks
    (function overallPercentFromSWM(swmRaw) {
      try {
        const swm = typeof swmRaw === "string" ? JSON.parse(swmRaw) : swmRaw;
        if (!swm || typeof swm !== "object") return null;
        let obtained = 0, total = 0;
        for (const v of Object.values(swm)) {
          obtained += Number(v?.obtained ?? v?.score ?? 0);
          total    += Number(v?.total    ?? v?.max   ?? 0);
        }
        return total > 0 ? (obtained * 100) / total : null;
      } catch { return null; }
    })(result.subjectWiseMarks);

  if (observed == null) return;

  // subjects: prefer keys from subjectWiseMarks; else split testDef.subject; handle "Full Syllabus"
  let subjects = [];
  try {
    const swm = typeof result.subjectWiseMarks === "string"
      ? JSON.parse(result.subjectWiseMarks)
      : result.subjectWiseMarks;
    if (swm && typeof swm === "object") subjects = Object.keys(swm);
  } catch { /* ignore */ }

  if (!subjects.length) {
    const subjRaw = String(testDef.subject || "").trim();
    subjects = /full\s*syllabus/i.test(subjRaw)
      ? ["Physics", "Chemistry", "Biology"]
      : subjRaw.split(",").map(s => s.trim()).filter(Boolean);
  }
  subjects = subjects.map(normSubject).filter(Boolean);

  // chapters per subject from topic_name; fallback to unitName (which can be "Full Syllabus")
  const subjToChaps = topicsMapFromAdmin(testDef);
  const fallbackChaps = String(testDef.unitName || "Full Syllabus")
    .split(",").map(s => s.trim()).filter(Boolean);

  // update mastery
  for (const subject of subjects) {
    // subject mastery
    const sNode = ensureNode(subjectMastery, [subject]);
    sNode.score = applyEMA(sNode.score ?? 0, observed, alphaEff);
    sNode.attempts = (sNode.attempts ?? 0) + 1;

    // chapter mastery for each chapter under this subject
    const chapterNames = (subjToChaps[subject] && subjToChaps[subject].length)
      ? subjToChaps[subject]
      : fallbackChaps;

    for (const chapterName of chapterNames) {
      const cNode = ensureNode(chapterMastery, [subject, chapterName]);
      cNode.score = applyEMA(cNode.score ?? 0, observed, alphaEff);
      cNode.attempts = (cNode.attempts ?? 0) + 1;
    }
  }
}

async function updateFromUserGenerated({ studentId, testId, resultId, alphaEff, subjectMastery, chapterMastery }) {
  const result = await GenerateTestResult.findOne({ where: { studentId, testid: testId } })
                || await GenerateTestResult.findByPk(resultId);
  if (!result) return;

  try {
    const swm = typeof result.subjectWiseMarks === "string"
      ? JSON.parse(result.subjectWiseMarks)
      : result.subjectWiseMarks;

    if (swm && typeof swm === "object") {
      for (const [subjRaw, data] of Object.entries(swm)) {
        const observed = percentFromAny(data);
        const subj = normSubject(subjRaw);
        if (observed == null || !subj) continue;
        const node = ensureNode(subjectMastery, [subj]);
        node.score = applyEMA(node.score ?? 0, observed, alphaEff);
        node.attempts = (node.attempts ?? 0) + 1;
      }
    }
  } catch {}

  try {
    const sc = typeof result.selectedChapters === "string"
      ? JSON.parse(result.selectedChapters)
      : result.selectedChapters;

    const overall = percentFromAny(result);
    if (overall != null && sc) {
      const list = Array.isArray(sc) ? sc : [];
      for (const entry of list) {
        const subj = normSubject(entry.subject);
        const chapter = String(entry.chapter || entry.name || entry.unitName || "").trim();
        if (!subj || !chapter) continue;
        const node = ensureNode(chapterMastery, [subj, chapter]);
        node.score = applyEMA(node.score ?? 0, overall, alphaEff);
        node.attempts = (node.attempts ?? 0) + 1;
      }
    }
  } catch {}
}

async function updateFromSeries({ studentId, testId, resultId, alphaEff, subjectMastery }) {
  const result = await TestSeriesResult.findOne({ where: { studentId, testId } }) || await TestSeriesResult.findByPk(resultId);
  if (!result) return;

  const testDef = await TestSeriesTest.findByPk(testId);
  const subject = normSubject(testDef?.subject);
  const observed = percentFromAny(result);
  if (!subject || observed == null) return;

  const node = ensureNode(subjectMastery, [subject]);
  node.score = applyEMA(node.score ?? 0, observed, alphaEff);
  node.attempts = (node.attempts ?? 0) + 1;
}

/* ---------------------------
   Recent windows (last 5)
----------------------------*/

async function recomputeRecentWindows(studentId) {
  const N = 5;
  const arr = [];

  const fullRows = await FullTestResults.findAll({
    where: { studentId },
    order: [["createdAt", "DESC"]],
    limit: N,
  });
  for (const r of fullRows) {
    arr.push({ type: "full", percent: percentFromAny(r), bySubject: kvFromSubjectArray(r.subjectWisePerformance) });
  }

  const genRows = await GenerateTestResult.findAll({
    where: { studentId },
    order: [["createdAt", "DESC"]],
    limit: N,
  });
  for (const r of genRows) {
    arr.push({ type: "generated", percent: percentFromAny(r), bySubject: kvFromSubjectWiseMarks(r.subjectWiseMarks) });
  }

  const seriesRows = await TestSeriesResult.findAll({
    where: { studentId },
    order: [["createdAt", "DESC"]],
    limit: N,
  });
  for (const r of seriesRows) {
    arr.push({ type: "series", percent: percentFromAny(r) });
  }

  const overallPercents = arr.map(x => x.percent).filter(v => v != null);
  const overall_last5 = average(overallPercents.slice(0, N));

  const subjects = ["Physics", "Chemistry", "Biology"];
  const out = { overall_last5 };
  for (const s of subjects) {
    const subjPercs = [];
    for (const x of arr) {
      if (x.bySubject && x.bySubject[s] != null) subjPercs.push(x.bySubject[s]);
    }
    out[`${s}_last5`] = subjPercs.length ? average(subjPercs.slice(0, N)) : null;
  }
  return out;
}

/* ---------------------------
   Utilities
----------------------------*/

function average(list) {
  const arr = list.filter(v => typeof v === "number" && !Number.isNaN(v));
  if (!arr.length) return null;
  const sum = arr.reduce((a, b) => a + b, 0);
  return Math.round((sum / arr.length) * 10) / 10;
}

function percentFromAny(obj) {
  if (!obj || typeof obj !== "object") return null;
  if (typeof obj.percent === "number") return obj.percent;
  if (obj.obtained != null && obj.total != null && Number(obj.total) > 0) {
    return (Number(obj.obtained) * 100) / Number(obj.total);
  }
  if (obj.score != null && obj.max != null && Number(obj.max) > 0) {
    return (Number(obj.score) * 100) / Number(obj.max);
  }
  if (obj.marksObtained != null && obj.totalMarks != null && Number(obj.totalMarks) > 0) {
    return (Number(obj.marksObtained) * 100) / Number(obj.totalMarks);
  }
  return null;
}

function kvFromSubjectArray(subjectArrRaw) {
  const out = {};
  const arr = parseJsonFieldDeep(subjectArrRaw, []);
  for (const item of arr) {
    if (!Array.isArray(item)) continue;
    const [subject, correct = 0, wrong = 0, na = 0] = item;
    const s = normSubject(subject);
    const totalQ = Number(correct) + Number(wrong) + Number(na);
    if (!s || totalQ <= 0) continue;
    out[s] = (Number(correct) / totalQ) * 100;
  }
  return out;
}

function kvFromSubjectWiseMarks(subjectWiseMarks) {
  try {
    const obj = typeof subjectWiseMarks === "string" ? JSON.parse(subjectWiseMarks) : subjectWiseMarks;
    const out = {};
    if (obj && typeof obj === "object") {
      for (const [k, v] of Object.entries(obj)) {
        const p = percentFromAny(v);
        const s = normSubject(k);
        if (p != null && s) out[s] = p;
      }
    }
    return out;
  } catch {
    return {};
  }
}
