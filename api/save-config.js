// api/save-config.js — password-protected endpoint to persist config to Vercel KV.
// Requires SETTINGS_PASSWORD and Vercel KV env vars to be set.

import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { password, universities, themes } = req.body;

  const correctPassword = process.env.SETTINGS_PASSWORD;
  if (!correctPassword) return res.status(500).json({ error: "SETTINGS_PASSWORD not configured on server" });
  if (password !== correctPassword) return res.status(401).json({ error: "Incorrect password" });

  if (!Array.isArray(universities) || !Array.isArray(themes)) {
    return res.status(400).json({ error: "Invalid config shape" });
  }

  try {
    await kv.set("dashboard_config", { universities, themes });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({
      error: "Could not save — Vercel KV not connected. Add a KV database in your Vercel project under Storage.",
      detail: err.message,
    });
  }
}
