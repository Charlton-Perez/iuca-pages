import { useState, useEffect } from "react";
import { UNIVERSITIES } from "./data.js";
import UniLogo from "./UniLogo.jsx";

// Deterministic accent colour by position in the area list
const PALETTE = [
  "#5b9bd5","#3ab5c6","#5caa72","#e8a44a","#c97fd4",
  "#d4a843","#e07060","#7eb8d4","#87c98e","#a87ec9",
];
function areaColour(i) { return PALETTE[i % PALETTE.length]; }

// ─── AreaPanel ────────────────────────────────────────────────────────────────
function AreaPanel({ cluster, colourIndex, isOpen, onToggle }) {
  const colour = areaColour(colourIndex);
  const bg     = `${colour}12`;

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", background: isOpen ? bg : "transparent",
          border: "none", cursor: "pointer", padding: "1.4rem 2rem",
          display: "flex", alignItems: "center", gap: "1.1rem",
          textAlign: "left", transition: "background 0.2s",
        }}
        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{
          width: 10, height: 10, borderRadius: "50%",
          background: colour, flexShrink: 0, marginTop: 2,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 600, fontSize: "1rem", fontFamily: "'Fraunces', serif", letterSpacing: "-0.01em" }}>
            {cluster.name}
          </div>
          {cluster.blurb && (
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", marginTop: "0.3rem", lineHeight: 1.5 }}>
              {cluster.blurb}
            </div>
          )}
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", marginTop: "0.35rem" }}>
            {cluster.uniCount} member {cluster.uniCount === 1 ? "university" : "universities"} · {cluster.paperCount ?? cluster.papers.length} papers
          </div>
        </div>
        <div style={{
          flexShrink: 0, width: 26, height: 26, borderRadius: "50%",
          border: `1px solid ${colour}60`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: colour, fontSize: "0.75rem", transition: "transform 0.2s",
          transform: isOpen ? "rotate(45deg)" : "none",
        }}>+</div>
      </button>

      {isOpen && (
        <div style={{ padding: "0.5rem 2rem 1.75rem 2rem" }}>
          <div style={{
            fontSize: "0.62rem", color: "rgba(255,255,255,0.22)",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem",
          }}>
            Ranked by field-weighted citation impact (FWCI)
          </div>

          {cluster.papers.map((paper, i) => (
            <div key={paper.doi || i} style={{
              padding: "0.85rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
              display: "flex", gap: "0.85rem", alignItems: "flex-start",
            }}>
              <div style={{
                flexShrink: 0, width: 22, height: 22, borderRadius: "50%",
                background: `${colour}20`, border: `1px solid ${colour}50`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.62rem", color: colour, fontWeight: 600,
              }}>{i + 1}</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* IUCA members */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                  {paper.unis.map(u => (
                    <span key={u.name} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <UniLogo name={u.name} size={16} />
                      <span style={{ fontSize: "0.73rem", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{u.name}</span>
                    </span>
                  ))}
                  {paper.fwci !== null && (
                    <span style={{
                      fontSize: "0.6rem", padding: "0.1rem 0.4rem", borderRadius: 8,
                      background: `${colour}20`, color: colour, fontWeight: 600,
                    }} title="Field-Weighted Citation Impact">
                      FWCI {paper.fwci}
                    </span>
                  )}
                  {paper.year && (
                    <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.2)" }}>{paper.year}</span>
                  )}
                </div>

                {/* Title */}
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.55, textDecoration: "none", display: "block" }}
                  onMouseEnter={e => e.currentTarget.style.color = colour}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.55)"}
                >
                  {paper.title} ↗
                </a>

                {(paper.journal || paper.topicCluster) && (
                  <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.2)", marginTop: "0.15rem" }}>
                    {paper.journal}
                    {paper.journal && paper.topicCluster && " · "}
                    {paper.topicCluster && <span style={{ fontStyle: "italic" }}>{paper.topicCluster}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WhatWeDo({ universities = UNIVERSITIES, visibleAreas }) {
  const [status,   setStatus]   = useState("loading");
  const [areas,    setAreas]    = useState([]);
  const [openArea, setOpenArea] = useState(null);

  useEffect(() => {
    setStatus("loading");
    fetch(`/api/topics?v=3`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        setAreas(data.areas || []);
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }, []);

  // Apply the area-level visibility filter chosen in Settings.
  // null/empty = show all areas.
  const filtered = areas.filter(a =>
    !visibleAreas || visibleAreas.length === 0 || visibleAreas.includes(a.id)
  );

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
          Our members span every dimension of the climate challenge — from ocean dynamics to food systems. Explore our research by topic.
        </p>
      </div>

      <div style={{
        maxWidth: 900, margin: "0 auto 5rem",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden",
        background: "rgba(255,255,255,0.02)",
      }}>
        {status === "loading" && (
          <div style={{ padding: "4rem", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "0.85rem" }}>
            Mapping research topics across {universities.length} member universities…
          </div>
        )}

        {status === "error" && (
          <div style={{ padding: "4rem", textAlign: "center", color: "rgba(255,100,100,0.5)", fontSize: "0.85rem" }}>
            Could not load research topics. Please try refreshing.
          </div>
        )}

        {status === "done" && filtered.length === 0 && (
          <div style={{ padding: "4rem", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "0.85rem" }}>
            No topics available — adjust the filter in settings.
          </div>
        )}

        {status === "done" && filtered.map((area, i) => (
          <AreaPanel
            key={area.id}
            cluster={area}
            colourIndex={i}
            isOpen={openArea === area.id}
            onToggle={() => setOpenArea(prev => prev === area.id ? null : area.id)}
          />
        ))}
      </div>

      <div style={{ textAlign: "center", paddingBottom: "3rem", color: "rgba(255,255,255,0.18)", fontSize: "0.7rem" }}>
        Topics from SciVal · Papers ranked by FWCI · Scopus data · {new Date().getFullYear()} IUCA
      </div>
    </div>
  );
}
