// scripts/refresh-topics.mjs — compute SciVal topic clusters locally and push
// them to the live site's KV cache.
//
// Why: the SciVal API entitlement is IP-based, so it works from the university
// network but 403s from Vercel's servers. Run this from an entitled network
// (campus or VPN) whenever you want to refresh the What We Do page:
//
//   node scripts/refresh-topics.mjs
//
// Reads SCOPUS_API_KEY and SETTINGS_PASSWORD from .env.

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const { computeTopics } = await import(join(root, "api/topics.js"));
const { UNIVERSITIES }  = await import(join(root, "src/data.js"));

const SITE = process.env.SITE_URL || "https://iuca-pages.vercel.app";

console.log(`Computing topic clusters for ${UNIVERSITIES.length} universities…`);
const debug = [];
const clusters = await computeTopics(UNIVERSITIES, process.env.SCOPUS_API_KEY, debug);
debug.forEach(d => console.log("  !", d));
console.log(`Got ${clusters.length} clusters. Top 5:`);
clusters.slice(0, 5).forEach(c => console.log(`  - ${c.name} (${c.uniCount} unis)`));

if (!clusters.length) {
  console.error("No clusters computed — are you on a SciVal-entitled network?");
  process.exit(1);
}

const r = await fetch(`${SITE}/api/save-topics`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password: process.env.SETTINGS_PASSWORD, clusters }),
});
const body = await r.json();
if (!r.ok) { console.error("Save failed:", body); process.exit(1); }
console.log(`Saved to ${SITE} — the What We Do page is now up to date.`);
