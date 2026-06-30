// api/scopus.js — Vercel serverless function
// Queries Scopus using AFFILORG("university name") — more reliable than AF-ID
// which requires institution-level access tokens.
// Mode: ?affNames=Univ A,Univ B&subjectAreas=EART,ENVI → one top paper per university

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.SCOPUS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "SCOPUS_API_KEY not configured" });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=86400");

  const { affNames } = req.query;
  if (!affNames) return res.status(400).json({ error: "Provide affNames" });

  const uniNames = affNames.split(",").map(s => s.trim()).filter(Boolean);

  const areas = (req.query.subjectAreas || "")
    .split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
  const areaClause = areas.length
    ? `SUBJAREA(${areas.join(" OR ")})`
    : `SUBJAREA(EART OR ENVI OR AGRI OR ENER OR SOCI)`;

  const scopusHeaders = { "X-ELS-APIKey": apiKey, Accept: "application/json" };
  const uniPapers = {};

  await Promise.all(uniNames.map(async (name) => {
    // AFFILORG searches the institution name field in Scopus — much more reliable
    // than AF-ID which requires knowing the exact internal institution identifier.
    const q = `AFFILORG("${name}") AND ${areaClause} AND PUBYEAR > 2021`;
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
      const papers = entries.map(e => ({
        title:     e["dc:title"] || "",
        doi:       e["prism:doi"] || "",
        year:      (e["prism:coverDate"] || "").slice(0, 4),
        citations: parseInt(e["citedby-count"] || "0"),
        url:       e["prism:doi"] ? `https://doi.org/${e["prism:doi"]}` : "",
      })).filter(p => p.title);
      if (papers.length) uniPapers[name] = papers.slice(0, 1);
    } catch (err) {
      console.error(`Scopus fetch error for "${name}":`, err.message);
    }
  }));

  return res.status(200).json({ uniPapers });
}
