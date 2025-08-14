// services/gating.js
function clamp01(x) { return Math.max(0, Math.min(100, x)); }

// Decide if student can start the next test
export function evaluateGate(analytics, rules = { overall: 45, subject: 50 }) {
  const rw = analytics?.recent_windows || {};
  const overall = Number(rw.overall_last5 ?? NaN);
  const p = Number(rw.Physics_last5 ?? NaN);
  const c = Number(rw.Chemistry_last5 ?? NaN);
  const b = Number(rw.Biology_last5 ?? NaN);

  const reasons = [];
  let allowed = true;

  // Overall gate
  if (!(overall >= rules.overall)) {
    allowed = false;
    reasons.push(`Raise Overall last-5 to ≥ ${rules.overall}% (current: ${Number.isFinite(overall) ? clamp01(overall).toFixed(1) : "N/A"}%)`);
  }
  // Any subject gate
  const subjFails = [];
  if (!(p >= rules.subject)) subjFails.push(`Physics ≥ ${rules.subject}% (now ${Number.isFinite(p) ? clamp01(p).toFixed(1) : "N/A"}%)`);
  if (!(c >= rules.subject)) subjFails.push(`Chemistry ≥ ${rules.subject}% (now ${Number.isFinite(c) ? clamp01(c).toFixed(1) : "N/A"}%)`);
  if (!(b >= rules.subject)) subjFails.push(`Biology ≥ ${rules.subject}% (now ${Number.isFinite(b) ? clamp01(b).toFixed(1) : "N/A"}%)`);
  if (subjFails.length) {
    allowed = false;
    reasons.push(...subjFails);
  }

  return {
    allowed,
    reasons,
    targets: rules
  };
}
