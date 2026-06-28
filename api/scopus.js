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

    // ── Mode 2: theme-level fetch — titles per uni for a given theme ──────────
    if (themeQuery && affIds) {
      const uniIds = affIds.split(",").filter(Boolean);

      // Query all universities in batches of 10 to avoid hammering the Scopus rate limit
      const BATCH = 10;
      const uniTitles = {};
      for (let i = 0; i < uniIds.length; i += BATCH) {
        const batch = uniIds.slice(i, i + BATCH);
        await Promise.all(batch.map(async (id) => {
          const q = `AF-ID(${id}) AND TITLE-ABS-KEY(${decodeURIComponent(themeQuery)}) AND PUBYEAR > 2019`;
          const url = `https://api.elsevier.com/content/search/scopus?` +
            `query=${encodeURIComponent(q)}&count=20&sort=citedby-count`;
          try {
            const r = await fetch(url, { headers: scopusHeaders });
            if (!r.ok) return;
            const data = await r.json();
            const entries = data?.["search-results"]?.entry || [];
            const titles = entries.map(e => e["dc:title"]).filter(Boolean);
            if (titles.length) uniTitles[id] = titles.slice(0, 8);
          } catch {}
        }));
      }

      return res.status(200).json({ uniTitles });
    }

    return res.status(400).json({ error: "Provide affId or themeQuery+affIds" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
