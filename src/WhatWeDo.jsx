import { useState, useEffect } from "react";

// ─── Curated top-level themes ─────────────────────────────────────────────────
const THEMES = [
  {
    id: "atmosphere",
    label: "Atmosphere & Weather",
    icon: "◎",
    colour: "#5b9bd5",
    bg: "#0d1e32",
    description: "Forecasting, atmospheric dynamics, air quality and the physics of our changing skies.",
    scopusTerms: ["atmospheric dynamics","numerical weather prediction","climate modelling","air quality","aerosols","atmospheric chemistry","jet stream","precipitation"],
  },
  {
    id: "oceans",
    label: "Oceans & Sea Level",
    icon: "≋",
    colour: "#3ab5c6",
    bg: "#091e24",
    description: "Ocean heat, circulation, sea level rise, acidification and marine ecosystems under pressure.",
    scopusTerms: ["ocean circulation","sea level rise","marine heatwaves","ocean acidification","southern ocean","ocean heat uptake","coastal flooding","thermohaline"],
  },
  {
    id: "cryosphere",
    label: "Ice, Snow & Permafrost",
    icon: "❄",
    colour: "#a8d4f0",
    bg: "#101824",
    description: "Glaciers, ice sheets, Arctic sea ice and the frozen ground releasing ancient carbon.",
    scopusTerms: ["glacier retreat","ice sheet dynamics","permafrost","arctic amplification","sea ice","cryosphere","snow cover","ice cores"],
  },
  {
    id: "ecosystems",
    label: "Ecosystems & Biodiversity",
    icon: "⬡",
    colour: "#5caa72",
    bg: "#0b1c12",
    description: "How climate change reshapes forests, wetlands, coral reefs and the species that depend on them.",
    scopusTerms: ["biodiversity","ecosystem services","deforestation","coral bleaching","peatland carbon","rewilding","species distribution","tropical forests"],
  },
  {
    id: "society",
    label: "Society & Adaptation",
    icon: "◈",
    colour: "#e8a44a",
    bg: "#1e1608",
    description: "Climate justice, health impacts, migration, urban resilience and how communities adapt.",
    scopusTerms: ["climate adaptation","climate justice","heat mortality","urban resilience","climate migration","climate health","food security","climate vulnerability"],
  },
  {
    id: "mitigation",
    label: "Mitigation & Clean Energy",
    icon: "◉",
    colour: "#c97fd4",
    bg: "#1a0f20",
    description: "Pathways to net zero: renewables, carbon capture, energy systems and emissions reduction.",
    scopusTerms: ["renewable energy","carbon capture","net zero","energy transition","solar photovoltaics","carbon budgets","decarbonisation","emissions reduction"],
  },
  {
    id: "food",
    label: "Food, Water & Land",
    icon: "◌",
    colour: "#d4a843",
    bg: "#1c1508",
    description: "Agricultural resilience, water security and land-use change in a warming world.",
    scopusTerms: ["food systems","water scarcity","agroecology","land use change","drought resilience","groundwater","irrigation","crop yield"],
  },
  {
    id: "extremes",
    label: "Extreme Events & Risk",
    icon: "⚡",
    colour: "#e07060",
    bg: "#1e0e0c",
    description: "Heatwaves, floods, wildfires and storms — attribution, prediction and disaster risk reduction.",
    scopusTerms: ["climate extremes","heatwaves","flood risk","wildfire","tropical cyclones","climate attribution","disaster risk","compound events"],
  },
];

const IUCA_UNIVERSITIES = [
  { name: "University of Reading",            flag: "🇬🇧", scopusId: "60006462", researchUrl: "https://research.reading.ac.uk/research-themes/climate-and-earth-system-science/" },
  { name: "University of Oxford",             flag: "🇬🇧", scopusId: "60023256", researchUrl: "https://www.ox.ac.uk/research/research-in-conversation/climate-change" },
  { name: "University of Cambridge",          flag: "🇬🇧", scopusId: "60025259", researchUrl: "https://www.cam.ac.uk/topics/climate-change" },
  { name: "University of Edinburgh",          flag: "🇬🇧", scopusId: "60003093", researchUrl: "https://www.ed.ac.uk/geosciences/research/climate-change" },
  { name: "University of Exeter",             flag: "🇬🇧", scopusId: "60001809", researchUrl: "https://www.exeter.ac.uk/research/institutes/globalchange/" },
  { name: "University of Leeds",              flag: "🇬🇧", scopusId: "60022452", researchUrl: "https://environment.leeds.ac.uk/" },
  { name: "King's College London",            flag: "🇬🇧", scopusId: "60003596", researchUrl: "https://www.kcl.ac.uk/research/climate" },
  { name: "University of Sussex",             flag: "🇬🇧", scopusId: "60020422", researchUrl: "https://www.sussex.ac.uk/research/centres/sussex-sustainability-research-programme/" },
  { name: "Sorbonne Université",              flag: "🇫🇷", scopusId: "60071311", researchUrl: "https://www.sorbonne-universite.fr/en/research/scientific-priorities/environment-and-climate" },
  { name: "ETH Zurich",                       flag: "🇨🇭", scopusId: "60028186", researchUrl: "https://ethz.ch/en/research/research-initiatives/climate.html" },
  { name: "University of Zurich",             flag: "🇨🇭", scopusId: "60028717", researchUrl: "https://www.uzh.ch/en/research/initiatives/climate.html" },
  { name: "University of Helsinki",           flag: "🇫🇮", scopusId: "60002026", researchUrl: "https://www.helsinki.fi/en/research-groups/climate-system-research" },
  { name: "University of Bremen",             flag: "🇩🇪", scopusId: "60007882", researchUrl: "https://www.marum.de/en/" },
  { name: "UNSW Sydney",                      flag: "🇦🇺", scopusId: "60031004", researchUrl: "https://www.ccrc.unsw.edu.au/" },
  { name: "University of Melbourne",          flag: "🇦🇺", scopusId: "60031226", researchUrl: "https://climate-energy.unimelb.edu.au/" },
  { name: "Monash University",                flag: "🇦🇺", scopusId: "60031229", researchUrl: "https://www.monash.edu/earth-atmosphere-environment" },
  { name: "University of Tasmania",           flag: "🇦🇺", scopusId: "60031244", researchUrl: "https://www.imas.utas.edu.au/" },
  { name: "National University of Singapore", flag: "🇸🇬", scopusId: "60071417", researchUrl: "https://www.nus.edu.sg/research/research-clusters/environment-and-sustainability" },
  { name: "Chinese University of Hong Kong",  flag: "🇭🇰", scopusId: "60074798", researchUrl: "https://www.issp.cuhk.edu.hk/" },
  { name: "University of Hong Kong",          flag: "🇭🇰", scopusId: "60008712", researchUrl: "https://www.earthsciences.hku.hk/research/" },
  { name: "Hokkaido University",              flag: "🇯🇵", scopusId: "60025272", researchUrl: "https://www.ees.hokudai.ac.jp/en/" },
  { name: "Nanjing University",               flag: "🇨🇳", scopusId: "60015498", researchUrl: "https://climate.nju.edu.cn/" },
  { name: "China University of Geosciences",  flag: "🇨🇳", scopusId: "60017001", researchUrl: "https://en.cugb.edu.cn/research.htm" },
  { name: "California Inst. of Technology",   flag: "🇺🇸", scopusId: "60006951", researchUrl: "https://climate.caltech.edu/" },
  { name: "Cornell University",               flag: "🇺🇸", scopusId: "60007776", researchUrl: "https://atkinson.cornell.edu/" },
  { name: "Yale University",                  flag: "🇺🇸", scopusId: "60021773", researchUrl: "https://environment.yale.edu/research" },
  { name: "New York University",              flag: "🇺🇸", scopusId: "60075336", researchUrl: "https://environment.nyu.edu/" },
  { name: "University of Colorado Boulder",   flag: "🇺🇸", scopusId: "60018043", researchUrl: "https://cires.colorado.edu/" },
  { name: "McGill University",                flag: "🇨🇦", scopusId: "60014099", researchUrl: "https://www.mcgill.ca/climateandatmosphericsciences/" },
  { name: "University of São Paulo",          flag: "🇧🇷", scopusId: "60003066", researchUrl: "https://www.iag.usp.br/international" },
  { name: "University of Nairobi",            flag: "🇰🇪", scopusId: "60003984", researchUrl: "https://climatescience.uonbi.ac.ke/" },
  { name: "University of Ghana",              flag: "🇬🇭", scopusId: "60003978", researchUrl: "https://www.ug.edu.gh/earth-environmental-sciences" },
  { name: "University of Cape Town",          flag: "🇿🇦", scopusId: "60003980", researchUrl: "https://www.africaclimatedev.uct.ac.za/" },
  { name: "TERI School of Advanced Studies",  flag: "🇮🇳", scopusId: "60070377", researchUrl: "https://www.terisas.ac.in/research" },
  { name: "University of the South Pacific",  flag: "🇫🇯", scopusId: "60004028", researchUrl: "https://www.usp.ac.fj/research/" },
];

// Demo subcategories per theme (used when no Scopus/Claude available)
const DEMO_SUBCATEGORIES = {
  atmosphere: [
    { label: "Weather Forecasting & Prediction", universities: ["University of Reading","University of Oxford","UNSW Sydney","Hokkaido University","University of Melbourne"] },
    { label: "Atmospheric Chemistry & Composition", universities: ["ETH Zurich","University of Leeds","Sorbonne Université","California Inst. of Technology","University of Cambridge"] },
    { label: "Climate Modelling & Projections", universities: ["University of Reading","University of Exeter","University of Hamburg","McGill University","Nanjing University"] },
    { label: "Air Quality & Pollution", universities: ["King's College London","University of Leeds","Chinese University of Hong Kong","National University of Singapore","Cornell University"] },
  ],
  oceans: [
    { label: "Ocean Heat & Circulation", universities: ["UNSW Sydney","University of Southampton","ETH Zurich","Hokkaido University","University of Tasmania"] },
    { label: "Sea Level Rise & Coastal Risk", universities: ["University of Reading","University of Melbourne","National University of Singapore","University of the South Pacific","Yale University"] },
    { label: "Marine Ecosystems & Acidification", universities: ["University of Tasmania","University of Cape Town","University of Bremen","University of British Columbia","McGill University"] },
    { label: "Southern & Arctic Oceans", universities: ["University of Cape Town","UNSW Sydney","McGill University","University of Bremen","Hokkaido University"] },
  ],
  cryosphere: [
    { label: "Glacier & Ice Sheet Dynamics", universities: ["ETH Zurich","University of Edinburgh","McGill University","University of Zurich","University of Colorado Boulder"] },
    { label: "Permafrost & Frozen Ground", universities: ["McGill University","Hokkaido University","University of Helsinki","ETH Zurich","University of Colorado Boulder"] },
    { label: "Arctic Sea Ice", universities: ["Hokkaido University","University of Bremen","McGill University","University of Reading","University of Edinburgh"] },
    { label: "Ice Cores & Palaeoclimate", universities: ["ETH Zurich","University of Cambridge","University of Colorado Boulder","Sorbonne Université","University of Zurich"] },
  ],
  ecosystems: [
    { label: "Tropical Forests & Deforestation", universities: ["University of São Paulo","University of Leeds","University of Exeter","Cornell University","Sorbonne Université"] },
    { label: "Peatlands & Wetland Carbon", universities: ["University of Edinburgh","University of Helsinki","McGill University","University of Leeds","Hokkaido University"] },
    { label: "Biodiversity & Species Responses", universities: ["University of Exeter","University of Cambridge","Yale University","University of Cape Town","University of Nairobi"] },
    { label: "Coral Reefs & Marine Biodiversity", universities: ["University of the South Pacific","UNSW Sydney","University of Queensland","University of Hong Kong","University of Cape Town"] },
  ],
  society: [
    { label: "Climate Health & Heat Mortality", universities: ["University of Melbourne","London School of Hygiene","Chinese University of Hong Kong","University of Nairobi","Yale University"] },
    { label: "Climate Justice & Equity", universities: ["University of Cape Town","University of Ghana","University of Nairobi","New York University","University of Exeter"] },
    { label: "Urban Resilience & Adaptation", universities: ["National University of Singapore","UNSW Sydney","University of Melbourne","King's College London","Monash University"] },
    { label: "Climate Migration & Security", universities: ["University of Sussex","New York University","University of Oxford","University of Nairobi","Yale University"] },
  ],
  mitigation: [
    { label: "Solar & Renewable Energy", universities: ["UNSW Sydney","ETH Zurich","Nanjing University","University of Oxford","Monash University"] },
    { label: "Carbon Capture & Storage", universities: ["University of Edinburgh","ETH Zurich","University of Cambridge","Yale University","University of São Paulo"] },
    { label: "Net Zero Pathways & Policy", universities: ["University of Oxford","University of Exeter","University of Leeds","University of Cambridge","McGill University"] },
    { label: "Energy Systems & Transition", universities: ["ETH Zurich","UNSW Sydney","University of Oxford","TERI School of Advanced Studies","Cornell University"] },
  ],
  food: [
    { label: "Agricultural Adaptation", universities: ["University of Reading","University of Nairobi","University of Ghana","TERI School of Advanced Studies","University of São Paulo"] },
    { label: "Water Security & Drought", universities: ["University of Cape Town","UNSW Sydney","University of Colorado Boulder","University of Ghana","ETH Zurich"] },
    { label: "Land Use & Deforestation", universities: ["University of São Paulo","University of Exeter","University of Leeds","Cornell University","Nanjing University"] },
    { label: "Food Systems & Nutrition", universities: ["University of Reading","University of Nairobi","University of Sussex","McGill University","University of Ghana"] },
  ],
  extremes: [
    { label: "Heatwaves & Extreme Heat", universities: ["University of Reading","University of Melbourne","National University of Singapore","University of Oxford","Chinese University of Hong Kong"] },
    { label: "Floods & Extreme Rainfall", universities: ["University of Reading","Monash University","University of Leeds","McGill University","National University of Singapore"] },
    { label: "Wildfires & Bushfire Risk", universities: ["University of Melbourne","UNSW Sydney","University of Exeter","University of Colorado Boulder","University of Cape Town"] },
    { label: "Climate Attribution Science", universities: ["University of Oxford","University of Exeter","University of Reading","ETH Zurich","UNSW Sydney"] },
  ],
};

// ─── API calls ────────────────────────────────────────────────────────────────
async function fetchThemeData(theme) {
  const termQuery = theme.scopusTerms.slice(0, 4).join(" OR ");
  const params = new URLSearchParams({
    themeQuery: termQuery,
    affIds: IUCA_UNIVERSITIES.map(u => u.scopusId).join(","),
  });
  const resp = await fetch(`/api/scopus?${params}`);
  if (!resp.ok) throw new Error("Scopus proxy error");
  return resp.json();
}

async function generateSubcategories(theme, rawData) {
  // Build a compact summary of which unis have papers on this theme
  const uniTitles = rawData.uniTitles || {};
  const uniSummary = Object.entries(uniTitles).map(([id, titles]) => {
    const uni = IUCA_UNIVERSITIES.find(u => u.scopusId === id);
    return `${uni?.name || id}: ${titles.slice(0, 4).join("; ")}`;
  }).join("\n");

  const resp = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      theme: theme.label,
      description: theme.description,
      uniSummary,
      universities: IUCA_UNIVERSITIES.map(u => u.name),
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

function SubcategoryCard({ sub, colour, uniMap }) {
  const [expanded, setExpanded] = useState(false);
  const unis = sub.universities
    .map(name => IUCA_UNIVERSITIES.find(u => u.name === name))
    .filter(Boolean);

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.08)`,
        borderLeft: `3px solid ${colour}`, borderRadius: 8, padding: "0.85rem 1rem",
        cursor: "pointer", transition: "background 0.15s",
        marginBottom: "0.5rem",
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
            {sub.universities.length} universities
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

function ThemePanel({ theme, isOpen, onToggle }) {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error | demo
  const [subcategories, setSubcategories] = useState(null);

  useEffect(() => {
    if (!isOpen || subcategories) return;
    setStatus("loading");
    // Try live path; fall back to demo
    fetchThemeData(theme)
      .then(raw => generateSubcategories(theme, raw))
      .then(subs => { setSubcategories(subs); setStatus("done"); })
      .catch(() => {
        setSubcategories(DEMO_SUBCATEGORIES[theme.id]);
        setStatus("demo");
      });
  }, [isOpen]);

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Theme header row */}
      <button
        onClick={onToggle}
        style={{
          width: "100%", background: isOpen ? theme.bg : "transparent",
          border: "none", cursor: "pointer", padding: "1.4rem 2rem",
          display: "flex", alignItems: "center", gap: "1.1rem",
          textAlign: "left", transition: "background 0.2s",
        }}
        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{
          fontSize: "1.4rem", color: theme.colour, width: 32, textAlign: "center",
          flexShrink: 0, lineHeight: 1,
        }}>
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

      {/* Expanded content */}
      {isOpen && (
        <div style={{ padding: "0.5rem 2rem 1.5rem 4.5rem" }}>
          {status === "loading" && (
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", padding: "1rem 0", fontStyle: "italic" }}>
              Pulling research areas from Scopus…
            </div>
          )}
          {status === "error" && (
            <div style={{ color: "#e07060", fontSize: "0.78rem", padding: "0.5rem 0" }}>
              Could not load live data.
            </div>
          )}
          {status === "demo" && (
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.68rem", marginBottom: "0.75rem", fontStyle: "italic" }}>
              Showing representative data — deploy with Scopus API for live results
            </div>
          )}
          {subcategories && subcategories.map((sub, i) => (
            <SubcategoryCard key={i} sub={sub} colour={theme.colour} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WhatWeDo() {
  const [openTheme, setOpenTheme] = useState(null);

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

      {/* Hero */}
      <div style={{ padding: "5rem 2rem 4rem", maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          padding: "0.3rem 0.9rem", borderRadius: 20, marginBottom: "1.75rem",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#5b9bd5" }} />
          International Universities Climate Alliance · {IUCA_UNIVERSITIES.length} member universities
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

      {/* Theme accordion */}
      <div style={{
        maxWidth: 900, margin: "0 auto 5rem",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden",
        background: "rgba(255,255,255,0.02)",
      }}>
        {THEMES.map(theme => (
          <ThemePanel
            key={theme.id}
            theme={theme}
            isOpen={openTheme === theme.id}
            onToggle={() => toggle(theme.id)}
          />
        ))}
      </div>

      {/* Footer note */}
      <div style={{ textAlign: "center", paddingBottom: "3rem", color: "rgba(255,255,255,0.18)", fontSize: "0.7rem" }}>
        Research areas derived from Scopus publication data · Subcategories generated by Claude AI
      </div>
    </div>
  );
}
