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

      // SUBJAREA only — no keyword filter. Keywords were too restrictive and
      // excluded legitimate papers that don't use specific terminology in title/abstract.
      // Scopus journal-level classification is the right discriminator.
      const areas = (req.query.subjectAreas || "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
      if (!areas.length) return res.status(400).json({ error: "Provide subjectAreas" });

      const subjectClause = `SUBJAREA(${areas.join(" OR ")})`;

      const uniPapers = {};
      await Promise.all(uniIds.map(async (id) => {
        const q = `AF-ID(${id}) AND ${subjectClause} AND PUBYEAR > 2021`;
        // No &field= param — let Scopus return its default fields. Adding custom
        // field lists (especially fwci) can cause 4xx errors on some API tiers
        // and silently empties results when we catch !r.ok.
        const url = `https://api.elsevier.com/content/search/scopus?` +
          `query=${encodeURIComponent(q)}&count=10&sort=citedby-count`;
        try {
          const r = await fetch(url, { headers: scopusHeaders });
          if (!r.ok) {
            console.error(`Scopus ${r.status} for AF-ID(${id}):`, await r.text().catch(() => ""));
            return;
          }
          const data = await r.json();
          const entries = data?.["search-results"]?.entry || [];
          const papers = entries.map(e => ({
            title:     e["dc:title"] || "",
            doi:       e["prism:doi"] || "",
            year:      (e["prism:coverDate"] || "").slice(0, 4),
            citations: parseInt(e["citedby-count"] || "0"),
            fwci:      parseFloat(e["fwci"]) || null,
            url:       e["prism:doi"] ? `https://doi.org/${e["prism:doi"]}` : "",
          })).filter(p => p.title);
          // Sort by fwci if the API happens to return it, otherwise raw citations
          papers.sort((a, b) => (b.fwci ?? -1) - (a.fwci ?? -1) || b.citations - a.citations);
          if (papers.length) uniPapers[id] = papers.slice(0, 1);
        } catch {}
      }));

      return res.status(200).json({ uniPapers });
    }

    return res.status(400).json({ error: "Provide affId or affIds+asjcCodes" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
