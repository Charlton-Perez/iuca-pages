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
const { computeImpact } = await import(join(root, "api/altmetric.js"));
const { UNIVERSITIES }  = await import(join(root, "src/data.js"));
const { writeFileSync, mkdirSync } = await import("fs");

const SITE = process.env.SITE_URL || "https://iuca-pages.vercel.app";

console.log(`Computing topic areas for ${UNIVERSITIES.length} universities…`);
const debug = [];
const areas = await computeTopics(UNIVERSITIES, process.env.SCOPUS_API_KEY, debug);
debug.forEach(d => console.log("  !", d));
console.log(`Got ${areas.length} areas:`);
areas.forEach(a => console.log(`  - ${a.name} — ${a.paperCount} papers, ${a.uniCount} unis, ${a.clusterCount} clusters`));

if (!areas.length) {
  console.error("No areas computed — are you on a SciVal-entitled network?");
  process.exit(1);
}

// The pages fetch these static JSON files straight from the Vercel CDN — no
// serverless function runs on page load, so there's no cold-start latency.
const now     = new Date().toISOString();
const dataDir = join(root, "public/data");
mkdirSync(dataDir, { recursive: true });

// 1. Topics → public/data/topics.json  (fetched by src/WhatWeDo.jsx)
const topicsPayload = { areas, updatedAt: now };
writeFileSync(join(dataDir, "topics.json"), JSON.stringify(topicsPayload));
console.log("Wrote public/data/topics.json");

// 2. Impact → public/data/impact.json  (fetched by src/InTheNews.jsx)
try {
  console.log("\nComputing Impact papers (Altmetric + SciVal)…");
  const papers = await computeImpact({ months: 6, limit: 10 });
  const withArea = papers.filter(p => p.areaId).length;
  console.log(`Got ${papers.length} impact papers (${withArea} area-tagged):`);
  papers.slice(0, 5).forEach(p => console.log(`  - [${p.score}] ${p.areaName || "—"}: ${p.title.slice(0, 55)}`));
  if (papers.length) {
    writeFileSync(join(dataDir, "impact.json"),
      JSON.stringify({ papers, total: papers.length, fetchedAt: now }));
    console.log("Wrote public/data/impact.json");
  } else {
    console.warn("No impact papers computed — leaving existing impact.json in place.");
  }
} catch (err) {
  console.warn("Impact compute failed (leaving existing impact.json):", err.message);
}

console.log("\nCommit and push public/data/*.json to update the live site.");
