import { useState, useEffect } from "react";
import UniLogo from "./UniLogo.jsx";

function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function scoreColour(score) {
  if (score >= 5000) return "#f0a030";
  if (score >= 1000) return "#5caa72";
  if (score >= 500)  return "#5b9bd5";
  return "#9b8dd5";
}

// ─── Paper card ───────────────────────────────────────────────────────────────
function PaperCard({ paper, rank }) {
  const colour = scoreColour(paper.score);

  return (
    <div style={{
      padding: "1.75rem",
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      marginBottom: "1.25rem",
    }}>
      {/* Top row: rank + score + topic cluster */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1.1rem", marginBottom: "1rem" }}>
        {/* Altmetric score ring */}
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.18)", marginBottom: "0.2rem" }}>#{rank}</div>
          <div style={{
            width: 58, height: 58, borderRadius: "50%",
            border: `2.5px solid ${colour}`, background: `${colour}12`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: colour, lineHeight: 1 }}>
              {paper.score >= 1000 ? `${(paper.score / 1000).toFixed(1)}k` : paper.score}
            </span>
            <span style={{ fontSize: "0.38rem", color: colour, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.04em" }}>altmetric</span>
          </div>
        </div>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {paper.areaName && (
            <div style={{
              display: "inline-block", marginBottom: "0.5rem",
              fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
              color: colour, background: `${colour}1e`, border: `1px solid ${colour}40`,
              padding: "0.15rem 0.5rem", borderRadius: 20,
            }}>
              {paper.areaName}
            </div>
          )}
          <a
            href={paper.paperUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <div style={{
              fontFamily: "'Fraunces', serif", fontWeight: 300,
              fontSize: "1.05rem", lineHeight: 1.45, color: "rgba(255,255,255,0.92)",
              marginBottom: "0.4rem", transition: "color 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.color = colour}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.92)"}
            >
              {paper.title} ↗
            </div>
          </a>

          {/* Journal · Year · Topic cluster */}
          <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.32)", lineHeight: 1.6 }}>
            {[
              paper.journal,
              paper.publishedOn ? formatDate(paper.publishedOn) : null,
              paper.topicCluster,
            ].filter(Boolean).join(" · ")}
          </div>
        </div>

        {/* FWCI badge */}
        {paper.fwci !== null && paper.fwci !== undefined && (
          <div style={{ flexShrink: 0, textAlign: "center" }} title="Field-Weighted Citation Impact">
            <div style={{ fontSize: "0.52rem", color: "rgba(255,255,255,0.2)", marginBottom: "0.15rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>FWCI</div>
            <div style={{
              fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", lineHeight: 1,
            }}>
              {paper.fwci >= 10 ? Math.round(paper.fwci) : paper.fwci}
            </div>
            <div style={{ fontSize: "0.48rem", color: "rgba(255,255,255,0.18)", marginTop: "0.1rem" }}>× field avg</div>
          </div>
        )}
      </div>

      {/* Abstract snippet */}
      {paper.abstract && (
        <p style={{
          fontSize: "0.78rem", color: "rgba(255,255,255,0.42)", lineHeight: 1.7,
          marginBottom: "1rem",
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {paper.abstract}
        </p>
      )}

      {/* IUCA members */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
          IUCA
        </span>
        {paper.iucaMembers.map(u => (
          <span key={u.name} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
            {u.name === "IUCA Member"
              ? <span style={{ fontSize: "0.85rem" }}>🌍</span>
              : <UniLogo name={u.name} size={16} />}
            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{u.name}</span>
          </span>
        ))}
      </div>

      {/* Attention breakdown */}
      <div style={{ marginTop: "0.85rem", display: "flex", gap: "1.1rem", flexWrap: "wrap", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem" }}>
        {paper.newsOutlets    > 0 && <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)" }}>{paper.newsOutlets.toLocaleString()} news outlets</span>}
        {paper.policyMentions > 0 && <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)" }}>{paper.policyMentions.toLocaleString()} policy docs</span>}
        {paper.socialMentions > 0 && <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)" }}>{paper.socialMentions.toLocaleString()} social posts</span>}
        {paper.detailsUrl && (
          <a href={paper.detailsUrl} target="_blank" rel="noopener" style={{ fontSize: "0.68rem", color: colour, textDecoration: "none", opacity: 0.8, marginLeft: "auto" }}>
            Full attention report ↗
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InTheNews({ timeframe = "1y", paperCount = 10 }) {
  const [papers,  setPapers]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    setPapers(null);
    setError(null);
    // Static JSON straight from the CDN — no serverless function on page load.
    // Regenerated weekly by scripts/refresh-topics.mjs; a new deploy busts the cache.
    fetch(`/data/impact.json`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(({ papers }) => { setPapers((papers || []).slice(0, paperCount)); setLoading(false); })
      .catch(err => { setError(err?.error || String(err)); setLoading(false); });
  }, [timeframe, paperCount]);

  return (
    <div style={{
      minHeight: "100vh", background: "#080f1c",
      fontFamily: "'Inter', -apple-system, sans-serif", color: "rgba(255,255,255,0.85)",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,600;1,300&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div style={{ padding: "4rem 2rem 3rem", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          International Universities Climate Alliance
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 300, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.15, letterSpacing: "-0.02em", color: "#fff" }}>
          Our research,<br />
          <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.5)" }}>in the world</em>
        </h1>
        <p style={{ marginTop: "0.85rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 540 }}>
          The highest-attention climate papers from IUCA member universities — ranked by Altmetric score,
          measuring media coverage, policy citations and social reach.
        </p>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 2rem 5rem" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.25)", fontSize: "0.85rem" }}>
            Fetching top papers…
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,100,100,0.6)", fontSize: "0.85rem" }}>
            Could not load papers: {error}
          </div>
        )}

        {!loading && !error && papers?.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.25)" }}>
            No papers found for this time period.
          </div>
        )}

        {papers?.map((p, i) => (
          <PaperCard key={p.doi || i} paper={p} rank={i + 1} />
        ))}
      </div>

      <div style={{ textAlign: "center", paddingBottom: "2.5rem", color: "rgba(255,255,255,0.12)", fontSize: "0.67rem" }}>
        Attention data: Altmetric Explorer · Citations: Scopus + SciVal · {new Date().getFullYear()} IUCA
      </div>
    </div>
  );
}
