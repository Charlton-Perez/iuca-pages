// api/scopus.js — Vercel serverless function
// Uses paper titles (authkeywords not available on this API tier).
// Modes:
//   /api/scopus?affId=XXX           — per-university topic fetch
//   /api/scopus?themeQuery=...&affIds=A,B,C  — theme-level title fetch

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.SCOPUS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "SCOPUS_API_KEY not configured" });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=86400");

  const { affId, themeQuery, affIds } = req.query;

  const scopusHeaders = { "X-ELS-APIKey": apiKey, Accept: "application/json" };

  try {
    // ── Mode 1: single university — top cited papers for keyword topics ───────
    if (affId) {
      const query = `AF-ID(${affId}) AND SUBJAREA(EART OR ENVI OR MULT OR AGRI) AND PUBYEAR > 2018`;
      const url = `https://api.elsevier.com/content/search/scopus?` +
        `query=${encodeURIComponent(query)}&count=50&sort=citedby-count`;
      const r = await fetch(url, { headers: scopusHeaders });
      if (!r.ok) return res.status(r.status).json({ error: `Scopus ${r.status}` });
      const data = await r.json();
      const entries = data?.["search-results"]?.entry || [];
      const totalResults = parseInt(data?.["search-results"]?.["opensearch:totalResults"] || "0");

      // Extract topic signals from titles
      const titles = entries.map(e => e["dc:title"]).filter(Boolean);
      return res.status(200).json({ titles, paperCount: totalResults });
    }

    // ── Mode 2: theme-level fetch using ASJC codes + optional keyword refinement ─
    if (affIds) {
      const uniIds = affIds.split(",").filter(Boolean);

      // Build subject clause using Scopus SUBJAREA abbreviations (EART, ENVI, AGRI, ENER, SOCI)
      // plus optional TITLE-ABS-KEY keywords to differentiate themes within a broad subject area.
      const areas = (req.query.subjectAreas || "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
      const rawKeywords = req.query.keywords ? decodeURIComponent(req.query.keywords) : null;

      let subjectClause;
      if (areas.length) {
        subjectClause = `SUBJAREA(${areas.join(" OR ")})`;
        if (rawKeywords) subjectClause += ` AND TITLE-ABS-KEY(${rawKeywords})`;
      } else if (rawKeywords) {
        subjectClause = `TITLE-ABS-KEY(${rawKeywords})`;
      } else {
        return res.status(400).json({ error: "Provide subjectAreas or keywords" });
      }

      const uniPapers = {};
      await Promise.all(uniIds.map(async (id) => {
        const q = `AF-ID(${id}) AND ${subjectClause} AND PUBYEAR > 2019`;
        const url = `https://api.elsevier.com/content/search/scopus?` +
          `query=${encodeURIComponent(q)}&count=10&sort=citedby-count`;
        try {
          const r = await fetch(url, { headers: scopusHeaders });
          if (!r.ok) return;
          const data = await r.json();
          const entries = data?.["search-results"]?.entry || [];
          const papers = entries.map(e => ({
            title:     e["dc:title"] || "",
            doi:       e["prism:doi"] || "",
            year:      (e["prism:coverDate"] || "").slice(0, 4),
            citations: parseInt(e["citedby-count"] || "0"),
            url:       e["prism:doi"] ? `https://doi.org/${e["prism:doi"]}` : "",
          })).filter(p => p.title);
          if (papers.length) uniPapers[id] = papers.slice(0, 4);
        } catch {}
      }));

      return res.status(200).json({ uniPapers });
    }

    return res.status(400).json({ error: "Provide affId or affIds+asjcCodes" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
