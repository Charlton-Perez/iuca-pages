// api/altmetric.js — Vercel serverless function
// Returns top 10 climate papers by Altmetric attention score from IUCA members.
// Enriches each paper with:
//   - All IUCA co-authors (from Altmetric affiliations)
//   - Abstract snippet (Scopus Abstract Retrieval API)
//   - FWCI + topic cluster name (SciVal)

import crypto from "crypto";
import { UNIVERSITIES } from "../src/data.js";

// Build lookup maps from the authoritative UNIVERSITIES list in data.js
const GRID_TO_UNI  = Object.fromEntries(UNIVERSITIES.map(u => [u.gridId,   { name: u.name, flag: u.flag }]));
const SCOPUS_TO_UNI = Object.fromEntries(UNIVERSITIES.map(u => [u.scopusId, { name: u.name, flag: u.flag }]));

const IUCA_GRID_IDS = UNIVERSITIES.map(u => u.gridId);

// HMAC digest for Altmetric Explorer signed requests
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

async function fetchFromExplorer(key, secret, timeframe, limit) {
  const filters = { affiliations: IUCA_GRID_IDS, q: "climate", scope: "all", timeframe };
  const digest  = buildDigest(secret, filters);

  const affiliationQs = IUCA_GRID_IDS.map(id => `filter[affiliations][]=${id}`).join("&");
  const qs = [
    `key=${key}`,
    affiliationQs,
    `filter[q]=climate`,
    `filter[timeframe]=${timeframe}`,
    `filter[scope]=all`,
    `filter[order]=score_desc`,
    `page[size]=${Math.min(limit, 100)}`,
    `include=affiliations,journals`,
    `digest=${digest}`,
  ].join("&");

  const r = await fetch(`https://www.altmetric.com/explorer/api/research_outputs?${qs}`,
    { headers: { Accept: "application/json" } });

  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Explorer ${r.status}: ${body.slice(0, 300)}`);
  }

  const data     = await r.json();
  const outputs  = data?.data     || [];
  const included = data?.included || [];

  return outputs.map(item => {
    const attr     = item.attributes || {};
    const mentions = attr.mentions   || {};
    const score    = Math.round(Number(attr["altmetric-score"] || 0));
    const doi      = attr.identifiers?.dois?.[0] || null;
    const pubStr   = attr["publication-date"] || null;
    const publishedOn = pubStr ? new Date(pubStr).getTime() / 1000 : null;

    // Collect ALL IUCA co-authors from affiliation relationships
    const affiliationIds = item.relationships?.affiliations?.data?.map(a => a.id) || [];
    const iucaMembers = affiliationIds
      .map(affId => {
        if (GRID_TO_UNI[affId]) return GRID_TO_UNI[affId];
        const match = included.find(i => i.type === "affiliation" && i.id === affId);
        if (match?.attributes?.name) {
          // Try to match by name to get flag
          const found = UNIVERSITIES.find(u =>
            u.name.toLowerCase() === match.attributes.name.toLowerCase()
          );
          return found ? { name: found.name, flag: found.flag } : null;
        }
        return null;
      })
      .filter(Boolean)
      .filter((u, i, arr) => arr.findIndex(x => x.name === u.name) === i); // dedupe

    const journalId  = item.relationships?.journal?.data?.id;
    const journalObj = journalId ? included.find(i => i.type === "journal" && i.id === journalId) : null;
    const journal    = journalObj?.attributes?.title || journalObj?.attributes?.name || "";

    return {
      doi,
      title:          attr.title || "",
      journal,
      score,
      publishedOn,
      iucaMembers:    iucaMembers.length ? iucaMembers : [{ name: "IUCA Member", flag: "🌍" }],
      newsOutlets:    mentions.msm    || 0,
      policyMentions: mentions.policy || 0,
      blogMentions:   mentions.blog   || 0,
      socialMentions: (mentions.tweet || 0) + (mentions.bluesky || 0) + (mentions.rdt || 0),
      paperUrl:       doi ? `https://doi.org/${doi}` : "#",
      detailsUrl:     item.id ? `https://www.altmetric.com/details/${item.id}` : null,
    };
  })
  .filter(p => p.title && p.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, limit);
}

// Fetch abstract + EID from Scopus Abstract Retrieval API for a single DOI
async function fetchAbstract(doi, apiKey) {
  const url = `https://api.elsevier.com/content/abstract/doi/${encodeURIComponent(doi)}` +
    `?field=dc:description,eid,affiliation`;
  try {
    const r = await fetch(url, {
      headers: { "X-ELS-APIKey": apiKey, Accept: "application/json" },
    });
    if (!r.ok) return null;
    const data  = await r.json();
    const core  = data?.["abstracts-retrieval-response"]?.coredata || {};
    const eid   = (core.eid || "").replace("2-s2.0-", "");
    const abstractText = core["dc:description"] || "";

    // Full affiliation list for IUCA member detection
    const rawAffs = data?.["abstracts-retrieval-response"]?.affiliation || [];
    const affsArr = Array.isArray(rawAffs) ? rawAffs : [rawAffs];
    const iucaFromScopus = affsArr
      .map(a => {
        const sid = a?.["@id"];
        if (sid && SCOPUS_TO_UNI[sid]) return SCOPUS_TO_UNI[sid];
        const name = (a?.affilname || a?.["affiliation-city"] || "").toLowerCase();
        const found = UNIVERSITIES.find(u => u.name.toLowerCase().includes(name) || name.includes(u.name.toLowerCase().split(" ")[0]));
        return found ? { name: found.name, flag: found.flag } : null;
      })
      .filter(Boolean)
      .filter((u, i, arr) => arr.findIndex(x => x.name === u.name) === i);

    return { eid, abstract: abstractText.slice(0, 280), iucaFromScopus };
  } catch {
    return null;
  }
}

// Fetch FWCI + topic cluster for a list of SciVal/Scopus numeric IDs
async function fetchSciVal(ids, apiKey) {
  if (!ids.length) return {};
  const url = `https://api.elsevier.com/analytics/scival/publication/metrics` +
    `?metricTypes=FieldWeightedCitationImpact&publicationIds=${ids.join(",")}`;
  try {
    const r = await fetch(url, { headers: { "X-ELS-APIKey": apiKey, Accept: "application/json" } });
    if (!r.ok) return {};
    const data = await r.json();
    const out  = {};
    for (const item of data.results || []) {
      const pub = item.publication || {};
      const id  = String(pub.id || "");
      if (!id) continue;
      const byYear = item.metrics?.[0]?.valueByYear || {};
      const fwci   = Object.keys(byYear).sort((a, b) => b - a)
        .map(y => byYear[y]).find(v => v !== null) ?? null;
      out[id] = {
        fwci:        fwci !== null ? Math.round(fwci * 100) / 100 : null,
        topicCluster: pub.topicClusterName || "",
      };
    }
    return out;
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600"); // 1h cache for rich data

  const timeframe      = ["1m","3m","6m","1y","3y","5y"].includes(req.query.timeframe)
    ? req.query.timeframe : "1y";
  const limit          = Math.min(parseInt(req.query.limit) || 10, 20);
  const explorerKey    = process.env.ALTMETRIC_EXPLORER_KEY;
  const explorerSecret = process.env.ALTMETRIC_EXPLORER_SECRET;
  const scopusKey      = process.env.SCOPUS_API_KEY;

  if (!explorerKey || !explorerSecret) {
    return res.status(500).json({ error: "Altmetric Explorer credentials not configured" });
  }

  try {
    // Step 1: Altmetric — top papers by attention score
    const papers = await fetchFromExplorer(explorerKey, explorerSecret, timeframe, limit);

    // Step 2: Parallel Scopus Abstract enrichment (abstract + EID + extra IUCA members)
    const abstractResults = await Promise.all(
      papers.map(p => p.doi && scopusKey ? fetchAbstract(p.doi, scopusKey) : Promise.resolve(null))
    );

    // Step 3: Batch SciVal — FWCI + topic cluster
    const eids = abstractResults.map(r => r?.eid).filter(Boolean);
    const svData = scopusKey ? await fetchSciVal(eids, scopusKey) : {};

    // Step 4: Merge everything
    const enriched = papers.map((p, i) => {
      const abs = abstractResults[i];
      const sv  = abs?.eid ? svData[abs.eid] : null;

      // Merge IUCA members from Altmetric + Scopus affiliation (deduplicated)
      const scopusMembers = abs?.iucaFromScopus || [];
      const combined = [...p.iucaMembers];
      for (const u of scopusMembers) {
        if (!combined.some(x => x.name === u.name)) combined.push(u);
      }

      return {
        ...p,
        iucaMembers:  combined,
        abstract:     abs?.abstract || null,
        fwci:         sv?.fwci ?? null,
        topicCluster: sv?.topicCluster || null,
      };
    });

    return res.status(200).json({
      papers:    enriched,
      total:     enriched.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
