// api/scopus.js — Vercel serverless function
// Discovery: Scopus Search API (top 25 papers per university, broad SUBJAREA)
// Enrichment: SciVal API (FWCI + topic name per paper)
// Classification: topicName keyword matching → IUCA theme
// Ranking: sorted by field-weighted citation impact (FWCI)

const CURRENT_YEAR = 2026;

// Keywords matched (lowercased) against SciVal topicName + topicClusterName.
// First match wins, so order defines priority.
const THEME_KEYWORDS = {
  atmosphere:  [
    'atmospheric science', 'aerosol', 'meteorol', 'troposphere', 'stratosphere',
    'ozone', 'contrail', 'atmospheric layer', 'atmospheric dynamic',
    'weather prediction', 'numerical weather', 'general circulation model',
    'monsoon', 'jet stream', 'atmospheric radiation', 'atmospheric chemistry',
    'precipitation dynamics', 'climate model', 'cloud microphysic',
    'atmospheric aerosol', 'atmospheric boundary',
  ],
  oceans:      [
    'oceanograph', 'ocean circulation', 'ocean heat', 'ocean acidif',
    'sea level', 'thermohaline', 'atlantic meridional', 'amoc',
    'upwelling', 'tidal', 'marine biogeochemistry', 'deep ocean',
    'ocean carbon', 'coastal ocean', 'pacific ocean', 'indian ocean',
    'atlantic ocean', 'southern ocean', 'ocean temperature', 'sea surface',
  ],
  cryosphere:  [
    'ice sheet', 'glacier', 'permafrost', 'sea ice', 'cryosphere',
    'snow cover', 'frozen ground', 'polar ice', 'arctic ice',
    'greenland ice', 'antarctic ice', 'ice mass', 'glacial',
    'ice core', 'frozen soil', 'thaw', 'tundra carbon',
  ],
  extremes:    [
    'extreme event', 'extreme weather', 'flood', 'drought', 'wildfire',
    'hurricane', 'cyclone', 'heatwave', 'heat wave', 'natural disaster',
    'storm surge', 'heat stress', 'compound event', 'disaster risk',
    'fire weather', 'tropical storm', 'atmospheric river',
  ],
  ecosystems:  [
    'ecosystem', 'biodiversity', 'terrestrial carbon', 'forest carbon',
    'wetland', 'vegetation', 'carbon dynamics', 'biome', 'habitat',
    'land cover change', 'coral reef', 'plant trait', 'functional trait',
    'carbon cycle', 'terrestrial ecosystem', 'soil carbon dynamics',
  ],
  society:     [
    'adaptation', 'vulnerability', 'health impact', 'social', 'urban heat',
    'climate justice', 'climate policy', 'climate governance', 'migration',
    'indigenous', 'community resilience', 'climate risk perception',
    'health risk', 'climate change adaptation',
  ],
  mitigation:  [
    'renewable energy', 'carbon capture', 'decarbonization', 'net zero',
    'solar energy', 'wind energy', 'energy transition', 'battery storage',
    'greenhouse gas mitigation', 'emission reduction', 'low carbon',
    'carbon sequestration technology', 'carbon offsetting',
  ],
  food:        [
    'food security', 'agriculture', 'crop yield', 'soil fertility',
    'land use change', 'water resource', 'irrigation', 'livestock',
    'agroecosystem', 'food system', 'food production', 'aquaculture',
    'agricultural productivity', 'groundwater',
  ],
};

// Map a SciVal topic+cluster string to the first matching IUCA theme
function topicToTheme(topicName = '', topicClusterName = '') {
  const text = `${topicName} ${topicClusterName}`.toLowerCase();
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (keywords.some(k => text.includes(k))) return theme;
  }
  return null;
}

// Strip "2-s2.0-" prefix from Scopus EIDs to get numeric ID for SciVal
function scopusIdFromEid(eid = '') {
  return eid.replace(/^2-s2\.0-/, '');
}

// Fetch FWCI + topic from SciVal for a list of Scopus IDs (chunked to ≤25)
async function fetchSciValData(scopusIds, apiKey) {
  const CHUNK = 25;
  const results = {};
  const headers = { 'X-ELS-APIKey': apiKey, Accept: 'application/json' };

  for (let i = 0; i < scopusIds.length; i += CHUNK) {
    const chunk = scopusIds.slice(i, i + CHUNK);
    const url = `https://api.elsevier.com/analytics/scival/publication/metrics` +
      `?metricTypes=FieldWeightedCitationImpact&publicationIds=${chunk.join(',')}`;
    try {
      const r = await fetch(url, { headers });
      if (!r.ok) { console.error(`SciVal ${r.status} for chunk starting ${i}`); continue; }
      const data = await r.json();
      for (const item of data.results || []) {
        const pub = item.publication || {};
        const id  = String(pub.id || '');
        if (!id) continue;

        // Most recent non-null FWCI across all reported years
        const byYear = item.metrics?.[0]?.valueByYear || {};
        const fwci   = Object.keys(byYear)
          .sort((a, b) => b - a)
          .map(y => byYear[y])
          .find(v => v !== null) ?? 0;

        results[id] = {
          fwci,
          topicName:        pub.topicName        || '',
          topicClusterName: pub.topicClusterName || '',
          theme:            topicToTheme(pub.topicName, pub.topicClusterName),
        };
      }
    } catch (err) {
      console.error('SciVal batch error:', err.message);
    }
  }
  return results;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.SCOPUS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'SCOPUS_API_KEY not configured' });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400');

  const { affNames, themeId } = req.query;
  if (!affNames)                          return res.status(400).json({ error: 'Provide affNames' });
  if (!themeId || !THEME_KEYWORDS[themeId]) return res.status(400).json({ error: 'Provide valid themeId' });

  const uniNames     = affNames.split(',').map(s => s.trim()).filter(Boolean);
  const scopusHeaders = { 'X-ELS-APIKey': apiKey, Accept: 'application/json' };
  const iucaNameSet   = new Set(uniNames.map(n => n.toLowerCase()));
  const nameMap       = Object.fromEntries(uniNames.map(n => [n.toLowerCase(), n]));

  // ── Step 1: Scopus search — top 25 climate papers per university ──────────
  const rawByUni = {};
  await Promise.all(uniNames.map(async (name) => {
    const q = `AFFILORG("${name}") AND SUBJAREA(EART OR ENVI OR AGRI OR ENER OR SOCI) AND PUBYEAR > 2019`;
    const url = `https://api.elsevier.com/content/search/scopus?` +
      `query=${encodeURIComponent(q)}&count=25&sort=citedby-count`;
    try {
      const r = await fetch(url, { headers: scopusHeaders });
      if (!r.ok) { console.error(`Scopus ${r.status} for "${name}" theme=${themeId}`); return; }
      const data    = await r.json();
      const entries = data?.['search-results']?.entry || [];

      rawByUni[name] = entries
        .filter(e => e['dc:title'])
        .map(e => {
          const rawAffs = Array.isArray(e.affiliation) ? e.affiliation
                        : e.affiliation ? [e.affiliation] : [];
          return {
            title:        e['dc:title'] || '',
            doi:          e['prism:doi'] || '',
            year:         (e['prism:coverDate'] || '').slice(0, 4),
            citations:    parseInt(e['citedby-count'] || '0'),
            url:          e['prism:doi'] ? `https://doi.org/${e['prism:doi']}` : '',
            scopusId:     scopusIdFromEid(e.eid || ''),
            affiliations: rawAffs.map(a => a?.affilname || '').filter(Boolean),
          };
        });
    } catch (err) {
      console.error(`Scopus error for "${name}":`, err.message);
    }
  }));

  // ── Step 2: SciVal enrichment — FWCI + topic for all unique papers ────────
  const allScopusIds = [...new Set(
    Object.values(rawByUni).flat().map(p => p.scopusId).filter(Boolean),
  )];
  const sciValData = await fetchSciValData(allScopusIds, apiKey);

  // ── Step 3: Cross-DOI map for co-institution detection ────────────────────
  const doiToUnis = {};
  for (const [uniName, papers] of Object.entries(rawByUni)) {
    for (const p of papers) {
      if (p.doi && sciValData[p.scopusId]?.theme === themeId) {
        if (!doiToUnis[p.doi]) doiToUnis[p.doi] = [];
        doiToUnis[p.doi].push(uniName);
      }
    }
  }

  // ── Step 4: Build per-university output ───────────────────────────────────
  const uniPapers = {};
  for (const [name, papers] of Object.entries(rawByUni)) {
    // Keep only papers that SciVal assigns to this theme; sort by FWCI
    const themePapers = papers
      .filter(p => sciValData[p.scopusId]?.theme === themeId)
      .map(p => {
        const sv = sciValData[p.scopusId] || {};
        return { ...p, fwci: sv.fwci || 0, topicName: sv.topicName || '' };
      })
      .sort((a, b) => b.fwci - a.fwci);

    if (!themePapers.length) continue;
    const paper = themePapers[0];

    // Detect IUCA co-institutions from affiliation strings (Scopus returns 2–3)
    const coFromAffil = paper.affiliations
      .map(a => {
        const lower = a.toLowerCase();
        for (const kl of iucaNameSet) {
          if (lower.includes(kl) || kl.includes(lower.split(' ')[0])) return nameMap[kl];
        }
        return null;
      })
      .filter(n => n && n !== name);

    const coFromDoi = paper.doi ? (doiToUnis[paper.doi] || []).filter(n => n !== name) : [];
    const coSet     = new Set([...coFromAffil, ...coFromDoi]);

    const age = Math.max(1, CURRENT_YEAR - parseInt(paper.year || CURRENT_YEAR - 1));
    uniPapers[name] = [{
      title:          paper.title,
      doi:            paper.doi,
      year:           paper.year,
      citations:      paper.citations,
      fwci:           Math.round(paper.fwci * 100) / 100,
      citesPerYear:   Math.round(paper.citations / age * 10) / 10,
      url:            paper.url,
      topicName:      paper.topicName,
      coInstitutions: [...coSet],
    }];
  }

  return res.status(200).json({ uniPapers });
}
