// api/save-topics.js — password-protected endpoint to push precomputed topic
// clusters into Vercel KV. Used by scripts/refresh-topics.mjs, which runs on a
// SciVal-entitled network (the SciVal API is IP-restricted and 403s from Vercel).

import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { password, areas } = req.body;

  const correctPassword = process.env.SETTINGS_PASSWORD;
  if (!correctPassword) return res.status(500).json({ error: "SETTINGS_PASSWORD not configured on server" });
  if (password !== correctPassword) return res.status(401).json({ error: "Incorrect password" });

  if (!Array.isArray(areas) || areas.length === 0) {
    return res.status(400).json({ error: "areas must be a non-empty array" });
  }

  try {
    const now = new Date().toISOString();
    await kv.set("topics_cache", { areas, updatedAt: now, cachedAt: now });
    return res.status(200).json({ ok: true, areas: areas.length });
  } catch (err) {
    return res.status(500).json({ error: "Could not save — Vercel KV not connected.", detail: err.message });
  }
}
