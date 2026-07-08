// api/topics.js — Vercel serverless function
// Aggregates top climate papers across all IUCA universities,
// enriches with SciVal topic clusters + FWCI, and returns the
// most prominent topic clusters with their IUCA papers.
//
// Caching strategy:
//   1. Serve from Vercel KV if cached < 24 hours old (instant)
//   2. If stale/missing: compute fresh, store to KV, return result
//   3. CDN s-maxage=300 as a secondary cache layer
//
// First request of the day may take 10-20s; all subsequent are instant.

import { UNIVERSITIES } from '../src/data.js';
import { kv as _kv } from '@vercel/kv';
import { TOPICS_SNAPSHOT } from '../src/topics-snapshot.js';
import { CLIMATE_AREAS, CLUSTER_TO_AREA } from '../src/climate-areas.js';

// kv is null if KV_REST_API_URL is not configured — compute and return without caching
let kv = null;
try { kv = _kv; } catch {}

const KV_KEY   = 'topics_cache';
const KV_TTL_S = 86400; // 24 hours

// Allow up to 60s — the fresh compute makes ~40 throttled Elsevier calls
export const config = { maxDuration: 60 };

const sleep = ms => new Promise(r => setTimeout(r, ms));

// SciVal entitlement is IP-based; an Elsevier insttoken lifts that restriction
export function elsevierHeaders(apiKey) {
  const h = { 'X-ELS-APIKey': apiKey, Accept: 'application/json' };
  if (process.env.ELSEVIER_INST_TOKEN) h['X-ELS-Insttoken'] = process.env.ELSEVIER_INST_TOKEN;
  return h;
}

// Elsevier throttles concurrent requests hard (429 RATE_LIMIT_EXCEEDED),
// so retry with backoff on 429 rather than failing the whole university.
async function fetchWithRetry(url, headers, tries = 4) {
  for (let attempt = 0; attempt < tries; attempt++) {
    const r = await fetch(url, { headers });
    if (r.status !== 429) return r;
    await sleep(500 * 2 ** attempt);
  }
  return fetch(url, { headers });
}

// Run tasks with limited concurrency — Elsevier rejects bursts of parallel calls
async function pool(items, limit, worker) {
  const queue = [...items.entries()];
  await Promise.all(Array.from({ length: limit }, async () => {
    while (queue.length) {
      const [i, item] = queue.shift();
      await worker(item, i);
    }
  }));
}

async function fetchSciValBatch(ids, apiKey, debug) {
  if (!ids.length) return {};
  const url = `https://api.elsevier.com/analytics/scival/publication/metrics` +
    `?metricTypes=FieldWeightedCitationImpact&publicationIds=${ids.join(',')}`;
  try {
    const r = await fetchWithRetry(url, elsevierHeaders(apiKey));
    if (!r.ok) { debug.push(`SciVal ${r.status}: ${(await r.text()).slice(0, 200)}`); return {}; }
    const data = await r.json();
    const out  = {};
    for (const item of data.results || []) {
      const pub = item.publication || {};
      const id  = String(pub.id || '');
      if (!id) continue;
      const byYear = item.metrics?.[0]?.valueByYear || {};
      const fwci   = Object.keys(byYear).sort((a, b) => b - a)
        .map(y => byYear[y]).find(v => v !== null) ?? null;
      out[id] = {
        fwci,
        topicClusterId:   pub.topicClusterId   || null,
        topicClusterName: pub.topicClusterName || '',
      };
    }
    return out;
  } catch (err) {
    debug.push(`SciVal batch error: ${err.message}`);
    return {};
  }
}

export async function computeTopics(universities, apiKey, debug) {
  const uniMeta     = Object.fromEntries(universities.map(u => [u.name, { name: u.name, flag: u.flag }]));
  const scopusHdrs  = elsevierHeaders(apiKey);

  // ── Fetch top 25 climate papers per university (all in parallel) ────────────
  // Use AFFILORG("name") — AF-ID values in data.js are SciVal institution IDs,
  // not Scopus affiliation IDs, so AF-ID() would return wrong results.
  const papersByUni = {};
  await pool(universities, 3, async (uni) => {
    const q = `AFFILORG("${uni.name}") AND TITLE-ABS-KEY(climat* OR "global warming" OR "carbon emission" OR "net zero" OR decarboni*) AND SUBJAREA(EART OR ENVI OR AGRI OR ENER OR SOCI) AND PUBYEAR > 2019`;
    const url = `https://api.elsevier.com/content/search/scopus?` +
      `query=${encodeURIComponent(q)}&count=25&sort=citedby-count`;
    try {
      const r = await fetchWithRetry(url, scopusHdrs);
      if (!r.ok) {
        const body = await r.text();
        debug.push(`Scopus ${r.status} for "${uni.name}": ${body.slice(0, 200)}`);
        return;
      }
      const data    = await r.json();
      const entries = data?.['search-results']?.entry || [];
      papersByUni[uni.name] = entries
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
      debug.push(`Scopus fetch error for "${uni.name}": ${err.message}`);
    }
  });

  // ── Batch SciVal enrichment (up to 5 chunks in parallel) ───────────────────
  const allEids = [...new Set(
    Object.values(papersByUni).flat().map(p => p.eid).filter(Boolean)
  )];

  const CHUNK = 25;
  const PAR   = 2;
  const svData = {};
  for (let i = 0; i < allEids.length; i += CHUNK * PAR) {
    const promises = [];
    for (let j = 0; j < PAR; j++) {
      const start = i + j * CHUNK;
      if (start >= allEids.length) break;
      promises.push(fetchSciValBatch(allEids.slice(start, start + CHUNK), apiKey, debug));
    }
    const results = await Promise.all(promises);
    results.forEach(r => Object.assign(svData, r));
  }

  debug.push(`stats: ${Object.keys(papersByUni).length} unis, ${allEids.length} eids, ${Object.keys(svData).length} scival records`);

  // ── Bucket papers into curated AREAS ────────────────────────────────────────
  // A paper is kept only if its SciVal cluster is in the curated whitelist
  // (src/climate-areas.js). Papers are then grouped by the area that owns the
  // cluster, deduplicated by DOI, and carry the set of IUCA members involved.
  const areaMap = Object.fromEntries(
    CLIMATE_AREAS.map(a => [a.id, { id: a.id, name: a.name, blurb: a.blurb, doiMap: {}, clusterIds: new Set() }])
  );

  for (const [uniName, papers] of Object.entries(papersByUni)) {
    const meta = uniMeta[uniName] || { name: uniName, flag: '🌍' };
    for (const p of papers) {
      if (!p.eid) continue;
      const sv = svData[p.eid];
      if (!sv?.topicClusterId) continue;

      const area = CLUSTER_TO_AREA[sv.topicClusterId];
      if (!area) continue; // cluster not in any curated area — drop it

      const bucket = areaMap[area.areaId];
      bucket.clusterIds.add(sv.topicClusterId);

      const key = p.doi || p.eid;
      if (!bucket.doiMap[key]) {
        bucket.doiMap[key] = {
          title:        p.title,
          doi:          p.doi,
          url:          p.doi ? `https://doi.org/${p.doi}` : '',
          year:         p.year,
          journal:      p.journal,
          fwci:         sv.fwci !== null ? Math.round(sv.fwci * 100) / 100 : null,
          topicCluster: sv.topicClusterName || area.clusterName,
          unis:         [],
        };
      }
      const entry = bucket.doiMap[key];
      if (!entry.unis.some(u => u.name === meta.name)) {
        entry.unis.push({ name: meta.name, flag: meta.flag });
      }
    }
  }

  // ── Assemble areas in the configured order ──────────────────────────────────
  const areas = CLIMATE_AREAS.map(cfg => {
    const bucket = areaMap[cfg.id];
    const papers = Object.values(bucket.doiMap)
      .sort((a, b) => (b.fwci ?? 0) - (a.fwci ?? 0))
      .slice(0, 6);
    const uniCount = new Set(Object.values(bucket.doiMap).flatMap(p => p.unis.map(u => u.name))).size;
    return {
      id:          cfg.id,
      name:        cfg.name,
      blurb:       cfg.blurb,
      papers,
      uniCount,
      paperCount:  Object.keys(bucket.doiMap).length,
      clusterCount: bucket.clusterIds.size,
    };
  }).filter(a => a.papers.length > 0);

  return areas;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300'); // 5-min CDN cache; KV is the primary store

  const apiKey = process.env.SCOPUS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'SCOPUS_API_KEY not configured' });

  // Respect a custom university list passed from frontend (e.g. after members edit)
  const requestedNames = req.query.scopusNames
    ? req.query.scopusNames.split('|').map(s => s.trim()).filter(Boolean)
    : null;
  const universities = requestedNames
    ? UNIVERSITIES.filter(u => requestedNames.includes(u.name))
    : UNIVERSITIES;

  const force = req.query.force === '1';

  // ── 1. Try KV cache first ──────────────────────────────────────────────────
  // Committed snapshot (from scripts/refresh-topics.mjs) is the fallback of
  // last resort — SciVal is IP-entitled and usually 403s from Vercel.
  let stale = TOPICS_SNAPSHOT?.areas?.length ? TOPICS_SNAPSHOT : null;
  try {
    const cached = kv ? await kv.get(KV_KEY) : null;
    if (cached?.areas?.length && cached?.cachedAt) {
      const ageMs = Date.now() - new Date(cached.cachedAt).getTime();
      if (ageMs < KV_TTL_S * 1000 && !force) {
        return res.status(200).json({ ...cached, fromCache: true });
      }
      stale = cached; // keep as fallback if fresh compute fails
    }
  } catch (err) {
    console.error('KV read error:', err.message);
  }

  // ── 2. Compute fresh ───────────────────────────────────────────────────────
  try {
    const debug  = [];
    const areas  = await computeTopics(universities, apiKey, debug);
    const result = { areas, updatedAt: new Date().toISOString(), cachedAt: new Date().toISOString() };

    // Only cache non-empty results — an empty set means something upstream
    // failed, and caching it would serve emptiness for 24 hours.
    if (kv && areas.length > 0) {
      try { await kv.set(KV_KEY, result); }
      catch (err) { console.error('KV write error:', err.message); }
    }

    // SciVal is IP-entitled and may fail from Vercel — a stale cache
    // (populated via scripts/refresh-topics.mjs) beats an empty page.
    if (areas.length === 0 && stale) {
      return res.status(200).json({ ...stale, fromCache: true, staleFallback: true });
    }

    if (req.query.debug === '1') result.debug = debug.slice(0, 10);
    return res.status(200).json(result);
  } catch (err) {
    if (stale) return res.status(200).json({ ...stale, fromCache: true, staleFallback: true });
    return res.status(500).json({ error: err.message });
  }
}
