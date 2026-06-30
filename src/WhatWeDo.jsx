import { useState, useEffect, useRef } from "react";
import { UNIVERSITIES, THEMES } from "./data.js";

async function fetchThemePapers(theme, universities) {
  const params = new URLSearchParams({
    themeId:  theme.id,
    affNames: universities.map(u => u.name).join(","),
    v: "13",
  });
  const resp = await fetch(`/api/scopus?${params}`);
  if (!resp.ok) throw new Error(`Scopus ${resp.status}`);
  return resp.json();
}

// ─── ThemePanel ───────────────────────────────────────────────────────────────
function ThemePanel({ theme, universities, isOpen, onToggle, claimedDois, claimDois }) {
  const [status, setStatus]       = useState("idle");
  const [uniPapers, setUniPapers] = useState(null);

  useEffect(() => {
    if (!isOpen || uniPapers !== null) return;
    setStatus("loading");
    fetchThemePapers(theme, universities)
      .then(data => { setUniPapers(data.uniPapers || {}); setStatus("done"); })
      .catch(() => { setUniPapers({}); setStatus("error"); });
  }, [isOpen]);

  // Group papers by DOI → one entry per unique paper, listing all IUCA co-institutions.
  // Apply first-claim deduplication across themes: skip DOIs already claimed by a prior theme.
  const uniquePapers = (() => {
    if (!uniPapers) return [];
    const byDoi   = {}; // doi → { paper, unis: [university] }
    const noDoi   = []; // papers without a DOI

    for (const u of universities) {
      const paper = uniPapers[u.name]?.[0];
      if (!paper) continue;
      if (paper.doi && !claimedDois.has(paper.doi)) {
        if (!byDoi[paper.doi]) byDoi[paper.doi] = { paper, unis: [] };
        byDoi[paper.doi].unis.push(u);
      } else if (!paper.doi) {
        noDoi.push({ paper, unis: [u] });
      }
    }

    const results = [
      ...Object.values(byDoi),
      ...noDoi,
    ].sort((a, b) => (b.paper.citesPerYear || 0) - (a.paper.citesPerYear || 0));

    // Register these DOIs as claimed by this theme
    const newDois = results.map(r => r.paper.doi).filter(Boolean);
    if (newDois.length) claimDois(newDois);

    return results;
  })();

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Header row */}
      <button
        onClick={onToggle}
        style={{
          width: "100%", background: isOpen ? theme.bg || "#0d1828" : "transparent",
          border: "none", cursor: "pointer", padding: "1.4rem 2rem",
          display: "flex", alignItems: "center", gap: "1.1rem",
          textAlign: "left", transition: "background 0.2s",
        }}
        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{ fontSize: "1.4rem", color: theme.colour, width: 32, textAlign: "center", flexShrink: 0, lineHeight: 1 }}>
          {theme.icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "rgba(255,255,255,0.95)", fontWeight: 600, fontSize: "1.05rem", fontFamily: "'Fraunces', serif", letterSpacing: "-0.01em" }}>
            {theme.label}
          </div>
          <div style={{ color: "rgba(255,255,255,0.42)", fontSize: "0.78rem", marginTop: "0.2rem", lineHeight: 1.5 }}>
            {theme.description}
          </div>
        </div>
        <div style={{
          flexShrink: 0, width: 28, height: 28, borderRadius: "50%",
          border: `1px solid ${theme.colour}60`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: theme.colour, fontSize: "0.75rem", transition: "transform 0.2s",
          transform: isOpen ? "rotate(45deg)" : "none",
        }}>+</div>
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div style={{ padding: "0.75rem 2rem 1.75rem 2rem" }}>
          {status === "loading" && (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", fontStyle: "italic", padding: "0.5rem 0" }}>
              Fetching top cited papers from Scopus…
            </p>
          )}

          {(status === "done" || status === "error") && (
            <>
              {status === "error" && (
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.72rem", fontStyle: "italic", marginBottom: "1rem" }}>
                  Scopus data unavailable — showing all member universities.
                </p>
              )}

              <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.85rem" }}>
                {uniquePapers.length > 0
                  ? `${uniquePapers.length} papers from ${universities.length} member universities · ranked by citations/year`
                  : `No matching papers found in Scopus for this theme`}
              </div>

              {uniquePapers.map(({ paper, unis }) => (
                <div key={paper.doi || paper.title} style={{
                  display: "flex", alignItems: "flex-start", gap: "0.75rem",
                  padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Institution flags + names */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                      {unis.map(u => (
                        <span key={u.name} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <span style={{ fontSize: "0.9rem" }}>{u.flag}</span>
                          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{u.name}</span>
                        </span>
                      ))}
                      {paper.citesPerYear > 0 && (
                        <span style={{
                          fontSize: "0.62rem", padding: "0.1rem 0.45rem", borderRadius: 10,
                          background: `${theme.colour}18`, color: theme.colour, fontWeight: 600,
                        }} title={`${paper.citations?.toLocaleString()} total citations`}>
                          {paper.citesPerYear} cites/yr
                        </span>
                      )}
                      {paper.year && (
                        <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.22)" }}>{paper.year}</span>
                      )}
                    </div>

                    {/* Paper link */}
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5, textDecoration: "none", display: "block" }}
                      onMouseEnter={e => e.currentTarget.style.color = theme.colour}
                      onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
                    >
                      {paper.title} ↗
                    </a>

                    {/* Non-queried IUCA co-institutions detected in the affiliation list */}
                    {paper.coInstitutions?.length > 0 && (
                      <div style={{ fontSize: "0.61rem", color: "rgba(255,255,255,0.2)", marginTop: "0.2rem" }}>
                        Also: {paper.coInstitutions.filter(n => !unis.find(u => u.name === n)).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WhatWeDo({ universities = UNIVERSITIES, themes = THEMES, visibleThemes }) {
  const [openTheme, setOpenTheme] = useState(null);

  // Shared DOI claim Set — prevents the same paper appearing in multiple themes.
  // First theme (top of list) to load and claim a DOI wins; later themes skip it.
  const claimedDois = useRef(new Set());
  const claimDois   = (dois) => dois.forEach(d => claimedDois.current.add(d));

  const filteredThemes = visibleThemes
    ? themes.filter(t => visibleThemes.includes(t.id))
    : themes;

  return (
    <div style={{
      minHeight: "100vh", background: "#0a1020",
      fontFamily: "'Inter', -apple-system, sans-serif", color: "rgba(255,255,255,0.85)",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,600;1,300&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
      `}</style>

      <div style={{ padding: "5rem 2rem 4rem", maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          padding: "0.3rem 0.9rem", borderRadius: 20, marginBottom: "1.75rem",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#5b9bd5" }} />
          International Universities Climate Alliance · {universities.length} member universities
        </div>

        <h1 style={{
          fontFamily: "'Fraunces', serif", fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
          fontWeight: 300, lineHeight: 1.15, letterSpacing: "-0.02em",
          color: "#fff", marginBottom: "1.25rem",
        }}>
          The full spectrum of<br />
          <em style={{ fontStyle: "italic", fontWeight: 300, color: "rgba(255,255,255,0.6)" }}>climate science</em>
        </h1>
        <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.75, maxWidth: 540, margin: "0 auto" }}>
          Our members span every dimension of the climate challenge — from the physics of the atmosphere to the politics of adaptation. Explore what we research.
        </p>
      </div>

      <div style={{
        maxWidth: 900, margin: "0 auto 5rem",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden",
        background: "rgba(255,255,255,0.02)",
      }}>
        {filteredThemes.map(theme => (
          <ThemePanel
            key={theme.id}
            theme={theme}
            universities={universities}
            isOpen={openTheme === theme.id}
            onToggle={() => setOpenTheme(prev => prev === theme.id ? null : theme.id)}
            claimedDois={claimedDois.current}
            claimDois={claimDois}
          />
        ))}
      </div>

      <div style={{ textAlign: "center", paddingBottom: "3rem", color: "rgba(255,255,255,0.18)", fontSize: "0.7rem" }}>
        Papers ranked by citations per year · Scopus data · {new Date().getFullYear()} IUCA
      </div>
    </div>
  );
}
