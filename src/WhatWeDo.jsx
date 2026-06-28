import { useState, useEffect } from "react";
import { UNIVERSITIES, THEMES } from "./data.js";

// ─── API calls ────────────────────────────────────────────────────────────────
async function fetchThemeData(theme, universities) {
  const termQuery = (theme.scopusTerms || []).slice(0, 4).join(" OR ");
  const params = new URLSearchParams({
    themeQuery: termQuery,
    affIds: universities.map(u => u.scopusId).join(","),
  });
  const resp = await fetch(`/api/scopus?${params}`);
  if (!resp.ok) throw new Error("Scopus proxy error");
  return resp.json();
}

async function generateSubcategories(theme, rawData, universities) {
  const uniTitles = rawData.uniTitles || {};
  const uniSummary = Object.entries(uniTitles).map(([id, titles]) => {
    const uni = universities.find(u => u.scopusId === id);
    return `${uni?.name || id}: ${titles.slice(0, 4).join("; ")}`;
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
function UniChip({ name, flag, researchUrl, colour }) {
  return (
    <a
      href={researchUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`${name} — research group`}
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.4rem",
        padding: "0.3rem 0.7rem", borderRadius: 6,
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
        marginRight: "0.4rem", marginBottom: "0.4rem",
        textDecoration: "none", cursor: "pointer", transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `${colour}18`;
        e.currentTarget.style.borderColor = `${colour}50`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
      }}
    >
      <span style={{ fontSize: "0.9rem", lineHeight: 1 }}>{flag}</span>
      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>{name}</span>
      <span style={{ fontSize: "0.6rem", color: `${colour}90` }}>↗</span>
    </a>
  );
}

function SubcategoryCard({ sub, colour, universities }) {
  const [expanded, setExpanded] = useState(false);
  const unis = (sub.universities || [])
    .map(name => universities.find(u => u.name === name))
    .filter(Boolean);

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.08)`,
        borderLeft: `3px solid ${colour}`, borderRadius: 8, padding: "0.85rem 1rem",
        cursor: "pointer", transition: "background 0.15s", marginBottom: "0.5rem",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 600, fontSize: "0.88rem" }}>{sub.label}</div>
          {sub.summary && <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", marginTop: "0.2rem", lineHeight: 1.5 }}>{sub.summary}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0, marginLeft: "1rem" }}>
          <span style={{ fontSize: "0.7rem", color: colour, fontWeight: 600 }}>
            {(sub.universities || []).length} universities
          </span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: "0.85rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>
            IUCA members active in this area
          </div>
          <div>
            {unis.map(u => (
              <UniChip key={u.name} name={u.name} flag={u.flag} researchUrl={u.researchUrl} colour={colour} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ThemePanel({ theme, universities, isOpen, onToggle }) {
  const [status, setStatus]             = useState("idle");
  const [subcategories, setSubcategories] = useState(null);

  useEffect(() => {
    if (!isOpen || subcategories) return;
    setStatus("loading");
    fetchThemeData(theme, universities)
      .then(raw => generateSubcategories(theme, raw, universities))
      .then(subs => { setSubcategories(subs); setStatus("done"); })
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
            <div style={{ color: "#e07060", fontSize: "0.78rem", padding: "0.5rem 0" }}>
              Could not load research data.
            </div>
          )}
          {subcategories && subcategories.map((sub, i) => (
            <SubcategoryCard key={i} sub={sub} colour={theme.colour} universities={universities} />
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
