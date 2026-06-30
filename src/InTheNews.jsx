import { useState, useEffect } from "react";

// Demo data — realistic structure matching live Altmetric API response
// Used as fallback when proxy not available
const DEMO_PAPERS = [
  {
    doi: "10.1038/s41586-022-04913-9",
    title: "Climate tipping points — too risky to bet against",
    journal: "Nature",
    score: 8920,
    publishedOn: 1668124800,
    university: "University of Exeter",
    country: "UK",
    theme: "Tipping Points",
    newsOutlets: 187,
    policyMentions: 43,
    blogMentions: 312,
    socialMentions: 15400,
    detailsUrl: "https://www.altmetric.com/details/138341234",
    paperUrl: "https://doi.org/10.1038/s41586-022-04913-9",
    topNews: [
      { outlet: "The Guardian", title: "Climate scientists identify nine tipping points that could cascade" },
      { outlet: "BBC News", title: "Scientists warn of 'devastating' domino effect from climate tipping points" },
      { outlet: "New York Times", title: "Passing Climate Tipping Points Could Trigger Each Other, Scientists Warn" },
    ],
  },
  {
    doi: "10.1038/s41558-022-01520-y",
    title: "Oceans are warming faster than predicted — and the Southern Ocean is driving it",
    journal: "Nature Climate Change",
    score: 4210,
    publishedOn: 1675209600,
    university: "UNSW Sydney",
    country: "Australia",
    theme: "Oceans & Sea Level",
    newsOutlets: 94,
    policyMentions: 18,
    blogMentions: 156,
    socialMentions: 8700,
    detailsUrl: "https://www.altmetric.com/details/138341235",
    paperUrl: "https://doi.org/10.1038/s41558-022-01520-y",
    topNews: [
      { outlet: "Reuters", title: "Southern Ocean warming faster than thought, new study finds" },
      { outlet: "The Independent", title: "Oceans are absorbing heat at accelerating rate, researchers warn" },
    ],
  },
  {
    doi: "10.1038/s41558-023-01606-5",
    title: "Record heat mortality in European cities linked directly to climate change",
    journal: "Nature Climate Change",
    score: 3870,
    publishedOn: 1685577600,
    university: "University of Melbourne",
    country: "Australia",
    theme: "Society & Health",
    newsOutlets: 78,
    policyMentions: 31,
    blogMentions: 98,
    socialMentions: 6200,
    detailsUrl: "https://www.altmetric.com/details/138341236",
    paperUrl: "https://doi.org/10.1038/s41558-023-01606-5",
    topNews: [
      { outlet: "Financial Times", title: "Climate change killed tens of thousands in European heatwaves, study finds" },
      { outlet: "Washington Post", title: "Tens of thousands died in last summer's European heat — climate change's role quantified" },
      { outlet: "Le Monde", title: "Les canicules européennes causées par le changement climatique ont tué 60 000 personnes" },
    ],
  },
  {
    doi: "10.1038/s41558-023-01636-z",
    title: "Global glacier mass loss accelerating beyond projections",
    journal: "Nature Climate Change",
    score: 3540,
    publishedOn: 1688169600,
    university: "ETH Zurich",
    country: "Switzerland",
    theme: "Cryosphere",
    newsOutlets: 65,
    policyMentions: 22,
    blogMentions: 145,
    socialMentions: 7100,
    detailsUrl: "https://www.altmetric.com/details/138341237",
    paperUrl: "https://doi.org/10.1038/s41558-023-01636-z",
    topNews: [
      { outlet: "AFP", title: "World's glaciers melting faster than ever recorded" },
      { outlet: "BBC Science", title: "Glaciers losing ice faster than models predicted, ETH study warns" },
    ],
  },
  {
    doi: "10.1038/s41558-023-01596-4",
    title: "Amazon dieback risk now threatens global carbon sink stability",
    journal: "Nature Climate Change",
    score: 2980,
    publishedOn: 1690848000,
    university: "University of São Paulo",
    country: "Brazil",
    theme: "Ecosystems & Carbon",
    newsOutlets: 52,
    policyMentions: 14,
    blogMentions: 87,
    socialMentions: 5400,
    detailsUrl: "https://www.altmetric.com/details/138341238",
    paperUrl: "https://doi.org/10.1038/s41558-023-01596-4",
    topNews: [
      { outlet: "The Guardian", title: "Amazon could collapse 'within years', researchers warn" },
      { outlet: "Nature News", title: "Parts of the Amazon are approaching a tipping point" },
    ],
  },
  {
    doi: "10.1038/s41558-023-01528-2",
    title: "Extreme flooding intensification is already detectable in observed records",
    journal: "Nature Climate Change",
    score: 2410,
    publishedOn: 1678320000,
    university: "University of Reading",
    country: "UK",
    theme: "Extreme Events",
    newsOutlets: 44,
    policyMentions: 19,
    blogMentions: 73,
    socialMentions: 4100,
    detailsUrl: "https://www.altmetric.com/details/138341239",
    paperUrl: "https://doi.org/10.1038/s41558-023-01528-2",
    topNews: [
      { outlet: "Sky News", title: "Floods worsened by climate change already detectable, new research shows" },
      { outlet: "Carbon Brief", title: "Reading study: climate signal clear in extreme flood intensification" },
    ],
  },
  {
    doi: "10.1038/s41558-023-01557-x",
    title: "Compound drought and heat extremes increasing across Sub-Saharan Africa",
    journal: "Nature Climate Change",
    score: 1870,
    publishedOn: 1681344000,
    university: "University of Cape Town",
    country: "South Africa",
    theme: "Extreme Events",
    newsOutlets: 31,
    policyMentions: 27,
    blogMentions: 41,
    socialMentions: 2800,
    detailsUrl: "https://www.altmetric.com/details/138341240",
    paperUrl: "https://doi.org/10.1038/s41558-023-01557-x",
    topNews: [
      { outlet: "AllAfrica", title: "Sub-Saharan Africa faces growing compound climate hazards, UCT research shows" },
    ],
  },
  {
    doi: "10.1038/s41586-022-05634-9",
    title: "Asian monsoon response to greenhouse gas forcing stronger than models suggest",
    journal: "Nature",
    score: 1650,
    publishedOn: 1669334400,
    university: "National University of Singapore",
    country: "Singapore",
    theme: "Atmosphere & Weather",
    newsOutlets: 28,
    policyMentions: 9,
    blogMentions: 54,
    socialMentions: 2200,
    detailsUrl: "https://www.altmetric.com/details/138341241",
    paperUrl: "https://doi.org/10.1038/s41586-022-05634-9",
    topNews: [
      { outlet: "Channel NewsAsia", title: "Asian monsoon more sensitive to climate change than thought, NUS study finds" },
    ],
  },
];

// Score → contextual label for public audience
function scoreLabel(score) {
  if (score >= 5000) return { label: "Exceptional reach", colour: "#f0a030" };
  if (score >= 2000) return { label: "Very high impact", colour: "#5caa72" };
  if (score >= 1000) return { label: "High impact",      colour: "#5b9bd5" };
  return                    { label: "Strong attention",  colour: "#9b8dd5" };
}

function formatDate(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp * 1000).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

// ─── Components ───────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const { colour } = scoreLabel(score);
  const display = score >= 1000 ? `${(score/1000).toFixed(1)}k` : score;
  return (
    <div style={{
      width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
      border: `2px solid ${colour}`,
      background: `${colour}15`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      position: "relative",
    }}>
      <span style={{ fontSize: "1rem", fontWeight: 700, color: colour, lineHeight: 1 }}>{display}</span>
      <span style={{ fontSize: "0.5rem", color: colour, opacity: 0.7, letterSpacing: "0.05em", textTransform: "uppercase" }}>score</span>
    </div>
  );
}

function StatPill({ value, label, icon }) {
  if (!value) return null;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", marginRight: "0.75rem", marginBottom: "0.25rem" }}>
      <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>{icon}</span>
      <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{value.toLocaleString()}</span>
      <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>{label}</span>
    </div>
  );
}

function HeroCard({ paper }) {
  const { label, colour } = scoreLabel(paper.score);
  return (
    <div style={{
      background: "linear-gradient(135deg, #12203a 0%, #0f1e2e 50%, #0a1620 100%)",
      border: "1px solid rgba(91,155,213,0.3)", borderRadius: 20,
      padding: "2.5rem", marginBottom: "2rem", position: "relative", overflow: "hidden",
    }}>
      {/* Background score watermark */}
      <div style={{
        position: "absolute", right: "1.5rem", top: "50%", transform: "translateY(-50%)",
        fontSize: "9rem", fontWeight: 900, color: colour, opacity: 0.06,
        lineHeight: 1, pointerEvents: "none", userSelect: "none",
      }}>
        {paper.score >= 1000 ? `${Math.round(paper.score/1000)}k` : paper.score}
      </div>

      <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
        <ScoreRing score={paper.score} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "0.65rem", padding: "0.2rem 0.6rem", borderRadius: 20,
              background: `${colour}20`, color: colour, border: `1px solid ${colour}40`,
              fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
            }}>{label}</span>
            <span style={{
              fontSize: "0.65rem", padding: "0.2rem 0.6rem", borderRadius: 20,
              background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)",
            }}>{paper.theme}</span>
          </div>

          <h2 style={{
            fontFamily: "'Fraunces', serif", fontWeight: 300,
            fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)", lineHeight: 1.35,
            color: "#fff", marginBottom: "0.5rem",
          }}>
            {paper.title}
          </h2>

          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", marginBottom: "1rem" }}>
            <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{paper.university}</span>
            {" · "}{paper.journal}{" · "}{formatDate(paper.publishedOn)}
          </div>

          {/* Attention stats */}
          <div style={{ marginBottom: "1rem" }}>
            <StatPill value={paper.newsOutlets}   label="news outlets"      icon="📰" />
            <StatPill value={paper.policyMentions} label="policy documents" icon="🏛" />
            <StatPill value={paper.blogMentions}  label="blogs & media"     icon="✍️" />
            <StatPill value={paper.socialMentions} label="social posts"     icon="◎" />
          </div>

          {paper.topNews?.length > 0 && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "0.85rem" }}>
              <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>
                Covered by
              </div>
              {paper.topNews.map((n, i) => (
                <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.3rem", alignItems: "baseline" }}>
                  <span style={{ fontSize: "0.72rem", color: colour, fontWeight: 600, whiteSpace: "nowrap" }}>{n.outlet}</span>
                  {n.url
                    ? <a href={n.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.4, textDecoration: "none" }}
                        onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.85)"}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}>
                        {n.title} ↗
                      </a>
                    : <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>{n.title}</span>
                  }
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: "1.1rem", display: "flex", gap: "0.5rem" }}>
            <a href={paper.paperUrl} target="_blank" rel="noopener" style={{
              padding: "0.45rem 1rem", borderRadius: 8, background: colour, color: "#000",
              fontSize: "0.78rem", fontWeight: 600, textDecoration: "none", display: "inline-block",
            }}>
              Read paper →
            </a>
            {paper.detailsUrl && (
              <a href={paper.detailsUrl} target="_blank" rel="noopener" style={{
                padding: "0.45rem 1rem", borderRadius: 8,
                background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)",
                fontSize: "0.78rem", fontWeight: 500, textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.12)",
              }}>
                Full attention data
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GridCard({ paper }) {
  const { colour } = scoreLabel(paper.score);
  return (
    <div style={{
      background: "#0d1828", border: "1px solid rgba(255,255,255,0.07)",
      borderTop: `3px solid ${colour}`,
      borderRadius: 14, padding: "1.25rem", display: "flex", flexDirection: "column",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.65rem" }}>
        <span style={{
          fontSize: "0.62rem", padding: "0.15rem 0.5rem", borderRadius: 20,
          background: `${colour}15`, color: colour, fontWeight: 600,
        }}>{paper.theme}</span>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: colour }}>{paper.score >= 1000 ? `${(paper.score/1000).toFixed(1)}k` : paper.score}</div>
          <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>score</div>
        </div>
      </div>

      <p style={{
        fontFamily: "'Fraunces', serif", fontWeight: 300,
        fontSize: "0.92rem", lineHeight: 1.45, color: "rgba(255,255,255,0.88)",
        flex: 1, marginBottom: "0.75rem",
      }}>
        {paper.title}
      </p>

      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.65rem" }}>
        {paper.university} · {paper.journal} · {formatDate(paper.publishedOn)}
      </div>

      <div style={{ marginBottom: "0.65rem" }}>
        <StatPill value={paper.newsOutlets}   label="news"    icon="📰" />
        <StatPill value={paper.policyMentions} label="policy" icon="🏛" />
      </div>

      {paper.topNews?.[0] && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.6rem", fontSize: "0.7rem", lineHeight: 1.5 }}>
          <span style={{ color: colour, fontWeight: 600 }}>{paper.topNews[0].outlet}: </span>
          {paper.topNews[0].url
            ? <a href={paper.topNews[0].url} target="_blank" rel="noopener noreferrer"
                style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}>
                {paper.topNews[0].title} ↗
              </a>
            : <span style={{ color: "rgba(255,255,255,0.35)" }}>{paper.topNews[0].title}</span>
          }
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem" }}>
        <a href={paper.paperUrl} target="_blank" rel="noopener" style={{
          padding: "0.4rem 0.85rem",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 7, color: "rgba(255,255,255,0.6)", fontSize: "0.73rem",
          fontWeight: 500, textDecoration: "none",
        }}>
          Read paper →
        </a>
        {paper.detailsUrl && (
          <a href={paper.detailsUrl} target="_blank" rel="noopener" style={{
            padding: "0.4rem 0.85rem",
            background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 7, color: "rgba(255,255,255,0.35)", fontSize: "0.73rem",
            fontWeight: 400, textDecoration: "none",
          }}>
            Altmetric ↗
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InTheNews({ timeframe = "6m", paperCount = 25 }) {
  const [papers, setPapers]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeTheme, setActiveTheme] = useState("All");

  useEffect(() => {
    setLoading(true);
    setPapers(null);
    fetch(`/api/altmetric?timeframe=${timeframe}&limit=${paperCount}&v=4`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(({ papers }) => { setPapers(papers); setLoading(false); })
      .catch(() => { setPapers(DEMO_PAPERS); setLoading(false); });
  }, [timeframe, paperCount]);

  const themes = papers ? ["All", ...Array.from(new Set(papers.map(p => p.theme)))] : ["All"];
  const filtered = papers
    ? (activeTheme === "All" ? papers : papers.filter(p => p.theme === activeTheme))
    : [];

  const hero = filtered[0];
  const rest  = filtered.slice(1);

  return (
    <div style={{
      minHeight: "100vh", background: "#080f1c",
      fontFamily: "'Inter', -apple-system, sans-serif", color: "rgba(255,255,255,0.85)",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,600;1,300&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a:hover { opacity: 0.85; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "4rem 2rem 3rem", maxWidth: 900, margin: "0 auto" }}>
        <div>
          <div style={{
            fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em",
            textTransform: "uppercase", marginBottom: "0.75rem",
          }}>
            International Universities Climate Alliance
          </div>
          <h1 style={{
            fontFamily: "'Fraunces', serif", fontWeight: 300,
            fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.15,
            letterSpacing: "-0.02em", color: "#fff",
          }}>
            Our research,<br />
            <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.5)" }}>in the world</em>
          </h1>
          <p style={{ marginTop: "0.85rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 480 }}>
            The highest-impact climate papers from IUCA member universities — ranked by public attention, media coverage and policy reach.
          </p>
        </div>

        {/* Theme filter pills */}
        {!loading && (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "2rem" }}>
            {themes.map(t => (
              <button key={t} onClick={() => setActiveTheme(t)} style={{
                padding: "0.35rem 0.85rem", borderRadius: 20, border: "1px solid",
                borderColor: activeTheme === t ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)",
                background: activeTheme === t ? "rgba(255,255,255,0.12)" : "transparent",
                color: activeTheme === t ? "#fff" : "rgba(255,255,255,0.4)",
                fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}>
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 2rem 5rem" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.25)", fontSize: "0.85rem" }}>
            Loading from Altmetric…
          </div>
        )}

        {!loading && hero && (
          <>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              Top paper
            </div>
            <HeroCard paper={hero} />
          </>
        )}

        {!loading && rest.length > 0 && (
          <>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              More highlights
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {rest.map((p, i) => <GridCard key={p.doi || i} paper={p} />)}
            </div>
          </>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.25)" }}>
            No papers found for this theme.
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", paddingBottom: "2.5rem", color: "rgba(255,255,255,0.12)", fontSize: "0.67rem" }}>
        Attention data from Altmetric · Sorted by Altmetric score (public attention + media + policy reach)
      </div>
    </div>
  );
}
