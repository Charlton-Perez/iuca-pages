import { useState, useEffect } from "react";

const PASSWORD = import.meta.env.VITE_SETTINGS_PASSWORD || "iuca2024";

// ─── Display config (localStorage) ───────────────────────────────────────────
const TIMEFRAME_OPTIONS = [
  { value: "1m", label: "Last month" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "1y", label: "Last year" },
  { value: "5y", label: "Last 5 years" },
];

export const DEFAULT_DISPLAY = {
  timeframe:     "6m",
  paperCount:    25,
  visibleThemes: null, // null = all visible
};

export function useConfig() {
  const [config, setConfig] = useState(() => {
    try {
      const stored = localStorage.getItem("iuca_display_config");
      return stored ? { ...DEFAULT_DISPLAY, ...JSON.parse(stored) } : DEFAULT_DISPLAY;
    } catch { return DEFAULT_DISPLAY; }
  });
  const updateConfig = (next) => {
    const merged = { ...config, ...next };
    setConfig(merged);
    localStorage.setItem("iuca_display_config", JSON.stringify(merged));
  };
  return [config, updateConfig];
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const pill = (active, colour = "#5b9bd5") => ({
  padding: "0.3rem 0.75rem", borderRadius: 20, border: "1px solid",
  borderColor:  active ? colour : "rgba(255,255,255,0.12)",
  background:   active ? `${colour}25`  : "transparent",
  color:        active ? colour : "rgba(255,255,255,0.45)",
  fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
});

const label = { fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", display: "block", marginBottom: "0.4rem" };
const sectionHead = {
  fontSize: "0.62rem", color: "rgba(255,255,255,0.25)", textTransform: "uppercase",
  letterSpacing: "0.09em", marginBottom: "0.85rem", marginTop: "0.25rem",
};
const input = {
  width: "100%", padding: "0.5rem 0.75rem", borderRadius: 7,
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
  color: "#fff", fontSize: "0.8rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};
const textarea = { ...input, resize: "vertical", lineHeight: 1.6, minHeight: 120 };

function CopyBox({ label: lbl, value }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={label}>{lbl}</div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input readOnly value={value} style={{ ...input, flex: 1, color: "rgba(255,255,255,0.6)", cursor: "text" }} />
        <button
          onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
          style={{
            padding: "0.5rem 0.9rem", borderRadius: 7, border: "none",
            background: copied ? "#5caa72" : "rgba(255,255,255,0.1)",
            color: "#fff", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            whiteSpace: "nowrap", transition: "background 0.2s",
          }}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Embed ───────────────────────────────────────────────────────────────
function EmbedTab() {
  const base = window.location.origin;
  return (
    <div>
      <div style={sectionHead}>Direct page links</div>
      <CopyBox lbl="What We Do — direct link" value={`${base}/?page=whatwedo`} />
      <CopyBox lbl="In the News — direct link" value={`${base}/?page=inthenews`} />

      <div style={{ ...sectionHead, marginTop: "1.5rem" }}>Embed links (iframe)</div>
      <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginBottom: "1rem", lineHeight: 1.6 }}>
        Paste these as the <code style={{ background: "rgba(255,255,255,0.08)", padding: "0.1rem 0.3rem", borderRadius: 3 }}>src</code> of an <code style={{ background: "rgba(255,255,255,0.08)", padding: "0.1rem 0.3rem", borderRadius: 3 }}>&lt;iframe&gt;</code> on the IUCA website. The nav bar and settings gear are hidden automatically.
      </p>
      <CopyBox lbl="What We Do — embed" value={`${base}/?page=whatwedo&embed=1`} />
      <CopyBox lbl="In the News — embed" value={`${base}/?page=inthenews&embed=1`} />

      <div style={{
        marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: 8,
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.7,
      }}>
        Suggested iframe HTML:<br />
        <code style={{ color: "rgba(255,255,255,0.55)" }}>
          {`<iframe src="[paste URL above]" width="100%" height="800" frameborder="0" style="border:none;"></iframe>`}
        </code>
      </div>
    </div>
  );
}

// ─── Tab: Members ─────────────────────────────────────────────────────────────
function MembersTab({ universities, onUpdate }) {
  const [text, setText] = useState(() => universitiesToText(universities));

  useEffect(() => { setText(universitiesToText(universities)); }, [universities]);

  function universitiesToText(unis) {
    return unis.map(u => `${u.name} | ${u.flag} | ${u.scopusId} | ${u.gridId} | ${u.researchUrl}`).join("\n");
  }

  function textToUniversities(raw) {
    return raw.split("\n")
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const parts = line.split("|").map(s => s.trim());
        return {
          name:        parts[0] || "",
          flag:        parts[1] || "🌍",
          scopusId:    parts[2] || "",
          gridId:      parts[3] || "",
          researchUrl: parts[4] || "",
        };
      })
      .filter(u => u.name && u.scopusId);
  }

  const parsed = textToUniversities(text);
  const valid = parsed.length > 0;

  return (
    <div>
      <div style={sectionHead}>Member universities — {parsed.length} entries</div>
      <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.75rem", lineHeight: 1.6 }}>
        One university per line. Format: <code style={{ background: "rgba(255,255,255,0.08)", padding: "0.1rem 0.3rem", borderRadius: 3 }}>Name | 🏳️ | ScopusID | GridID | Research URL</code><br />
        To remove a member, delete their line. To add one, paste a new line at the bottom.
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        style={{ ...textarea, minHeight: 320, fontFamily: "monospace", fontSize: "0.72rem" }}
        spellCheck={false}
      />
      {!valid && <p style={{ color: "#e07060", fontSize: "0.72rem", marginTop: "0.35rem" }}>Each line needs at least a name and Scopus ID</p>}
      <button
        disabled={!valid}
        onClick={() => onUpdate(parsed)}
        style={{
          marginTop: "0.75rem", width: "100%", padding: "0.6rem",
          background: valid ? "#5b9bd5" : "rgba(255,255,255,0.08)",
          border: "none", borderRadius: 8,
          color: valid ? "#fff" : "rgba(255,255,255,0.25)",
          fontWeight: 600, fontSize: "0.85rem", cursor: valid ? "pointer" : "default",
          fontFamily: "inherit",
        }}>
        Apply member changes
      </button>
    </div>
  );
}

// ─── Tab: Themes ──────────────────────────────────────────────────────────────
function ThemesTab({ themes, onUpdate }) {
  const [local, setLocal] = useState(themes);

  useEffect(() => { setLocal(themes); }, [themes]);

  const update = (idx, field, value) => {
    setLocal(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const updateTerms = (idx, raw) => {
    update(idx, "scopusTerms", raw.split(",").map(s => s.trim()).filter(Boolean));
  };

  return (
    <div>
      <div style={sectionHead}>Research themes — {local.length} themes</div>
      <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginBottom: "1rem", lineHeight: 1.6 }}>
        Edit theme names, descriptions and search terms. Search terms are used to find relevant papers in Scopus.
      </p>
      <div style={{ maxHeight: 400, overflowY: "auto", paddingRight: "0.25rem" }}>
        {local.map((theme, i) => (
          <div key={theme.id} style={{
            marginBottom: "0.85rem", padding: "0.85rem",
            background: "rgba(255,255,255,0.04)", borderRadius: 8,
            borderLeft: `3px solid ${theme.colour}`,
          }}>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input value={theme.icon} onChange={e => update(i, "icon", e.target.value)}
                style={{ ...input, width: 48, textAlign: "center", fontSize: "1.1rem", flexShrink: 0 }} />
              <input value={theme.label} onChange={e => update(i, "label", e.target.value)}
                style={{ ...input, flex: 1, fontWeight: 600 }} placeholder="Theme name" />
            </div>
            <textarea value={theme.description} onChange={e => update(i, "description", e.target.value)}
              style={{ ...textarea, minHeight: 52, fontSize: "0.75rem", marginBottom: "0.5rem" }}
              placeholder="Public description" />
            <input
              value={(theme.scopusTerms || []).join(", ")}
              onChange={e => updateTerms(i, e.target.value)}
              style={{ ...input, fontSize: "0.72rem", fontFamily: "monospace" }}
              placeholder="Search terms (comma-separated)" />
          </div>
        ))}
      </div>
      <button onClick={() => onUpdate(local)} style={{
        marginTop: "0.75rem", width: "100%", padding: "0.6rem",
        background: "#5b9bd5", border: "none", borderRadius: 8,
        color: "#fff", fontWeight: 600, fontSize: "0.85rem",
        cursor: "pointer", fontFamily: "inherit",
      }}>
        Apply theme changes
      </button>
    </div>
  );
}

// ─── Tab: Display ─────────────────────────────────────────────────────────────
function DisplayTab({ config, onUpdate, themes }) {
  const [local, setLocal] = useState(config);
  const allThemeIds = themes.map(t => t.id);
  const visibleThemes = local.visibleThemes || allThemeIds;

  useEffect(() => { setLocal(config); }, [config]);

  const toggleTheme = (id) => {
    const next = visibleThemes.includes(id)
      ? visibleThemes.filter(t => t !== id)
      : [...visibleThemes, id];
    if (next.length === 0) return;
    setLocal(l => ({ ...l, visibleThemes: next }));
  };

  return (
    <div>
      <div style={sectionHead}>In the News</div>
      <div style={{ marginBottom: "0.4rem" }}><span style={label}>Attention window</span></div>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {TIMEFRAME_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => setLocal(l => ({ ...l, timeframe: opt.value }))}
            style={pill(local.timeframe === opt.value)}>
            {opt.label}
          </button>
        ))}
      </div>
      <div style={{ marginBottom: "0.4rem" }}><span style={label}>Papers shown</span></div>
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem" }}>
        {[10, 25, 50].map(n => (
          <button key={n} onClick={() => setLocal(l => ({ ...l, paperCount: n }))}
            style={pill(local.paperCount === n)}>
            {n}
          </button>
        ))}
      </div>

      <div style={sectionHead}>What We Do — visible themes</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1rem" }}>
        {themes.map(t => (
          <label key={t.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
            <input type="checkbox" checked={visibleThemes.includes(t.id)}
              onChange={() => toggleTheme(t.id)}
              style={{ accentColor: "#5b9bd5", width: 14, height: 14 }} />
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>
              {t.icon} {t.label}
            </span>
          </label>
        ))}
      </div>

      <button onClick={() => onUpdate(local)} style={{
        width: "100%", padding: "0.65rem",
        background: "#5b9bd5", border: "none", borderRadius: 8,
        color: "#fff", fontWeight: 600, fontSize: "0.85rem",
        cursor: "pointer", fontFamily: "inherit",
      }}>
        Save display preferences
      </button>
      <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: "0.5rem" }}>
        Applies immediately and persists in your browser.
      </p>
    </div>
  );
}

// ─── Main Settings component ──────────────────────────────────────────────────
export default function Settings({ displayConfig, onDisplayUpdate, contentConfig, onContentSave }) {
  const [open, setOpen]       = useState(false);
  const [authed, setAuthed]   = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [tab, setTab]         = useState("embed");
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const close = () => { setOpen(false); setAuthed(false); setPwInput(""); setSaveMsg(null); };

  const handleUnlock = () => {
    if (pwInput === PASSWORD) { setAuthed(true); setPwError(false); }
    else { setPwError(true); setPwInput(""); }
  };

  // Save content (members / themes) to server via /api/save-config
  const saveContent = async (universities, themes) => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const r = await fetch("/api/save-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwInput || PASSWORD, universities, themes }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Save failed");
      onContentSave({ universities, themes });
      setSaveMsg({ ok: true, text: "Saved — changes are now live for all users." });
    } catch (err) {
      setSaveMsg({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleMembersUpdate = (universities) => saveContent(universities, contentConfig.themes);
  const handleThemesUpdate  = (themes)       => saveContent(contentConfig.universities, themes);

  const TABS = [
    { id: "embed",   label: "Embed links" },
    { id: "members", label: "Members" },
    { id: "themes",  label: "Themes" },
    { id: "display", label: "Display" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Dashboard settings"
        style={{
          position: "fixed", top: "0.6rem", right: "1.25rem", zIndex: 300,
          background: "transparent", border: "none", cursor: "pointer",
          color: "rgba(255,255,255,0.35)", fontSize: "1.1rem",
          padding: "0.4rem", borderRadius: 6, transition: "color 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.75)"}
        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
      >
        ⚙
      </button>

      {open && (
        <div onClick={e => e.target === e.currentTarget && close()} style={{
          position: "fixed", inset: 0, zIndex: 400,
          background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#0f1828", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, padding: "1.75rem",
            width: "min(540px, 95vw)", maxHeight: "90vh",
            display: "flex", flexDirection: "column",
            fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.85)",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 300, fontSize: "1.25rem", margin: 0 }}>
                Dashboard settings
              </h2>
              <button onClick={close} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
            </div>

            {!authed ? (
              <div>
                <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>
                  Enter the settings password to make changes.
                </p>
                <input type="password" value={pwInput}
                  onChange={e => setPwInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleUnlock()}
                  placeholder="Password" autoFocus
                  style={{ ...input, borderColor: pwError ? "#e07060" : "rgba(255,255,255,0.12)" }}
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
              <>
                {/* Tabs */}
                <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "0.75rem" }}>
                  {TABS.map(t => (
                    <button key={t.id} onClick={() => { setTab(t.id); setSaveMsg(null); }}
                      style={{
                        padding: "0.3rem 0.7rem", borderRadius: 6, border: "none",
                        background: tab === t.id ? "rgba(91,155,213,0.2)" : "transparent",
                        color: tab === t.id ? "#5b9bd5" : "rgba(255,255,255,0.4)",
                        fontSize: "0.78rem", fontWeight: tab === t.id ? 600 : 400,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Save status */}
                {saveMsg && (
                  <div style={{
                    marginBottom: "0.85rem", padding: "0.6rem 0.85rem", borderRadius: 7,
                    background: saveMsg.ok ? "rgba(92,170,114,0.15)" : "rgba(224,112,96,0.15)",
                    border: `1px solid ${saveMsg.ok ? "#5caa72" : "#e07060"}40`,
                    fontSize: "0.75rem",
                    color: saveMsg.ok ? "#5caa72" : "#e07060",
                  }}>
                    {saving ? "Saving…" : saveMsg.text}
                  </div>
                )}

                {/* Tab content */}
                <div style={{ overflowY: "auto", flex: 1 }}>
                  {tab === "embed"   && <EmbedTab />}
                  {tab === "members" && <MembersTab universities={contentConfig.universities} onUpdate={handleMembersUpdate} />}
                  {tab === "themes"  && <ThemesTab  themes={contentConfig.themes}             onUpdate={handleThemesUpdate} />}
                  {tab === "display" && <DisplayTab config={displayConfig} onUpdate={onDisplayUpdate} themes={contentConfig.themes} />}
                </div>

                {(tab === "members" || tab === "themes") && (
                  <p style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.18)", marginTop: "0.75rem", textAlign: "center" }}>
                    Changes are saved to the server and immediately visible to all users.{" "}
                    Requires Vercel KV to be connected in your project.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
