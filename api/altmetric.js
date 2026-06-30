// api/altmetric.js — Vercel serverless function
// Uses Altmetric Explorer API (institutional access) with HMAC-SHA1 signing.
// Falls back to Scopus + free Altmetric API if Explorer credentials are missing.

import crypto from "crypto";

const IUCA_GRID_IDS = [
  "grid.9025.f",    // University of Reading
  "grid.4991.5",    // University of Oxford
  "grid.5335.0",    // University of Cambridge
  "grid.4305.2",    // University of Edinburgh
  "grid.8391.3",    // University of Exeter
  "grid.9909.9",    // University of Leeds
  "grid.13097.3c",  // King's College London
  "grid.12082.39",  // University of Sussex
  "grid.462410.5",  // Sorbonne Université
  "grid.5801.c",    // ETH Zurich
  "grid.7400.3",    // University of Zurich
  "grid.7737.4",    // University of Helsinki
  "grid.7704.4",    // University of Bremen
  "grid.1005.4",    // UNSW Sydney
  "grid.1008.9",    // University of Melbourne
  "grid.1002.3",    // Monash University
  "grid.1009.8",    // University of Tasmania
  "grid.4280.e",    // National University of Singapore
  "grid.10784.3a",  // Chinese University of Hong Kong
  "grid.194645.b",  // University of Hong Kong
  "grid.39158.36",  // Hokkaido University
  "grid.41156.37",  // Nanjing University
  "grid.443626.0",  // China University of Geosciences
  "grid.20861.3d",  // California Institute of Technology
  "grid.5386.8",    // Cornell University
  "grid.47100.32",  // Yale University
  "grid.137628.9",  // New York University
  "grid.266190.a",  // University of Colorado Boulder
  "grid.14709.3b",  // McGill University
  "grid.11899.38",  // University of São Paulo
  "grid.10604.33",  // University of Nairobi
  "grid.10818.34",  // University of Ghana
  "grid.7836.a",    // University of Cape Town
  "grid.444501.3",  // TERI School of Advanced Studies
  "grid.449398.e",  // University of the South Pacific
];

// Direct GRID ID → display name lookup so we don't rely on sideloading
const GRID_TO_NAME = {
  "grid.9025.f":   "University of Reading",
  "grid.4991.5":   "University of Oxford",
  "grid.5335.0":   "University of Cambridge",
  "grid.4305.2":   "University of Edinburgh",
  "grid.8391.3":   "University of Exeter",
  "grid.9909.9":   "University of Leeds",
  "grid.13097.3c": "King's College London",
  "grid.12082.39": "University of Sussex",
  "grid.462410.5": "Sorbonne Université",
  "grid.5801.c":   "ETH Zurich",
  "grid.7400.3":   "University of Zurich",
  "grid.7737.4":   "University of Helsinki",
  "grid.7704.4":   "University of Bremen",
  "grid.1005.4":   "UNSW Sydney",
  "grid.1008.9":   "University of Melbourne",
  "grid.1002.3":   "Monash University",
  "grid.1009.8":   "University of Tasmania",
  "grid.4280.e":   "National University of Singapore",
  "grid.10784.3a": "Chinese University of Hong Kong",
  "grid.194645.b": "University of Hong Kong",
  "grid.39158.36": "Hokkaido University",
  "grid.41156.37": "Nanjing University",
  "grid.443626.0": "China University of Geosciences",
  "grid.20861.3d": "California Inst. of Technology",
  "grid.5386.8":   "Cornell University",
  "grid.47100.32": "Yale University",
  "grid.137628.9": "New York University",
  "grid.266190.a": "University of Colorado Boulder",
  "grid.14709.3b": "McGill University",
  "grid.11899.38": "University of São Paulo",
  "grid.10604.33": "University of Nairobi",
  "grid.10818.34": "University of Ghana",
  "grid.7836.a":   "University of Cape Town",
  "grid.444501.3": "TERI School of Advanced Studies",
  "grid.449398.e": "University of the South Pacific",
};

const IUCA_SCOPUS_IDS = [
  "60006462","60023256","60025259","60003093","60001809","60022452","60003596","60020422",
  "60071311","60028186","60028717","60002026","60007882","60031004","60031226","60031229",
  "60031244","60071417","60074798","60008712","60025272","60015498","60017001","60006951",
  "60007776","60021773","60075336","60018043","60014099","60003066","60003984","60003978",
  "60003980","60070377","60004028",
];

const SCOPUS_ID_TO_NAME = {
  "60006462":"University of Reading","60023256":"University of Oxford","60025259":"University of Cambridge",
  "60003093":"University of Edinburgh","60001809":"University of Exeter","60022452":"University of Leeds",
  "60003596":"King's College London","60020422":"University of Sussex","60071311":"Sorbonne Université",
  "60028186":"ETH Zurich","60028717":"University of Zurich","60002026":"University of Helsinki",
  "60007882":"University of Bremen","60031004":"UNSW Sydney","60031226":"University of Melbourne",
  "60031229":"Monash University","60031244":"University of Tasmania","60071417":"National University of Singapore",
  "60074798":"Chinese University of Hong Kong","60008712":"University of Hong Kong",
  "60025272":"Hokkaido University","60015498":"Nanjing University","60017001":"China University of Geosciences",
  "60006951":"California Inst. of Technology","60007776":"Cornell University","60021773":"Yale University",
  "60075336":"New York University","60018043":"University of Colorado Boulder","60014099":"McGill University",
  "60003066":"University of São Paulo","60003984":"University of Nairobi","60003978":"University of Ghana",
  "60003980":"University of Cape Town","60070377":"TERI School of Advanced Studies","60004028":"University of the South Pacific",
};

const THEME_KEYWORDS = {
  "Atmosphere & Weather":  ["forecast","atmospheric","weather","precipitation","aerosol","jet stream","air quality","monsoon"],
  "Oceans & Sea Level":    ["ocean","sea level","marine","coastal","coral","salinity","thermohaline","tidal"],
  "Cryosphere":            ["glacier","ice sheet","permafrost","arctic","sea ice","snow","cryosphere","polar"],
  "Ecosystems":            ["biodiversity","ecosystem","forest","deforestation","wetland","peatland","species","habitat"],
  "Society & Health":      ["adaptation","health","mortality","equity","justice","migration","urban","community"],
  "Mitigation & Energy":   ["mitigation","renewable","carbon capture","net zero","decarbonisation","solar","emissions"],
  "Food & Water":          ["food","agriculture","drought","water","irrigation","crop","agroecology","groundwater"],
  "Extreme Events":        ["extreme","heatwave","flood","wildfire","cyclone","attribution","disaster","compound"],
};

function classifyTheme(title = "", journal = "") {
  const text = (title + " " + journal).toLowerCase();
  let best = { theme: "Climate Science", count: 0 };
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    const count = keywords.filter(k => text.includes(k)).length;
    if (count > best.count) best = { theme, count };
  }
  return best.theme;
}

// Canonical string: only filter[] params (not key/digest/page[]/filter[order]),
// sorted alphabetically by filter name, values in URL order, joined by pipe |.
// See: https://github.com/altmetric/altmetric-explorer-api-client
function buildDigest(secret, filters) {
  const parts = [];
  for (const name of Object.keys(filters).sort()) {
    parts.push(name);
    const vals = filters[name];
    if (Array.isArray(vals)) vals.forEach(v => parts.push(v));
    else parts.push(vals);
  }
  const canonical = parts.join("|");
  return crypto.createHmac("sha1", secret).update(canonical).digest("hex");
}

// ── Explorer API path ─────────────────────────────────────────────────────────
// subjects = ANZSRC Fields of Research (FOR) codes, e.g. ["0401","0405"]
// Altmetric Explorer applies these at journal level — far more reliable than title keywords.
async function fetchFromExplorer(key, secret, timeframe, limit, subjects) {
  const filters = {
    affiliations: IUCA_GRID_IDS,
    timeframe,
    scope: "all",
    ...(subjects.length ? { subject: subjects } : {}),
  };
  const digest = buildDigest(secret, filters);

  const affiliationQs = IUCA_GRID_IDS.map(id => `filter[affiliations][]=${id}`).join("&");
  const subjectQs     = subjects.map(s => `filter[subject][]=${s}`).join("&");
  const qs = [
    `key=${key}`,
    affiliationQs,
    subjectQs,
    `filter[timeframe]=${timeframe}`,
    `filter[scope]=all`,
    `filter[order]=score_desc`,
    `page[size]=${Math.min(limit * 2, 100)}`,
    `include=affiliations,journals`,
    `digest=${digest}`,
  ].filter(Boolean).join("&");

  const r = await fetch(`https://www.altmetric.com/explorer/api/research_outputs?${qs}`,
    { headers: { Accept: "application/json" } });

  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Explorer ${r.status}: ${body.slice(0, 300)}`);
  }

  const data     = await r.json();
  const outputs  = data?.data     || [];
  const included = data?.included || [];

  const papers = outputs.map(item => {
    const attr     = item.attributes || {};
    const mentions = attr.mentions   || {}; // flat counts: { msm: 12, tweet: 400, ... }

    // Score — confirmed field name from debug: "altmetric-score"
    const score = Math.round(Number(attr["altmetric-score"] || 0));

    // DOI and paper URL
    const doi      = attr.identifiers?.dois?.[0] || null;
    const paperUrl = doi ? `https://doi.org/${doi}` : "#";

    // Altmetric details page — constructed from item id
    const detailsUrl = item.id ? `https://www.altmetric.com/details/${item.id}` : null;

    // Publication date — confirmed field name: "publication-date"
    const pubStr     = attr["publication-date"] || null;
    const publishedOn = pubStr ? new Date(pubStr).getTime() / 1000 : null;

    // University — match GRID IDs from relationships against our local lookup first,
    // then fall back to sideloaded affiliations if the API provides them
    const affiliationIds = item.relationships?.affiliations?.data?.map(a => a.id) || [];
    const uniName = (() => {
      for (const affId of affiliationIds) {
        if (GRID_TO_NAME[affId]) return GRID_TO_NAME[affId];
        const match = included.find(i => i.type === "affiliation" && i.id === affId);
        if (match?.attributes?.name) return match.attributes.name;
      }
      return null;
    })();

    // Journal from sideloaded journals
    const journalId  = item.relationships?.journal?.data?.id;
    const journalObj = journalId ? included.find(i => i.type === "journal" && i.id === journalId) : null;
    const journal    = journalObj?.attributes?.title || journalObj?.attributes?.name || "";

    const title = attr.title || "";

    return {
      doi,
      title,
      journal,
      score,
      publishedOn,
      university:     uniName || "IUCA Member",
      theme:          classifyTheme(title, journal),
      // Mention counts are direct integers, confirmed from debug
      newsOutlets:    mentions.msm    || 0,
      policyMentions: mentions.policy || 0,
      blogMentions:   mentions.blog   || 0,
      socialMentions: (mentions.tweet || 0) + (mentions.bluesky || 0) + (mentions.rdt || 0),
      citations:      attr.dimensions?.citations || 0,
      detailsUrl,
      paperUrl,
      topNews: [], // Individual article headlines not available via Explorer API
    };
  })
  .filter(p => p.title && p.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, limit);

  return { papers, source: "altmetric-explorer" };
}

// ── Fallback: Scopus + free Altmetric API ─────────────────────────────────────
async function fetchFromScopusFallback(scopusKey, limit) {
  const affFilter = IUCA_SCOPUS_IDS.map(id => `AF-ID(${id})`).join(" OR ");
  const query = `(${affFilter}) AND SUBJAREA(EART OR ENVI OR MULT) AND PUBYEAR > 2022`;
  const scopusUrl = `https://api.elsevier.com/content/search/scopus?` +
    `query=${encodeURIComponent(query)}&count=40&sort=citedby-count`;

  const scopusResp = await fetch(scopusUrl, {
    headers: { "X-ELS-APIKey": scopusKey, Accept: "application/json" },
  });
  if (!scopusResp.ok) throw new Error(`Scopus ${scopusResp.status}`);

  const scopusData = await scopusResp.json();
  const entries = (scopusData?.["search-results"]?.entry || [])
    .filter(e => e["prism:doi"])
    .slice(0, 30)
    .map(e => {
      const affiliations = Array.isArray(e.affiliation) ? e.affiliation : [e.affiliation].filter(Boolean);
      const matchedId = affiliations.map(a => a?.["afid"]).find(id => SCOPUS_ID_TO_NAME[id]);
      return {
        doi:       e["prism:doi"],
        title:     e["dc:title"] || "Untitled",
        journal:   e["prism:publicationName"] || "",
        published: e["prism:coverDate"] || null,
        university: SCOPUS_ID_TO_NAME[matchedId] || "IUCA Member",
      };
    });

  const altResults = await Promise.allSettled(
    entries.map(p =>
      fetch(`https://api.altmetric.com/v1/doi/${encodeURIComponent(p.doi)}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    )
  );

  const papers = entries
    .map((p, i) => {
      const alt = altResults[i].status === "fulfilled" ? altResults[i].value : null;
      if (!alt) return null;
      return {
        doi:            p.doi,
        title:          alt.title || p.title,
        journal:        alt.journal || p.journal,
        score:          Math.round(alt.score || 0),
        publishedOn:    alt.published_on || (p.published ? new Date(p.published).getTime() / 1000 : null),
        university:     p.university,
        theme:          classifyTheme(alt.title || p.title, alt.journal || p.journal),
        newsOutlets:    alt.cited_by_msm_count     || 0,
        policyMentions: alt.cited_by_policies_count || 0,
        blogMentions:   alt.cited_by_posts_count   || 0,
        socialMentions: (alt.cited_by_tweeters_count || 0) + (alt.cited_by_bluesky_count || 0),
        detailsUrl:     alt.details_url            || null,
        paperUrl:       alt.url || `https://doi.org/${p.doi}`,
        topNews:        [],
      };
    })
    .filter(p => p && p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { papers, source: "scopus+altmetric-free" };
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=86400");

  const timeframe = ["1m","3m","6m","1y","5y"].includes(req.query.timeframe)
    ? req.query.timeframe : "6m";
  const limit    = Math.min(parseInt(req.query.limit) || 25, 50);
  const subjects = req.query.subjects
    ? req.query.subjects.split(",").map(s => s.trim()).filter(Boolean)
    : ["0401","0405","0406","0501","0502","0503","0504"]; // default FOR codes for climate/environment

  const explorerKey    = process.env.ALTMETRIC_EXPLORER_KEY;
  const explorerSecret = process.env.ALTMETRIC_EXPLORER_SECRET;
  const scopusKey      = process.env.SCOPUS_API_KEY;

  try {
    let result;
    if (explorerKey && explorerSecret) {
      result = await fetchFromExplorer(explorerKey, explorerSecret, timeframe, limit, subjects);
    } else if (scopusKey) {
      result = await fetchFromScopusFallback(scopusKey, limit);
    } else {
      return res.status(500).json({ error: "No API credentials configured" });
    }

    return res.status(200).json({
      papers:    result.papers,
      total:     result.papers.length,
      fetchedAt: new Date().toISOString(),
      source:    result.source,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
