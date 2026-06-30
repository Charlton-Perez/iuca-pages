import { useState, useEffect } from "react";
import { UNIVERSITIES, THEMES } from "./data.js";

// Fetch top cited Scopus paper per university for a given theme.
// Uses AFFILORG("name") queries — keyed by university name in the response.
async function fetchThemePapers(theme, universities) {
  const params = new URLSearchParams({
    subjectAreas: (theme.subjectAreas || []).join(","),
    affNames:     universities.map(u => u.name).join(","),
    v: "11",
  });
  const resp = await fetch(`/api/scopus?${params}`);
  if (!resp.ok) throw new Error(`Scopus ${resp.status}`);
  return resp.json();
}

// ─── ThemePanel ───────────────────────────────────────────────────────────────
function ThemePanel({ theme, universities, isOpen, onToggle, shownDois, onPapersShown }) {
  const [status, setStatus]         = useState("idle");
  const [uniPapers, setUniPapers]   = useState(null); // { "University Name": [paper] }

  useEffect(() => {
    if (!isOpen || uniPapers !== null) return;
    setStatus("loading");
    fetchThemePapers(theme, universities)
      .then(data => { setUniPapers(data.uniPapers || {}); setStatus("done"); })
      .catch(() => { setUniPapers({}); setStatus("error"); });
  }, [isOpen]);

  // Register newly visible DOIs with the parent once loaded
  useEffect(() => {
    if (status !== "done" || !uniPapers) return;
    const newDois = Object.values(uniPapers)
      .flat()
      .map(p => p.doi)
      .filter(doi => doi && !shownDois.has(doi));
    if (newDois.length) onPapersShown(newDois);
  }, [status]);

  // Only show universities with a paper not already shown in another theme, sorted A→Z
  const withPapers = uniPapers
    ? [...universities]
        .filter(u => {
          const paper = uniPapers[u.name]?.[0];
          return paper && (!paper.doi || !shownDois.has(paper.doi));
        })
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

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
                {withPapers.length > 0
                  ? `${withPapers.length} of ${universities.length} members have Scopus papers in this theme · A–Z`
                  : `No matching papers found in Scopus for this theme`}
              </div>

              {/* Universities with a paper */}
              {withPapers.map(u => {
                const paper = uniPapers[u.name][0];
                return (
                  <div key={u.name} style={{
                    display: "flex", alignItems: "flex-start", gap: "0.75rem",
                    padding: "0.65rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <span style={{ fontSize: "1.1rem", flexShrink: 0, lineHeight: 1.4 }}>{u.flag}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{u.name}</span>
                        {paper.citations > 0 && (
                          <span style={{
                            fontSize: "0.63rem", padding: "0.1rem 0.45rem", borderRadius: 10,
                            background: `${theme.colour}18`, color: theme.colour, fontWeight: 600,
                          }}>
                            {paper.citations.toLocaleString()} citations
                          </span>
                        )}
                        {paper.year && (
                          <span style={{ fontSize: "0.63rem", color: "rgba(255,255,255,0.25)" }}>{paper.year}</span>
                        )}
                      </div>
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5, textDecoration: "none", display: "block", marginTop: "0.15rem" }}
                        onMouseEnter={e => e.currentTarget.style.color = theme.colour}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
                      >
                        {paper.title} ↗
                      </a>
                    </div>
                  </div>
                );
              })}

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
  const [shownDois, setShownDois] = useState(() => new Set());
  const registerDois = (dois) => setShownDois(prev => new Set([...prev, ...dois]));

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
            shownDois={shownDois}
            onPapersShown={registerDois}
          />
        ))}
      </div>

      <div style={{ textAlign: "center", paddingBottom: "3rem", color: "rgba(255,255,255,0.18)", fontSize: "0.7rem" }}>
        Top cited papers from Scopus publication data · {new Date().getFullYear()} IUCA
      </div>
    </div>
  );
}
