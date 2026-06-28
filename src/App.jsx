import { useState, useEffect } from "react";
import WhatWeDo from "./WhatWeDo.jsx";
import InTheNews from "./InTheNews.jsx";
import Settings, { useConfig } from "./Settings.jsx";
import { UNIVERSITIES, THEMES } from "./data.js";

const isEmbed = new URLSearchParams(window.location.search).get("embed") === "1";

// Read ?page=whatwedo|inthenews for direct embed links
const initialPage = new URLSearchParams(window.location.search).get("page") || "whatwedo";

export default function App() {
  const [page, setPage]         = useState(initialPage);
  const [displayConfig, updateDisplayConfig] = useConfig();

  // Live content config (universities + themes) — fetched from server, falls back to defaults
  const [contentConfig, setContentConfig] = useState({ universities: UNIVERSITIES, themes: THEMES });
  const [configLoaded, setConfigLoaded]   = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.universities && data?.themes) setContentConfig(data);
      })
      .catch(() => {})
      .finally(() => setConfigLoaded(true));
  }, []);

  // Called by Settings after a successful save so the UI updates immediately
  const handleContentSave = (newContent) => setContentConfig(newContent);

  return (
    <div>
      {!isEmbed && (
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          background: "rgba(8,12,24,0.92)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0.65rem 2rem",
          display: "flex", alignItems: "center", gap: "1.5rem",
          fontFamily: "'Inter', sans-serif",
        }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.05em" }}>
            IUCA
          </span>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {[
              { id: "whatwedo",  label: "What We Do" },
              { id: "inthenews", label: "In the News" },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => setPage(id)} style={{
                padding: "0.35rem 0.85rem", borderRadius: 7, border: "none",
                background: page === id ? "rgba(255,255,255,0.1)" : "transparent",
                color: page === id ? "#fff" : "rgba(255,255,255,0.4)",
                fontSize: "0.8rem", fontWeight: page === id ? 600 : 400,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              }}>
                {label}
              </button>
            ))}
          </div>
        </nav>
      )}

      {!isEmbed && (
        <Settings
          displayConfig={displayConfig}
          onDisplayUpdate={updateDisplayConfig}
          contentConfig={contentConfig}
          onContentSave={handleContentSave}
        />
      )}

      <div style={{ paddingTop: isEmbed ? 0 : 48 }}>
        {page === "whatwedo" && (
          <WhatWeDo
            universities={contentConfig.universities}
            themes={contentConfig.themes}
            visibleThemes={displayConfig.visibleThemes}
          />
        )}
        {page === "inthenews" && (
          <InTheNews
            timeframe={displayConfig.timeframe}
            paperCount={displayConfig.paperCount}
          />
        )}
      </div>
    </div>
  );
}
