import { useState, useEffect } from "react";

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

export default function InTheNews({ timeframe = "1y", paperCount = 30, subjectCodes = null }) {
  const [papers, setPapers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setPapers(null);
    setError(null);
    const params = new URLSearchParams({ timeframe, limit: paperCount, v: "8" });
    if (subjectCodes?.length) params.set("subjects", subjectCodes.join(","));
    fetch(`/api/altmetric?${params}`)
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
      .then(({ papers }) => { setPapers(papers || []); setLoading(false); })
      .catch(err => { setError(err?.error || String(err)); setLoading(false); });
  }, [timeframe, paperCount, subjectCodes]);

  return (
    <div style={{
      minHeight: "100vh", background: "#080f1c",
      fontFamily: "'Inter', -apple-system, sans-serif", color: "rgba(255,255,255,0.85)",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,600;1,300&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div style={{ padding: "4rem 2rem 3rem", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          International Universities Climate Alliance
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 300, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.15, letterSpacing: "-0.02em", color: "#fff" }}>
          Our research,<br />
          <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.5)" }}>in the world</em>
        </h1>
        <p style={{ marginTop: "0.85rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 520 }}>
          The highest-attention climate papers from IUCA member universities — ranked by Altmetric score,
          which measures media coverage, policy citations and social reach.
        </p>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 2rem 5rem" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.25)", fontSize: "0.85rem" }}>
            Loading from Altmetric…
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

        {papers?.map((p, i) => {
          const colour = scoreColour(p.score);
          return (
            <div key={p.doi || i} style={{
              display: "flex", gap: "1.25rem", alignItems: "flex-start",
              padding: "1.25rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              {/* Rank + score ring */}
              <div style={{ flexShrink: 0, textAlign: "center", width: 56 }}>
                <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.18)", marginBottom: "0.25rem" }}>#{i + 1}</div>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  border: `2px solid ${colour}`, background: `${colour}15`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: "0.88rem", fontWeight: 700, color: colour, lineHeight: 1 }}>
                    {p.score >= 1000 ? `${(p.score / 1000).toFixed(1)}k` : p.score}
                  </span>
                  <span style={{ fontSize: "0.4rem", color: colour, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.03em" }}>altmetric</span>
                </div>
              </div>

              {/* Paper info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <a
                  href={p.paperUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", display: "block", marginBottom: "0.35rem" }}
                >
                  <span style={{
                    fontFamily: "'Fraunces', serif", fontWeight: 300,
                    fontSize: "1rem", lineHeight: 1.45, color: "rgba(255,255,255,0.9)",
                    display: "inline",
                    transition: "color 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = colour}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.9)"}
                  >
                    {p.title} ↗
                  </span>
                </a>

                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.5rem" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{p.university}</span>
                  {p.journal     ? ` · ${p.journal}`              : ""}
                  {p.publishedOn ? ` · ${formatDate(p.publishedOn)}` : ""}
                </div>

                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                  {p.newsOutlets    > 0 && <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.28)" }}>{p.newsOutlets} news outlets</span>}
                  {p.policyMentions > 0 && <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.28)" }}>{p.policyMentions} policy docs</span>}
                  {p.socialMentions > 0 && <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.28)" }}>{p.socialMentions.toLocaleString()} social</span>}
                  {p.detailsUrl && (
                    <a href={p.detailsUrl} target="_blank" rel="noopener" style={{ fontSize: "0.7rem", color: colour, textDecoration: "none", opacity: 0.8 }}>
                      Full attention data ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: "center", paddingBottom: "2.5rem", color: "rgba(255,255,255,0.12)", fontSize: "0.67rem" }}>
        Attention data from Altmetric · Sorted by Altmetric score
      </div>
    </div>
  );
}
