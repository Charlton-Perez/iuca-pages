// api/topics.js — Vercel serverless function
// Aggregates top climate papers across all IUCA universities,
// enriches with SciVal topic clusters + FWCI, and returns the
// most prominent topic clusters with their IUCA papers.
//
// Cached 24 hours at Vercel CDN — the first hit per day is slow
// (~5-10s) but all subsequent requests are instant.

import { UNIVERSITIES } from '../src/data.js';

const CURRENT_YEAR = 2026;

async function fetchSciValBatch(ids, apiKey) {
  if (!ids.length) return {};
  const url = `https://api.elsevier.com/analytics/scival/publication/metrics` +
    `?metricTypes=FieldWeightedCitationImpact&publicationIds=${ids.join(',')}`;
  try {
    const r = await fetch(url, { headers: { 'X-ELS-APIKey': apiKey, Accept: 'application/json' } });
    if (!r.ok) { console.error(`SciVal ${r.status}`); return {}; }
    const data = await r.json();
    const out = {};
    for (const item of data.results || []) {
      const pub = item.publication || {};
      const id  = String(pub.id || '');
      if (!id) continue;
      const byYear = item.metrics?.[0]?.valueByYear || {};
      const fwci   = Object.keys(byYear).sort((a, b) => b - a)
        .map(y => byYear[y]).find(v => v !== null) ?? null;
      out[id] = {
        fwci:             fwci,
        topicClusterId:   pub.topicClusterId   || null,
        topicClusterName: pub.topicClusterName || '',
      };
    }
    return out;
  } catch (err) {
    console.error('SciVal batch error:', err.message);
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400');

  const apiKey = process.env.SCOPUS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'SCOPUS_API_KEY not configured' });

  // Allow the frontend to pass a custom university list (Scopus IDs)
  const requestedIds = req.query.scopusIds
    ? req.query.scopusIds.split(',').filter(Boolean)
    : UNIVERSITIES.map(u => u.scopusId);

  const uniMeta = Object.fromEntries(
    UNIVERSITIES.map(u => [u.scopusId, { name: u.name, flag: u.flag }])
  );
  const scopusHeaders = { 'X-ELS-APIKey': apiKey, Accept: 'application/json' };

  // ── Step 1: Fetch top 25 climate papers per university (all in parallel) ───
  const papersByUni = {}; // scopusId → [{ eid, doi, title, journal, year, citations }]

  await Promise.all(requestedIds.map(async (sid) => {
    const q = `AF-ID(${sid}) AND SUBJAREA(EART OR ENVI OR AGRI OR ENER OR SOCI) AND PUBYEAR > 2019`;
    const url = `https://api.elsevier.com/content/search/scopus?` +
      `query=${encodeURIComponent(q)}&count=25&sort=citedby-count`;
    try {
      const r = await fetch(url, { headers: scopusHeaders });
      if (!r.ok) { console.error(`Scopus ${r.status} for AF-ID(${sid})`); return; }
      const data = await r.json();
      const entries = data?.['search-results']?.entry || [];
      papersByUni[sid] = entries
        .filter(e => e['dc:title'])
        .map(e => ({
          eid:       (e.eid || '').replace('2-s2.0-', ''),
          doi:       e['prism:doi'] || '',
          title:     e['dc:title']  || '',
          journal:   e['prism:publicationName'] || '',
          year:      (e['prism:coverDate'] || '').slice(0, 4),
          citations: parseInt(e['citedby-count'] || '0'),
        }));
    } catch (err) {
      console.error(`Scopus fetch error for AF-ID(${sid}):`, err.message);
    }
  }));

  // ── Step 2: Batch SciVal enrichment (parallelise up to 5 chunks at once) ──
  const allEids = [...new Set(
    Object.values(papersByUni).flat().map(p => p.eid).filter(Boolean)
  )];

  const CHUNK_SIZE = 25;
  const MAX_PARALLEL = 5;
  const svData = {};

  for (let i = 0; i < allEids.length; i += CHUNK_SIZE * MAX_PARALLEL) {
    const batchPromises = [];
    for (let j = 0; j < MAX_PARALLEL; j++) {
      const start = i + j * CHUNK_SIZE;
      if (start >= allEids.length) break;
      batchPromises.push(fetchSciValBatch(allEids.slice(start, start + CHUNK_SIZE), apiKey));
    }
    const results = await Promise.all(batchPromises);
    results.forEach(r => Object.assign(svData, r));
  }

  // ── Step 3: Group papers by topic cluster ──────────────────────────────────
  // Each cluster entry tracks which IUCA universities have papers in it.
  const clusterMap = {};

  for (const [sid, papers] of Object.entries(papersByUni)) {
    const meta = uniMeta[sid] || { name: sid, flag: '🌍' };
    for (const p of papers) {
      if (!p.eid) continue;
      const sv = svData[p.eid];
      if (!sv?.topicClusterId) continue;

      const cid = sv.topicClusterId;
      if (!clusterMap[cid]) {
        clusterMap[cid] = { id: cid, name: sv.topicClusterName, doiMap: {} };
      }

      const key = p.doi || p.eid;
      if (!clusterMap[cid].doiMap[key]) {
        clusterMap[cid].doiMap[key] = {
          title:    p.title,
          doi:      p.doi,
          url:      p.doi ? `https://doi.org/${p.doi}` : '',
          year:     p.year,
          journal:  p.journal,
          fwci:     sv.fwci !== null ? Math.round(sv.fwci * 100) / 100 : null,
          unis:     [],
        };
      }
      const entry = clusterMap[cid].doiMap[key];
      if (!entry.unis.some(u => u.name === meta.name)) {
        entry.unis.push({ name: meta.name, flag: meta.flag });
      }
    }
  }

  // ── Step 4: Rank clusters and papers ──────────────────────────────────────
  const clusters = Object.values(clusterMap)
    .map(c => {
      const papers = Object.values(c.doiMap)
        .sort((a, b) => (b.fwci ?? 0) - (a.fwci ?? 0))
        .slice(0, 5);

      // Prominence score: distinct universities × best FWCI
      const distinctUnis = new Set(papers.flatMap(p => p.unis.map(u => u.name))).size;
      const bestFwci     = papers[0]?.fwci ?? 0;
      const score        = distinctUnis * (bestFwci || 1);

      return { id: c.id, name: c.name, papers, uniCount: distinctUnis, score };
    })
    .filter(c => c.papers.length > 0 && c.uniCount >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);

  return res.status(200).json({ clusters, updatedAt: new Date().toISOString() });
}
