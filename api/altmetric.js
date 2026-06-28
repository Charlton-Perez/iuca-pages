// api/altmetric.js — Vercel serverless function
// Strategy:
//   1. Scopus API → top cited recent papers from IUCA universities (we have a key)
//   2. Free Altmetric API (api.altmetric.com/v1/doi/:doi) → score + attention per paper
//   No Altmetric Explorer subscription required.

const IUCA_SCOPUS_IDS = [
  "60006462","60023256","60025259","60003093","60001809","60022452","60003596","60020422",
  "60071311","60028186","60028717","60002026","60007882","60031004","60031226","60031229",
  "60031244","60071417","60074798","60008712","60025272","60015498","60017001","60006951",
  "60007776","60021773","60075336","60018043","60014099","60003066","60003984","60003978",
  "60003980","60070377","60004028",
];

const SCOPUS_ID_TO_NAME = {
  "60006462": "University of Reading",
  "60023256": "University of Oxford",
  "60025259": "University of Cambridge",
  "60003093": "University of Edinburgh",
  "60001809": "University of Exeter",
  "60022452": "University of Leeds",
  "60003596": "King's College London",
  "60020422": "University of Sussex",
  "60071311": "Sorbonne Université",
  "60028186": "ETH Zurich",
  "60028717": "University of Zurich",
  "60002026": "University of Helsinki",
  "60007882": "University of Bremen",
  "60031004": "UNSW Sydney",
  "60031226": "University of Melbourne",
  "60031229": "Monash University",
  "60031244": "University of Tasmania",
  "60071417": "National University of Singapore",
  "60074798": "Chinese University of Hong Kong",
  "60008712": "University of Hong Kong",
  "60025272": "Hokkaido University",
  "60015498": "Nanjing University",
  "60017001": "China University of Geosciences",
  "60006951": "California Inst. of Technology",
  "60007776": "Cornell University",
  "60021773": "Yale University",
  "60075336": "New York University",
  "60018043": "University of Colorado Boulder",
  "60014099": "McGill University",
  "60003066": "University of São Paulo",
  "60003984": "University of Nairobi",
  "60003978": "University of Ghana",
  "60003980": "University of Cape Town",
  "60070377": "TERI School of Advanced Studies",
  "60004028": "University of the South Pacific",
};

const THEME_KEYWORDS = {
  "Atmosphere & Weather":   ["forecast","atmospheric","weather","precipitation","aerosol","jet stream","air quality","monsoon"],
  "Oceans & Sea Level":     ["ocean","sea level","marine","coastal","coral","salinity","thermohaline","tidal"],
  "Cryosphere":             ["glacier","ice sheet","permafrost","arctic","sea ice","snow","cryosphere","polar"],
  "Ecosystems":             ["biodiversity","ecosystem","forest","deforestation","wetland","peatland","species","habitat"],
  "Society & Health":       ["adaptation","health","mortality","equity","justice","migration","urban","community"],
  "Mitigation & Energy":    ["mitigation","renewable","carbon capture","net zero","decarbonisation","solar","emissions"],
  "Food & Water":           ["food","agriculture","drought","water","irrigation","crop","agroecology","groundwater"],
  "Extreme Events":         ["extreme","heatwave","flood","wildfire","cyclone","attribution","disaster","compound"],
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

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const scopusKey = process.env.SCOPUS_API_KEY;
  if (!scopusKey) return res.status(500).json({ error: "SCOPUS_API_KEY not configured" });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=86400"); // 24h cache

  try {
    // ── Step 1: Scopus — top cited climate papers from IUCA unis, last 2 years ──
    const affFilter = IUCA_SCOPUS_IDS.map(id => `AF-ID(${id})`).join(" OR ");
    const query = `(${affFilter}) AND SUBJAREA(EART OR ENVI OR MULT) AND PUBYEAR > 2022`;
    const scopusUrl = `https://api.elsevier.com/content/search/scopus?` +
      `query=${encodeURIComponent(query)}&count=40&sort=citedby-count`;

    const scopusResp = await fetch(scopusUrl, {
      headers: { "X-ELS-APIKey": scopusKey, Accept: "application/json" },
    });
    if (!scopusResp.ok) throw new Error(`Scopus ${scopusResp.status}`);

    const scopusData = await scopusResp.json();
    const entries = scopusData?.["search-results"]?.entry || [];

    // Extract DOIs and basic metadata
    const papers = entries
      .filter(e => e["prism:doi"])
      .map(e => {
        // Find which IUCA university this paper belongs to
        const affiliations = Array.isArray(e.affiliation) ? e.affiliation : [e.affiliation].filter(Boolean);
        const matchedId = affiliations
          .map(a => a?.["afid"])
          .find(id => SCOPUS_ID_TO_NAME[id]);

        return {
          doi:       e["prism:doi"],
          title:     e["dc:title"] || "Untitled",
          journal:   e["prism:publicationName"] || "",
          published: e["prism:coverDate"] || null,
          university: SCOPUS_ID_TO_NAME[matchedId] || "IUCA Member",
          citations: parseInt(e["citedby-count"] || "0"),
        };
      })
      .slice(0, 30);

    // ── Step 2: Free Altmetric API — fetch scores in parallel ─────────────────
    const altmetricResults = await Promise.allSettled(
      papers.map(async p => {
        const url = `https://api.altmetric.com/v1/doi/${encodeURIComponent(p.doi)}`;
        const r = await fetch(url, { headers: { Accept: "application/json" } });
        if (r.status === 404) return null; // paper not tracked by Altmetric
        if (!r.ok) return null;
        return r.json();
      })
    );

    // ── Step 3: Merge and sort by Altmetric score ─────────────────────────────
    const enriched = papers
      .map((p, i) => {
        const alt = altmetricResults[i].status === "fulfilled" ? altmetricResults[i].value : null;
        if (!alt) return null;

        const topNews = Object.entries(alt.feeds || {})
          .filter(([, v]) => v?.posts?.length)
          .flatMap(([, v]) => v.posts)
          .filter(post => post.title)
          .slice(0, 3)
          .map(post => ({ outlet: post.author || post.source || "News", title: post.title }));

        return {
          doi:            p.doi,
          title:          alt.title || p.title,
          journal:        alt.journal || p.journal,
          score:          Math.round(alt.score || 0),
          publishedOn:    alt.published_on || (p.published ? new Date(p.published).getTime() / 1000 : null),
          university:     p.university,
          theme:          classifyTheme(alt.title || p.title, alt.journal || p.journal),
          newsOutlets:    alt.cited_by_msm_count    || 0,
          policyMentions: alt.cited_by_policies_count || 0,
          blogMentions:   alt.cited_by_posts_count  || 0,
          socialMentions: (alt.cited_by_tweeters_count || 0) + (alt.cited_by_bluesky_count || 0),
          detailsUrl:     alt.details_url           || null,
          paperUrl:       alt.url || `https://doi.org/${p.doi}`,
          topNews,
        };
      })
      .filter(p => p && p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return res.status(200).json({
      papers: enriched,
      total: enriched.length,
      fetchedAt: new Date().toISOString(),
      source: "scopus+altmetric-free",
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
