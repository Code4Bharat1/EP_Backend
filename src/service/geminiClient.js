// services/geminiClient.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
let _client = null;

export function getGemini(model = "gemini-1.5-flash") {
  if (!_client) _client = new GoogleGenerativeAI(apiKey);
  return _client.getGenerativeModel({ model });
}

// Robust JSON grabber from LLM output
export function parseJsonLoose(text) {
  if (!text) return null;
  // try plain parse
  try { return JSON.parse(text); } catch {}
  // try code fence
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try { return JSON.parse(fence[1]); } catch {}
  }
  // try first {...} block
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(text.slice(first, last + 1)); } catch {}
  }
  return null;
}
