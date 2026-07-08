// api/config.js — returns current dashboard config from Vercel KV, or hardcoded defaults.
// Vercel KV env vars (KV_REST_API_URL, KV_REST_API_TOKEN) are set automatically
// when you connect a KV database in the Vercel dashboard under Storage.

import { kv } from "@vercel/kv";
import { UNIVERSITIES, DEFAULT_SUBJECT_CODES } from "../src/data.js";

const DEFAULTS = { universities: UNIVERSITIES, subjectCodes: DEFAULT_SUBJECT_CODES };

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60"); // 1-minute cache so edits propagate quickly

  try {
    const stored = await kv.get("dashboard_config");
    return res.status(200).json(stored || DEFAULTS);
  } catch {
    // KV not configured — return defaults silently
    return res.status(200).json(DEFAULTS);
  }
}
