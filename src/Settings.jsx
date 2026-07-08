import { useState, useEffect } from "react";
import { CLIMATE_AREAS } from "./climate-areas.js";

const PASSWORD = "iuca2024";

// ─── Display config (localStorage) ───────────────────────────────────────────
const TIMEFRAME_OPTIONS = [
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "1y", label: "Last year" },
  { value: "3y", label: "Last 3 years" },
  { value: "5y", label: "Last 5 years" },
];

export const DEFAULT_DISPLAY = {
  timeframe:    "6m",
  paperCount:   10,
  visibleAreas: null, // null = all areas visible
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
  const [linkStatus, setLinkStatus] = useState(null); // { url: true/false }
  const [checking, setChecking] = useState(false);

  useEffect(() => { setText(universitiesToText(universities)); }, [universities]);

  function universitiesToText(unis) {
    return unis.map(u => `${u.name} | ${u.flag} | ${u.researchUrl}`).join("\n");
  }

  function textToUniversities(raw) {
    // Preserve gridId (used by Altmetric matching) and scopusId by looking them
    // up from the current member list by name — they're stable and not edited here.
    const byName = Object.fromEntries(universities.map(u => [u.name, u]));
    return raw.split("\n")
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const parts = line.split("|").map(s => s.trim());
        const name  = parts[0] || "";
        const prev  = byName[name] || {};
        return {
          name,
          flag:        parts[1] || "🌍",
          researchUrl: parts[2] || "",
          gridId:      prev.gridId   || "",
          scopusId:    prev.scopusId || "",
        };
      })
      .filter(u => u.name);
  }

  async function verifyLinks() {
    const parsed = textToUniversities(text);
    const urls = parsed.map(u => u.researchUrl).filter(u => u && u.startsWith("http"));
    if (!urls.length) return;
    setChecking(true);
    setLinkStatus(null);
    try {
      const r = await fetch("/api/check-links", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      if (r.ok) setLinkStatus((await r.json()).results);
    } catch {}
    setChecking(false);
  }

  const parsed = textToUniversities(text);
  const valid = parsed.length > 0;

  // Count dead links if we have results
  const deadCount = linkStatus
    ? parsed.filter(u => u.researchUrl && linkStatus[u.researchUrl] === false).length
    : null;

  return (
    <div>
      <div style={sectionHead}>Member universities — {parsed.length} entries</div>
      <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.75rem", lineHeight: 1.6 }}>
        One university per line. Format: <code style={{ background: "rgba(255,255,255,0.08)", padding: "0.1rem 0.3rem", borderRadius: 3 }}>Name | 🏳️ | Research URL</code><br />
        To remove a member, delete their line. To add one, paste a new line at the bottom.
      </p>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setLinkStatus(null); }}
        style={{ ...textarea, minHeight: 320, fontFamily: "monospace", fontSize: "0.72rem" }}
        spellCheck={false}
      />

      {/* Link verification results */}
      {linkStatus && (
        <div style={{
          marginTop: "0.5rem", padding: "0.6rem 0.85rem", borderRadius: 7, fontSize: "0.73rem", lineHeight: 1.7,
          background: deadCount > 0 ? "rgba(224,112,96,0.12)" : "rgba(92,170,114,0.12)",
          border: `1px solid ${deadCount > 0 ? "#e07060" : "#5caa72"}40`,
          color: deadCount > 0 ? "#e07060" : "#5caa72",
        }}>
          {deadCount > 0
            ? `${deadCount} dead link${deadCount > 1 ? "s" : ""} found. Lines with ❌ have unreachable URLs — update or clear the URL field for those universities.`
            : "All research links are reachable ✓"}
          {deadCount > 0 && (
            <ul style={{ marginTop: "0.4rem", paddingLeft: "1.2rem" }}>
              {parsed.filter(u => u.researchUrl && linkStatus[u.researchUrl] === false).map(u => (
                <li key={u.name}>{u.name} — <span style={{ fontFamily: "monospace", fontSize: "0.68rem" }}>{u.researchUrl}</span></li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
        <button onClick={verifyLinks} disabled={checking || !valid}
          style={{
            flex: 1, padding: "0.6rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)",
            background: "transparent", color: checking ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.6)",
            fontSize: "0.8rem", cursor: checking ? "default" : "pointer", fontFamily: "inherit",
          }}>
          {checking ? "Checking links…" : "Verify research links"}
        </button>
        <button
          disabled={!valid}
          onClick={() => onUpdate(parsed)}
          style={{
            flex: 2, padding: "0.6rem",
            background: valid ? "#5b9bd5" : "rgba(255,255,255,0.08)",
            border: "none", borderRadius: 8,
            color: valid ? "#fff" : "rgba(255,255,255,0.25)",
            fontWeight: 600, fontSize: "0.85rem", cursor: valid ? "pointer" : "default",
            fontFamily: "inherit",
          }}>
          Apply member changes
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Topics ──────────────────────────────────────────────────────────────
// Area-level visibility. The area→cluster mapping is hardwired in
// src/climate-areas.js; this just toggles which areas appear on What We Do.
function TopicsTab({ visibleAreas, onUpdate }) {
  // null in config = all areas visible
  const [selected, setSelected] = useState(() =>
    visibleAreas ? new Set(visibleAreas) : new Set(CLIMATE_AREAS.map(a => a.id))
  );

  useEffect(() => {
    setSelected(visibleAreas ? new Set(visibleAreas) : new Set(CLIMATE_AREAS.map(a => a.id)));
  }, [visibleAreas]);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); } // keep at least one
      else next.add(id);
      return next;
    });
  };

  const selectAll  = () => setSelected(new Set(CLIMATE_AREAS.map(a => a.id)));
  const selectNone = () => setSelected(new Set([CLIMATE_AREAS[0].id]));

  const allSelected = selected.size === CLIMATE_AREAS.length;

  return (
    <div>
      <div style={sectionHead}>What We Do — visible research areas</div>
      <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.85rem", lineHeight: 1.6 }}>
        The nine research areas and the SciVal topic clusters behind them are curated in the code.
        Tick the areas to show in the accordion — IUCA papers are matched into them automatically.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <button onClick={selectAll}  style={{ ...pill(false), fontSize: "0.7rem" }}>Select all</button>
        <button onClick={selectNone} style={{ ...pill(false), fontSize: "0.7rem" }}>Clear</button>
        <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", marginLeft: "auto", alignSelf: "center" }}>
          {selected.size} of {CLIMATE_AREAS.length} selected
        </span>
      </div>

      <div style={{ maxHeight: 340, overflowY: "auto", paddingRight: "0.25rem" }}>
        {CLIMATE_AREAS.map(a => {
          const active = selected.has(a.id);
          return (
            <label key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer", padding: "0.45rem 0" }}>
              <input type="checkbox" checked={active} onChange={() => toggle(a.id)}
                style={{ accentColor: "#5b9bd5", width: 14, height: 14, flexShrink: 0, marginTop: 3 }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)" }}>
                  {a.name}
                </span>
                <span style={{ display: "block", fontSize: "0.68rem", color: "rgba(255,255,255,0.28)", marginTop: "0.1rem" }}>
                  {a.clusters.length} clusters
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <button onClick={() => onUpdate(allSelected ? null : [...selected])} style={{
        marginTop: "0.85rem", width: "100%", padding: "0.6rem",
        background: "#5b9bd5", border: "none", borderRadius: 8,
        color: "#fff", fontWeight: 600, fontSize: "0.85rem",
        cursor: "pointer", fontFamily: "inherit",
      }}>
        Apply area filter
      </button>
    </div>
  );
}

// ─── Tab: Display ─────────────────────────────────────────────────────────────
function DisplayTab({ config, onUpdate }) {
  const [local, setLocal] = useState(config);
  useEffect(() => { setLocal(config); }, [config]);

  return (
    <div>
      <div style={sectionHead}>Our Impact — attention window</div>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {TIMEFRAME_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => setLocal(l => ({ ...l, timeframe: opt.value }))}
            style={pill(local.timeframe === opt.value)}>
            {opt.label}
          </button>
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

  // Save content (members / subjectCodes) to server via /api/save-config
  const saveContent = async (universities, subjectCodes) => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const r = await fetch("/api/save-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwInput || PASSWORD, universities, subjectCodes }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Save failed");
      onContentSave({ universities, subjectCodes });
      setSaveMsg({ ok: true, text: "Saved — changes are now live for all users." });
    } catch (err) {
      setSaveMsg({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleMembersUpdate      = (universities)  => saveContent(universities, contentConfig.subjectCodes);
  const handleTopicsUpdate       = (visibleAreas)  => onDisplayUpdate({ ...displayConfig, visibleAreas });

  const TABS = [
    { id: "embed",   label: "Embed links" },
    { id: "members", label: "Members" },
    { id: "topics",  label: "Areas" },
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
                  {tab === "embed"    && <EmbedTab />}
                  {tab === "members"  && <MembersTab universities={contentConfig.universities} onUpdate={handleMembersUpdate} />}
                  {tab === "topics"   && <TopicsTab  visibleAreas={displayConfig.visibleAreas} onUpdate={handleTopicsUpdate} />}
                  {tab === "display"  && <DisplayTab config={displayConfig} onUpdate={onDisplayUpdate} />}
                </div>

                {tab === "members" && (
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
