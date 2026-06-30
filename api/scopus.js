// api/scopus.js — Vercel serverless function
// Queries Scopus using AFFILORG("university name") — one top paper per university per theme.
// Uses TITLE-ABS-KEY terms to differentiate themes that share the same broad SUBJAREA code.
// Sorts by citations-per-year (proxy for FWCI; true FWCI is not available via the Search API).
// Tags papers with all IUCA co-institutions found in their affiliation list.

const CURRENT_YEAR = 2026;

function citesPerYear(citations, yearStr) {
  const year = parseInt(yearStr) || CURRENT_YEAR - 1;
  const age  = Math.max(1, CURRENT_YEAR - year);
  return citations / age;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.SCOPUS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "SCOPUS_API_KEY not configured" });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=86400");

  const { affNames } = req.query;
  if (!affNames) return res.status(400).json({ error: "Provide affNames" });

  const uniNames = affNames.split(",").map(s => s.trim()).filter(Boolean);

  // SUBJAREA clause
  const areas = (req.query.subjectAreas || "")
    .split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
  const areaClause = areas.length
    ? `SUBJAREA(${areas.join(" OR ")})`
    : `SUBJAREA(EART OR ENVI OR AGRI OR ENER OR SOCI)`;

  // TITLE-ABS-KEY clause for themes that share a broad SUBJAREA (e.g. all EART themes)
  const terms = (req.query.scopusTerms || "")
    .split(",").map(s => s.trim()).filter(Boolean);
  const termClause = terms.length
    ? ` AND TITLE-ABS-KEY(${terms.map(t => `"${t}"`).join(" OR ")})`
    : "";

  const scopusHeaders = { "X-ELS-APIKey": apiKey, Accept: "application/json" };

  // Build a Set of all known IUCA university names (lowercased) for co-institution detection
  const iucaNameSet = new Set(uniNames.map(n => n.toLowerCase()));

  // Map from normalised name → display name for co-institution tagging
  const nameMap = {};
  for (const n of uniNames) nameMap[n.toLowerCase()] = n;

  // Fetch top papers for each university in parallel
  const rawResults = {}; // name → [{ title, doi, year, citations, citesPerYear, url, affiliations }]

  await Promise.all(uniNames.map(async (name) => {
    // Fetch top 5 by citation count; we re-sort by citesPerYear server-side
    const q = `AFFILORG("${name}") AND ${areaClause}${termClause} AND PUBYEAR > 2021`;
    const url = `https://api.elsevier.com/content/search/scopus?` +
      `query=${encodeURIComponent(q)}&count=5&sort=citedby-count`;
    try {
      const r = await fetch(url, { headers: scopusHeaders });
      if (!r.ok) {
        console.error(`Scopus ${r.status} for AFFILORG("${name}")`);
        return;
      }
      const data = await r.json();
      const entries = data?.["search-results"]?.entry || [];
      const papers = entries
        .filter(e => e["dc:title"])
        .map(e => {
          const year      = (e["prism:coverDate"] || "").slice(0, 4);
          const citations = parseInt(e["citedby-count"] || "0");
          // Collect affiliation names from the response
          const rawAffs = Array.isArray(e.affiliation) ? e.affiliation
            : e.affiliation ? [e.affiliation] : [];
          const affiliations = rawAffs.map(a => a?.affilname || "").filter(Boolean);
          return {
            title:         e["dc:title"] || "",
            doi:           e["prism:doi"] || "",
            year,
            citations,
            citesPerYear:  citesPerYear(citations, year),
            url:           e["prism:doi"] ? `https://doi.org/${e["prism:doi"]}` : "",
            affiliations,
          };
        });

      // Sort by citesPerYear (year-normalised citation rate) and take the best
      papers.sort((a, b) => b.citesPerYear - a.citesPerYear);
      if (papers.length) rawResults[name] = papers.slice(0, 1);
    } catch (err) {
      console.error(`Scopus fetch error for "${name}":`, err.message);
    }
  }));

  // Cross-tag co-institutions: for each paper, detect other IUCA universities in its affiliations
  // AND detect when the same DOI appears under multiple universities (multi-institution co-authorship)
  const doiToUnis = {}; // doi → [uniName]
  for (const [uniName, papers] of Object.entries(rawResults)) {
    for (const p of papers) {
      if (p.doi) {
        if (!doiToUnis[p.doi]) doiToUnis[p.doi] = [];
        doiToUnis[p.doi].push(uniName);
      }
    }
  }

  const uniPapers = {};
  for (const [uniName, papers] of Object.entries(rawResults)) {
    const paper = papers[0];

    // Detect co-institutions from the affiliation list in the API response
    const coFromAffil = paper.affiliations
      .map(a => {
        const lower = a.toLowerCase();
        // Check exact match or substring match against known IUCA names
        for (const knownLower of iucaNameSet) {
          if (lower.includes(knownLower) || knownLower.includes(lower.split(" ")[0])) {
            return nameMap[knownLower];
          }
        }
        return null;
      })
      .filter(n => n && n !== uniName);

    // Also collect any other universities that independently returned the same paper
    const coFromDoi = paper.doi
      ? (doiToUnis[paper.doi] || []).filter(n => n !== uniName)
      : [];

    // Deduplicate co-institutions
    const coSet = new Set([...coFromAffil, ...coFromDoi]);

    uniPapers[uniName] = [{
      title:        paper.title,
      doi:          paper.doi,
      year:         paper.year,
      citations:    paper.citations,
      citesPerYear: Math.round(paper.citesPerYear * 10) / 10,
      url:          paper.url,
      coInstitutions: [...coSet],
    }];
  }

  return res.status(200).json({ uniPapers });
}
