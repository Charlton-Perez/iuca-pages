import { useState } from "react";
import WhatWeDo from "./WhatWeDo.jsx";
import InTheNews from "./InTheNews.jsx";
import Settings, { useConfig } from "./Settings.jsx";

export default function App() {
  const [page, setPage] = useState("whatwedo");
  const [config, updateConfig] = useConfig();

  return (
    <div>
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

      <Settings config={config} onUpdate={updateConfig} />

      <div style={{ paddingTop: 48 }}>
        {page === "whatwedo"  && <WhatWeDo visibleThemes={config.visibleThemes} />}
        {page === "inthenews" && <InTheNews timeframe={config.timeframe} paperCount={config.paperCount} />}
      </div>
    </div>
  );
}
