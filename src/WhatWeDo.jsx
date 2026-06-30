import { useState, useEffect } from "react";
import { UNIVERSITIES, THEMES } from "./data.js";

// ─── API calls ────────────────────────────────────────────────────────────────
async function fetchThemeData(theme, universities) {
  const termQuery = (theme.scopusTerms || []).slice(0, 4).join(" OR ");
  const params = new URLSearchParams({
    themeQuery: termQuery,
    affIds: universities.map(u => u.scopusId).join(","),
  });
  params.set("v", "3");
  const resp = await fetch(`/api/scopus?${params}`);
  if (!resp.ok) throw new Error("Scopus proxy error");
  return resp.json(); // { uniPapers: { scopusId: [{ title, doi, year, citations, url }] } }
}

async function generateSubcategories(theme, rawData, universities) {
  const uniPapers = rawData.uniPapers || {};
  const uniSummary = Object.entries(uniPapers).map(([id, papers]) => {
    const uni = universities.find(u => u.scopusId === id);
    return `${uni?.name || id}: ${papers.slice(0, 4).map(p => p.title).join("; ")}`;
  }).join("\n");

  const resp = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      theme: theme.label,
      description: theme.description,
      uniSummary,
      universities: universities.map(u => u.name),
    }),
  });
  if (!resp.ok) throw new Error("Claude proxy error");
  const data = await resp.json();
  return data.subcategories;
}

// ─── Components ───────────────────────────────────────────────────────────────
// paper = { title, doi, year, citations, url } | null
function UniChip({ name, flag, paper, colour }) {
  const hasLink = paper?.url && paper.url.startsWith("http");
  const chipStyle = {
    display: "inline-flex", alignItems: "center", gap: "0.4rem",
    padding: "0.3rem 0.7rem", borderRadius: 6,
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    marginRight: "0.4rem", marginBottom: "0.4rem",
    textDecoration: "none", transition: "background 0.15s, border-color 0.15s",
    cursor: hasLink ? "pointer" : "default",
  };
  const inner = (
    <>
      <span style={{ fontSize: "0.9rem", lineHeight: 1 }}>{flag}</span>
      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>{name}</span>
      {hasLink && <span style={{ fontSize: "0.6rem", color: `${colour}90` }}>↗</span>}
    </>
  );
  const hoverIn  = e => { e.currentTarget.style.background = `${colour}18`; e.currentTarget.style.borderColor = `${colour}50`; };
  const hoverOut = e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; };

  const title = hasLink ? `"${paper.title}"${paper.year ? ` (${paper.year})` : ""}${paper.citations ? ` · ${paper.citations} citations` : ""}` : name;

  return hasLink ? (
    <a href={paper.url} target="_blank" rel="noopener noreferrer"
      title={title} style={chipStyle}
      onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
      {inner}
    </a>
  ) : (
    <span style={chipStyle} title={name} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>{inner}</span>
  );
}

function SubcategoryCard({ sub, colour, universities, uniPaperMap }) {
  const [expanded, setExpanded] = useState(false);
  const unis = (sub.universities || [])
    .map(name => universities.find(u => u.name === name))
    .filter(Boolean);

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      borderLeft: `3px solid ${colour}`, borderRadius: 8, marginBottom: "0.5rem",
    }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: "0.85rem 1rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div>
          <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 600, fontSize: "0.88rem" }}>{sub.label}</div>
          {sub.summary && <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", marginTop: "0.2rem", lineHeight: 1.5 }}>{sub.summary}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0, marginLeft: "1rem" }}>
          <span style={{ fontSize: "0.7rem", color: colour, fontWeight: 600 }}>{unis.length} universities</span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 1rem 1rem 1rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0.65rem 0 0.75rem" }}>
            IUCA members active in this area · top cited Scopus paper shown
          </div>
          {unis.map(u => {
            const paper = uniPaperMap?.[u.name];
            return (
              <div key={u.name} style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "1rem" }}>{u.flag}</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{u.name}</span>
                  {paper?.citations > 0 && (
                    <span style={{ fontSize: "0.65rem", color: colour, background: `${colour}15`, padding: "0.1rem 0.4rem", borderRadius: 10 }}>
                      {paper.citations} citations
                    </span>
                  )}
                </div>
                {paper?.url ? (
                  <a href={paper.url} target="_blank" rel="noopener noreferrer" style={{
                    display: "block", marginLeft: "1.6rem", fontSize: "0.73rem",
                    color: "rgba(255,255,255,0.5)", lineHeight: 1.5, textDecoration: "none",
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = colour}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
                  >
                    {paper.title}{paper.year ? ` (${paper.year})` : ""} ↗
                  </a>
                ) : (
                  <span style={{ display: "block", marginLeft: "1.6rem", fontSize: "0.72rem", color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>
                    No matching Scopus paper found
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ThemePanel({ theme, universities, isOpen, onToggle }) {
  const [status, setStatus]               = useState("idle");
  const [subcategories, setSubcategories] = useState(null);
  const [uniPaperMap, setUniPaperMap]     = useState(null); // { uniName: topPaper }

  useEffect(() => {
    if (!isOpen || subcategories) return;
    setStatus("loading");
    let rawPapers = {};
    fetchThemeData(theme, universities)
      .then(raw => {
        rawPapers = raw.uniPapers || {};
        return generateSubcategories(theme, raw, universities);
      })
      .then(subs => {
        // Build name → top paper lookup from Scopus results
        const map = {};
        for (const uni of universities) {
          const papers = rawPapers[uni.scopusId];
          if (papers?.length) map[uni.name] = papers[0]; // already sorted by citation count
        }
        setUniPaperMap(map);
        setSubcategories(subs);
        setStatus("done");
      })
      .catch(() => { setSubcategories(null); setStatus("error"); });
  }, [isOpen]);

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
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
        }}>
          +
        </div>
      </button>

      {isOpen && (
        <div style={{ padding: "0.5rem 2rem 1.5rem 4.5rem" }}>
          {status === "loading" && (
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", padding: "1rem 0", fontStyle: "italic" }}>
              Pulling research areas from Scopus…
            </div>
          )}
          {status === "error" && (
            <div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginBottom: "0.75rem", fontStyle: "italic" }}>
                Detailed research areas are generated from live Scopus data (available on Vercel). Showing all member universities active in this broad theme area.
              </div>
              <div>
                {universities.map(u => (
                  <UniChip key={u.name} name={u.name} flag={u.flag} paper={null} colour={theme.colour} />
                ))}
              </div>
            </div>
          )}
          {subcategories && subcategories.map((sub, i) => (
            <SubcategoryCard key={i} sub={sub} colour={theme.colour} universities={universities} uniPaperMap={uniPaperMap} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WhatWeDo({ universities = UNIVERSITIES, themes = THEMES, visibleThemes }) {
  const [openTheme, setOpenTheme] = useState(null);

  const filteredThemes = visibleThemes
    ? themes.filter(t => visibleThemes.includes(t.id))
    : themes;

  const toggle = (id) => setOpenTheme(prev => prev === id ? null : id);

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
            onToggle={() => toggle(theme.id)}
          />
        ))}
      </div>

      <div style={{ textAlign: "center", paddingBottom: "3rem", color: "rgba(255,255,255,0.18)", fontSize: "0.7rem" }}>
        Research areas derived from Scopus publication data · Subcategories generated by Claude AI
      </div>
    </div>
  );
}
