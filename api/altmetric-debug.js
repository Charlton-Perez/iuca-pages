// api/altmetric-debug.js — returns the raw first result from Altmetric Explorer
// so we can confirm exact field names. Password-protected.
// Visit: /api/altmetric-debug?password=iuca2024

import crypto from "crypto";

const GRID_IDS = [
  "grid.9025.f","grid.4991.5","grid.5335.0","grid.4305.2","grid.8391.3",
];

function buildDigest(secret, filters) {
  const parts = [];
  for (const name of Object.keys(filters).sort()) {
    parts.push(name);
    const vals = filters[name];
    if (Array.isArray(vals)) vals.forEach(v => parts.push(v));
    else parts.push(vals);
  }
  return crypto.createHmac("sha1", secret).update(parts.join("|")).digest("hex");
}

export default async function handler(req, res) {
  if (req.query.password !== process.env.SETTINGS_PASSWORD) {
    return res.status(401).json({ error: "Provide ?password=..." });
  }

  const key    = process.env.ALTMETRIC_EXPLORER_KEY;
  const secret = process.env.ALTMETRIC_EXPLORER_SECRET;
  if (!key || !secret) return res.status(500).json({ error: "No Explorer credentials" });

  const filters = { affiliations: GRID_IDS, timeframe: "6m", scope: "all" };
  const digest  = buildDigest(secret, filters);
  const affQs   = GRID_IDS.map(id => `filter[affiliations][]=${id}`).join("&");
  const qs = [`key=${key}`, affQs, `filter[timeframe]=6m`, `filter[scope]=all`,
    `filter[order]=score_desc`, `page[size]=1`, `include=mentions`, `digest=${digest}`].join("&");

  const r = await fetch(`https://www.altmetric.com/explorer/api/research_outputs?${qs}`,
    { headers: { Accept: "application/json" } });

  if (!r.ok) {
    const body = await r.text();
    return res.status(200).json({ httpStatus: r.status, body: body.slice(0, 500) });
  }

  const data = await r.json();
  const first = data?.data?.[0];
  return res.status(200).json({
    itemType:          first?.type,
    attributeKeys:     Object.keys(first?.attributes || {}),
    attributes:        first?.attributes,
    mentionCountKeys:  Object.keys(first?.attributes?.mention_counts || {}),
    relationshipKeys:  Object.keys(first?.relationships || {}),
    includedTypes:     [...new Set((data?.included || []).map(i => i.type))],
    firstIncluded:     data?.included?.[0],
    totalItems:        data?.data?.length,
  });
}
