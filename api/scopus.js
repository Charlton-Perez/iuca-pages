// api/scopus.js — Vercel serverless function
// Mode: ?affIds=A,B,C&subjectAreas=EART,ENVI → one top paper per university
// Falls back to broad climate SUBJAREA if subjectAreas not supplied.

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.SCOPUS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "SCOPUS_API_KEY not configured" });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=86400");

  const { affIds } = req.query;
  if (!affIds) return res.status(400).json({ error: "Provide affIds" });

  const uniIds = affIds.split(",").map(s => s.trim()).filter(Boolean);

  // Use whatever subject areas are passed, or fall back to a broad climate/env default.
  // This default ensures we always return something even if the KV-stored theme config
  // is missing subjectAreas.
  const areas = (req.query.subjectAreas || "")
    .split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
  const areaClause = areas.length
    ? `SUBJAREA(${areas.join(" OR ")})`
    : `SUBJAREA(EART OR ENVI OR AGRI OR ENER OR SOCI)`;

  const scopusHeaders = { "X-ELS-APIKey": apiKey, Accept: "application/json" };
  const uniPapers = {};

  await Promise.all(uniIds.map(async (id) => {
    const q = `AF-ID(${id}) AND ${areaClause} AND PUBYEAR > 2021`;
    const url = `https://api.elsevier.com/content/search/scopus?` +
      `query=${encodeURIComponent(q)}&count=5&sort=citedby-count`;
    try {
      const r = await fetch(url, { headers: scopusHeaders });
      if (!r.ok) {
        console.error(`Scopus ${r.status} for AF-ID(${id}) q=${q}`);
        return;
      }
      const data = await r.json();
      const entries = data?.["search-results"]?.entry || [];
      const papers = entries.map(e => ({
        title:     e["dc:title"] || "",
        doi:       e["prism:doi"] || "",
        year:      (e["prism:coverDate"] || "").slice(0, 4),
        citations: parseInt(e["citedby-count"] || "0"),
        url:       e["prism:doi"] ? `https://doi.org/${e["prism:doi"]}` : "",
      })).filter(p => p.title);
      if (papers.length) uniPapers[id] = papers.slice(0, 1);
    } catch (err) {
      console.error(`Scopus fetch error for AF-ID(${id}):`, err.message);
    }
  }));

  return res.status(200).json({ uniPapers });
}
