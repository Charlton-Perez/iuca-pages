import { useState, useEffect } from "react";

const PASSWORD = import.meta.env.VITE_SETTINGS_PASSWORD || "iuca2024";

const TIMEFRAME_OPTIONS = [
  { value: "1m", label: "Last month" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "1y", label: "Last year" },
  { value: "5y", label: "Last 5 years" },
];

const PAPER_COUNT_OPTIONS = [10, 25, 50];

const ALL_THEME_IDS = [
  "atmosphere","oceans","cryosphere","ecosystems","society","mitigation","food","extremes",
];

const THEME_LABELS = {
  atmosphere:  "Atmosphere & Weather",
  oceans:      "Oceans & Sea Level",
  cryosphere:  "Ice, Snow & Permafrost",
  ecosystems:  "Ecosystems & Biodiversity",
  society:     "Society & Adaptation",
  mitigation:  "Mitigation & Clean Energy",
  food:        "Food, Water & Land",
  extremes:    "Extreme Events & Risk",
};

export const DEFAULT_CONFIG = {
  timeframe:     "6m",
  paperCount:    25,
  visibleThemes: ALL_THEME_IDS,
};

export function useConfig() {
  const [config, setConfig] = useState(() => {
    try {
      const stored = localStorage.getItem("iuca_dashboard_config");
      return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
    } catch { return DEFAULT_CONFIG; }
  });

  const updateConfig = (next) => {
    const merged = { ...config, ...next };
    setConfig(merged);
    localStorage.setItem("iuca_dashboard_config", JSON.stringify(merged));
  };

  return [config, updateConfig];
}

export default function Settings({ config, onUpdate }) {
  const [open, setOpen]         = useState(false);
  const [authed, setAuthed]     = useState(false);
  const [pwInput, setPwInput]   = useState("");
  const [pwError, setPwError]   = useState(false);
  const [saved, setSaved]       = useState(false);
  const [local, setLocal]       = useState(config);

  useEffect(() => { setLocal(config); }, [config]);

  const handleUnlock = () => {
    if (pwInput === PASSWORD) { setAuthed(true); setPwError(false); }
    else { setPwError(true); setPwInput(""); }
  };

  const handleSave = () => {
    onUpdate(local);
    setSaved(true);
    setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
  };

  const toggleTheme = (id) => {
    const current = local.visibleThemes;
    const next = current.includes(id)
      ? current.filter(t => t !== id)
      : [...current, id];
    if (next.length === 0) return; // must keep at least one
    setLocal(l => ({ ...l, visibleThemes: next }));
  };

  return (
    <>
      {/* Gear button */}
      <button
        onClick={() => setOpen(true)}
        title="Dashboard settings"
        style={{
          position: "fixed", top: "0.6rem", right: "1.25rem", zIndex: 300,
          background: "transparent", border: "none", cursor: "pointer",
          color: "rgba(255,255,255,0.35)", fontSize: "1.1rem", lineHeight: 1,
          padding: "0.4rem", borderRadius: 6, transition: "color 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.75)"}
        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
      >
        ⚙
      </button>

      {/* Backdrop + modal */}
      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) { setOpen(false); setAuthed(false); setPwInput(""); } }}
          style={{
            position: "fixed", inset: 0, zIndex: 400,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{
            background: "#0f1828", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, padding: "2rem", width: "min(460px, 90vw)",
            fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.85)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 300, fontSize: "1.3rem", margin: 0 }}>
                Dashboard settings
              </h2>
              <button onClick={() => { setOpen(false); setAuthed(false); setPwInput(""); }}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.2rem" }}>
                ✕
              </button>
            </div>

            {!authed ? (
              /* ── Password gate ── */
              <div>
                <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>
                  Enter the settings password to make changes.
                </p>
                <input
                  type="password"
                  value={pwInput}
                  onChange={e => setPwInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleUnlock()}
                  placeholder="Password"
                  autoFocus
                  style={{
                    width: "100%", padding: "0.6rem 0.85rem", borderRadius: 8,
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${pwError ? "#e07060" : "rgba(255,255,255,0.12)"}`,
                    color: "#fff", fontSize: "0.9rem", outline: "none",
                    fontFamily: "inherit", boxSizing: "border-box",
                  }}
                />
                {pwError && <p style={{ color: "#e07060", fontSize: "0.75rem", marginTop: "0.4rem" }}>Incorrect password</p>}
                <button onClick={handleUnlock} style={{
                  marginTop: "1rem", width: "100%", padding: "0.6rem",
                  background: "#5b9bd5", border: "none", borderRadius: 8,
                  color: "#fff", fontWeight: 600, fontSize: "0.85rem",
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                  Unlock
                </button>
              </div>
            ) : (
              /* ── Settings panel ── */
              <div>
                {/* In the News settings */}
                <section style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                    In the News
                  </div>

                  <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "0.35rem" }}>
                    Attention window
                  </label>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                    {TIMEFRAME_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setLocal(l => ({ ...l, timeframe: opt.value }))}
                        style={{
                          padding: "0.3rem 0.75rem", borderRadius: 20, border: "1px solid",
                          borderColor: local.timeframe === opt.value ? "#5b9bd5" : "rgba(255,255,255,0.12)",
                          background: local.timeframe === opt.value ? "rgba(91,155,213,0.2)" : "transparent",
                          color: local.timeframe === opt.value ? "#5b9bd5" : "rgba(255,255,255,0.45)",
                          fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit",
                        }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "0.35rem" }}>
                    Papers shown
                  </label>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    {PAPER_COUNT_OPTIONS.map(n => (
                      <button key={n} onClick={() => setLocal(l => ({ ...l, paperCount: n }))}
                        style={{
                          padding: "0.3rem 0.75rem", borderRadius: 20, border: "1px solid",
                          borderColor: local.paperCount === n ? "#5b9bd5" : "rgba(255,255,255,0.12)",
                          background: local.paperCount === n ? "rgba(91,155,213,0.2)" : "transparent",
                          color: local.paperCount === n ? "#5b9bd5" : "rgba(255,255,255,0.45)",
                          fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit",
                        }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </section>

                {/* What We Do settings */}
                <section style={{ marginBottom: "1.75rem" }}>
                  <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                    What We Do — visible themes
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {ALL_THEME_IDS.map(id => (
                      <label key={id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
                        <input type="checkbox"
                          checked={local.visibleThemes.includes(id)}
                          onChange={() => toggleTheme(id)}
                          style={{ accentColor: "#5b9bd5", width: 14, height: 14 }}
                        />
                        <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>{THEME_LABELS[id]}</span>
                      </label>
                    ))}
                  </div>
                </section>

                <button onClick={handleSave} style={{
                  width: "100%", padding: "0.65rem",
                  background: saved ? "#5caa72" : "#5b9bd5",
                  border: "none", borderRadius: 8,
                  color: "#fff", fontWeight: 600, fontSize: "0.85rem",
                  cursor: "pointer", fontFamily: "inherit", transition: "background 0.2s",
                }}>
                  {saved ? "✓ Saved" : "Save changes"}
                </button>
                <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: "0.6rem" }}>
                  Changes apply immediately and persist in your browser.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
