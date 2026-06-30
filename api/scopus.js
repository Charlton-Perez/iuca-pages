// api/scopus.js — Vercel serverless function
// Returns top Scopus paper per IUCA university per theme.
//
// For atmosphere / oceans / cryosphere: fetches top 25 EART papers per university
// and filters server-side by journal source-id (ASJC 1902 / 1910 / 1904).
// This correctly excludes multi-disciplinary papers (e.g. Global Carbon Budget)
// that are published in general-EART journals (ASJC 1900) not specific to any theme.
//
// For other themes: uses SUBJAREA codes which already differentiate them well.
// For extremes: adds TITLE-ABS-KEY terms (specific enough not to cause cross-theme pollution).
//
// Papers ranked by citations-per-year (citations ÷ paper age in years).
// FWCI is not available from the Scopus Search API — citesPerYear is the best proxy.

import { JOURNAL_SETS } from './journal-sets.js';

const CURRENT_YEAR = 2026;

// Themes that use broad SUBJAREA(EART) + server-side journal filter
const JOURNAL_FILTER_THEMES = new Set(['atmosphere', 'oceans', 'cryosphere']);

// Theme → Scopus query config
const THEME_QUERY = {
  atmosphere: { subjarea: 'EART' },
  oceans:     { subjarea: 'EART' },
  cryosphere: { subjarea: 'EART' },
  extremes:   { subjarea: 'EART OR ENVI',
                terms: ['extreme event','heatwave','heat wave','flood','wildfire',
                        'cyclone','hurricane','drought','disaster','storm surge'] },
  ecosystems: { subjarea: 'ENVI OR AGRI' },
  society:    { subjarea: 'ENVI OR SOCI' },
  mitigation: { subjarea: 'ENER OR ENVI' },
  food:       { subjarea: 'AGRI OR ENVI' },
};

function citesPerYear(citations, yearStr) {
  const year = parseInt(yearStr) || CURRENT_YEAR - 1;
  const age  = Math.max(1, CURRENT_YEAR - year);
  return citations / age;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.SCOPUS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'SCOPUS_API_KEY not configured' });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400');

  const { affNames, themeId } = req.query;
  if (!affNames) return res.status(400).json({ error: 'Provide affNames' });
  if (!themeId || !THEME_QUERY[themeId]) return res.status(400).json({ error: 'Provide valid themeId' });

  const uniNames  = affNames.split(',').map(s => s.trim()).filter(Boolean);
  const config    = THEME_QUERY[themeId];
  const journalSet = JOURNAL_FILTER_THEMES.has(themeId) ? JOURNAL_SETS[themeId] : null;

  // Build TITLE-ABS-KEY clause for themes that use keyword refinement
  const termClause = config.terms?.length
    ? ` AND TITLE-ABS-KEY(${config.terms.map(t => `"${t}"`).join(' OR ')})`
    : '';

  const scopusHeaders = { 'X-ELS-APIKey': apiKey, Accept: 'application/json' };
  const iucaNameSet   = new Set(uniNames.map(n => n.toLowerCase()));
  const nameMap       = Object.fromEntries(uniNames.map(n => [n.toLowerCase(), n]));
  const rawResults    = {};

  await Promise.all(uniNames.map(async (name) => {
    const q = `AFFILORG("${name}") AND SUBJAREA(${config.subjarea})${termClause} AND PUBYEAR > 2021`;
    // Fetch 25 papers (Scopus max per request). Journal-filtered themes need more candidates.
    const url = `https://api.elsevier.com/content/search/scopus?` +
      `query=${encodeURIComponent(q)}&count=25&sort=citedby-count`;
    try {
      const r = await fetch(url, { headers: scopusHeaders });
      if (!r.ok) { console.error(`Scopus ${r.status} for "${name}" theme=${themeId}`); return; }
      const data    = await r.json();
      const entries = data?.['search-results']?.entry || [];

      let papers = entries
        .filter(e => e['dc:title'])
        .map(e => {
          const year      = (e['prism:coverDate'] || '').slice(0, 4);
          const citations = parseInt(e['citedby-count'] || '0');
          const rawAffs   = Array.isArray(e.affiliation) ? e.affiliation
                          : e.affiliation ? [e.affiliation] : [];
          return {
            title:        e['dc:title'] || '',
            doi:          e['prism:doi'] || '',
            year,
            citations,
            citesPerYear: citesPerYear(citations, year),
            url:          e['prism:doi'] ? `https://doi.org/${e['prism:doi']}` : '',
            sourceId:     e['source-id'] || '',
            affiliations: rawAffs.map(a => a?.affilname || '').filter(Boolean),
          };
        });

      // Apply journal-set filter for the three EART sub-themes
      if (journalSet) {
        papers = papers.filter(p => journalSet.has(p.sourceId));
      }

      papers.sort((a, b) => b.citesPerYear - a.citesPerYear);
      if (papers.length) rawResults[name] = papers.slice(0, 1);
    } catch (err) {
      console.error(`Scopus fetch error for "${name}":`, err.message);
    }
  }));

  // Cross-tag co-institutions: papers appearing under multiple universities share co-authorship
  const doiToUnis = {};
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

    // Detect co-institutions from affiliation list (Scopus returns 2–3 affiliations)
    const coFromAffil = paper.affiliations
      .map(a => {
        const lower = a.toLowerCase();
        for (const knownLower of iucaNameSet) {
          if (lower.includes(knownLower) || knownLower.includes(lower.split(' ')[0])) {
            return nameMap[knownLower];
          }
        }
        return null;
      })
      .filter(n => n && n !== uniName);

    // Also collect universities that independently returned the same DOI
    const coFromDoi = paper.doi
      ? (doiToUnis[paper.doi] || []).filter(n => n !== uniName)
      : [];

    const coSet = new Set([...coFromAffil, ...coFromDoi]);

    uniPapers[uniName] = [{
      title:          paper.title,
      doi:            paper.doi,
      year:           paper.year,
      citations:      paper.citations,
      citesPerYear:   Math.round(paper.citesPerYear * 10) / 10,
      url:            paper.url,
      coInstitutions: [...coSet],
    }];
  }

  return res.status(200).json({ uniPapers });
}
