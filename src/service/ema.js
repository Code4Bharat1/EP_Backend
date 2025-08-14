// services/ema.js

export const BASE_ALPHA = 0.35;

export const TYPE_WEIGHTS = {
  full: 1.0,        // Full length tests
  series: 0.9,      // Test Series
  teacher: 0.8,     // Admin/Teacher generated
  user: 0.6,        // User-generated
};

// Slight boost for hard questions if you pass a difficulty flag: "easy" | "medium" | "hard"
export function difficultyFactor(difficulty) {
  if (!difficulty) return 1.0;
  if (difficulty === "hard") return 1.12;
  if (difficulty === "easy") return 0.9;
  return 1.0;
}

export function applyEMA(prev = 0, observedPercent, alphaEff) {
  if (observedPercent == null || Number.isNaN(observedPercent)) return prev;
  return (1 - alphaEff) * prev + alphaEff * observedPercent;
}

// Ensure the node exists and returns the leaf object to mutate
export function ensureNode(obj, path) {
  let ref = obj;
  for (const key of path) {
    if (!ref[key]) ref[key] = {};
    ref = ref[key];
  }
  return ref;
}
