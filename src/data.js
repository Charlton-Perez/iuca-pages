// src/data.js — shared source-of-truth for universities and themes.
// Used by the frontend as defaults; the server reads from Vercel KV and falls back to these.

export const UNIVERSITIES = [
  { name: "University of Reading",            flag: "🇬🇧", scopusId: "60006462", gridId: "grid.9025.f",    researchUrl: "https://research.reading.ac.uk/research-themes/climate-and-earth-system-science/" },
  { name: "University of Oxford",             flag: "🇬🇧", scopusId: "60023256", gridId: "grid.4991.5",    researchUrl: "https://www.ox.ac.uk/research/research-in-conversation/climate-change" },
  { name: "University of Cambridge",          flag: "🇬🇧", scopusId: "60025259", gridId: "grid.5335.0",    researchUrl: "https://www.cam.ac.uk/topics/climate-change" },
  { name: "University of Edinburgh",          flag: "🇬🇧", scopusId: "60003093", gridId: "grid.4305.2",    researchUrl: "https://www.ed.ac.uk/geosciences/research/climate-change" },
  { name: "University of Exeter",             flag: "🇬🇧", scopusId: "60001809", gridId: "grid.8391.3",    researchUrl: "https://www.exeter.ac.uk/research/institutes/globalchange/" },
  { name: "University of Leeds",              flag: "🇬🇧", scopusId: "60022452", gridId: "grid.9909.9",    researchUrl: "https://environment.leeds.ac.uk/" },
  { name: "King's College London",            flag: "🇬🇧", scopusId: "60003596", gridId: "grid.13097.3c",  researchUrl: "https://www.kcl.ac.uk/research/climate" },
  { name: "University of Sussex",             flag: "🇬🇧", scopusId: "60020422", gridId: "grid.12082.39",  researchUrl: "https://www.sussex.ac.uk/research/centres/sussex-sustainability-research-programme/" },
  { name: "Sorbonne Université",              flag: "🇫🇷", scopusId: "60071311", gridId: "grid.462410.5",  researchUrl: "https://www.sorbonne-universite.fr/en/research/scientific-priorities/environment-and-climate" },
  { name: "ETH Zurich",                       flag: "🇨🇭", scopusId: "60028186", gridId: "grid.5801.c",    researchUrl: "https://ethz.ch/en/research/research-initiatives/climate.html" },
  { name: "University of Zurich",             flag: "🇨🇭", scopusId: "60028717", gridId: "grid.7400.3",    researchUrl: "https://www.uzh.ch/en/research/initiatives/climate.html" },
  { name: "University of Helsinki",           flag: "🇫🇮", scopusId: "60002026", gridId: "grid.7737.4",    researchUrl: "https://www.helsinki.fi/en/research-groups/climate-system-research" },
  { name: "University of Bremen",             flag: "🇩🇪", scopusId: "60007882", gridId: "grid.7704.4",    researchUrl: "https://www.marum.de/en/" },
  { name: "UNSW Sydney",                      flag: "🇦🇺", scopusId: "60031004", gridId: "grid.1005.4",    researchUrl: "https://www.ccrc.unsw.edu.au/" },
  { name: "University of Melbourne",          flag: "🇦🇺", scopusId: "60031226", gridId: "grid.1008.9",    researchUrl: "https://climate-energy.unimelb.edu.au/" },
  { name: "Monash University",                flag: "🇦🇺", scopusId: "60031229", gridId: "grid.1002.3",    researchUrl: "https://www.monash.edu/earth-atmosphere-environment" },
  { name: "University of Tasmania",           flag: "🇦🇺", scopusId: "60031244", gridId: "grid.1009.8",    researchUrl: "https://www.imas.utas.edu.au/" },
  { name: "National University of Singapore", flag: "🇸🇬", scopusId: "60071417", gridId: "grid.4280.e",    researchUrl: "https://www.nus.edu.sg/research/research-clusters/environment-and-sustainability" },
  { name: "Chinese University of Hong Kong",  flag: "🇭🇰", scopusId: "60074798", gridId: "grid.10784.3a",  researchUrl: "https://www.issp.cuhk.edu.hk/" },
  { name: "University of Hong Kong",          flag: "🇭🇰", scopusId: "60008712", gridId: "grid.194645.b",  researchUrl: "https://www.earthsciences.hku.hk/research/" },
  { name: "Hokkaido University",              flag: "🇯🇵", scopusId: "60025272", gridId: "grid.39158.36",  researchUrl: "https://www.ees.hokudai.ac.jp/en/" },
  { name: "Nanjing University",               flag: "🇨🇳", scopusId: "60015498", gridId: "grid.41156.37",  researchUrl: "https://climate.nju.edu.cn/" },
  { name: "China University of Geosciences",  flag: "🇨🇳", scopusId: "60017001", gridId: "grid.443626.0",  researchUrl: "https://en.cugb.edu.cn/research.htm" },
  { name: "California Inst. of Technology",   flag: "🇺🇸", scopusId: "60006951", gridId: "grid.20861.3d",  researchUrl: "https://climate.caltech.edu/" },
  { name: "Cornell University",               flag: "🇺🇸", scopusId: "60007776", gridId: "grid.5386.8",    researchUrl: "https://atkinson.cornell.edu/" },
  { name: "Yale University",                  flag: "🇺🇸", scopusId: "60021773", gridId: "grid.47100.32",  researchUrl: "https://environment.yale.edu/research" },
  { name: "New York University",              flag: "🇺🇸", scopusId: "60075336", gridId: "grid.137628.9",  researchUrl: "https://environment.nyu.edu/" },
  { name: "University of Colorado Boulder",   flag: "🇺🇸", scopusId: "60018043", gridId: "grid.266190.a",  researchUrl: "https://cires.colorado.edu/" },
  { name: "McGill University",                flag: "🇨🇦", scopusId: "60014099", gridId: "grid.14709.3b",  researchUrl: "https://www.mcgill.ca/climateandatmosphericsciences/" },
  { name: "University of São Paulo",          flag: "🇧🇷", scopusId: "60003066", gridId: "grid.11899.38",  researchUrl: "https://www.iag.usp.br/international" },
  { name: "University of Nairobi",            flag: "🇰🇪", scopusId: "60003984", gridId: "grid.10604.33",  researchUrl: "https://climatescience.uonbi.ac.ke/" },
  { name: "University of Ghana",              flag: "🇬🇭", scopusId: "60003978", gridId: "grid.10818.34",  researchUrl: "https://www.ug.edu.gh/earth-environmental-sciences" },
  { name: "University of Cape Town",          flag: "🇿🇦", scopusId: "60003980", gridId: "grid.7836.a",    researchUrl: "https://www.africaclimatedev.uct.ac.za/" },
  { name: "TERI School of Advanced Studies",  flag: "🇮🇳", scopusId: "60070377", gridId: "grid.444501.3",  researchUrl: "https://www.terisas.ac.in/research" },
  { name: "University of the South Pacific",  flag: "🇫🇯", scopusId: "60004028", gridId: "grid.449398.e",  researchUrl: "https://www.usp.ac.fj/research/" },
];

// FOR = ANZSRC Fields of Research codes (used by Altmetric Explorer filter[subject][]).
// These are applied at journal level by Altmetric; papers inherit their journal's codes.
// Full list: https://www.abs.gov.au/statistics/classifications/australian-and-new-zealand-standard-research-classification-anzsrc/latest-release
export const DEFAULT_SUBJECT_CODES = [
  "0401", // Atmospheric Sciences
  "0402", // Geochemistry
  "0404", // Geophysics
  "0405", // Oceanography
  "0406", // Physical Geography and Environmental Geoscience
  "0501", // Ecological Applications
  "0502", // Environmental Science and Management
  "0503", // Soil Sciences
  "0504", // Freshwater Science (Water Resources)
  "0701", // Agriculture, Land and Farm Management
  "0705", // Forestry Sciences
];

// subjectAreas = Scopus SUBJAREA abbreviations (valid query field: SUBJAREA(EART OR ENVI)).
// These are journal-level classifications — no keyword filter is applied on top.
// Valid codes: EART, ENVI, AGRI, ENER, SOCI, MULT, MEDI, PHYS, CHEM, COMP, ENGI
export const THEMES = [
  {
    id: "atmosphere",
    label: "Atmosphere & Weather",
    icon: "◎",
    colour: "#5b9bd5",
    bg: "#0d1e32",
    description: "Forecasting, atmospheric dynamics, air quality and the physics of our changing skies.",
    subjectAreas: ["EART"],
  },
  {
    id: "oceans",
    label: "Oceans & Sea Level",
    icon: "≋",
    colour: "#3ab5c6",
    bg: "#091e24",
    description: "Ocean heat, circulation, sea level rise, acidification and marine ecosystems under pressure.",
    subjectAreas: ["EART"],
  },
  {
    id: "cryosphere",
    label: "Ice, Snow & Permafrost",
    icon: "❄",
    colour: "#a8d4f0",
    bg: "#101824",
    description: "Glaciers, ice sheets, Arctic sea ice and the frozen ground releasing ancient carbon.",
    subjectAreas: ["EART"],
  },
  {
    id: "ecosystems",
    label: "Ecosystems & Biodiversity",
    icon: "⬡",
    colour: "#5caa72",
    bg: "#0b1c12",
    description: "How climate change reshapes forests, wetlands, coral reefs and the species that depend on them.",
    subjectAreas: ["ENVI", "AGRI"],
  },
  {
    id: "society",
    label: "Society & Adaptation",
    icon: "◈",
    colour: "#e8a44a",
    bg: "#1e1608",
    description: "Climate justice, health impacts, migration, urban resilience and how communities adapt.",
    subjectAreas: ["ENVI", "SOCI"],
  },
  {
    id: "mitigation",
    label: "Mitigation & Clean Energy",
    icon: "◉",
    colour: "#c97fd4",
    bg: "#1a0f20",
    description: "Pathways to net zero: renewables, carbon capture, energy systems and emissions reduction.",
    subjectAreas: ["ENER", "ENVI"],
  },
  {
    id: "food",
    label: "Food, Water & Land",
    icon: "◌",
    colour: "#d4a843",
    bg: "#1c1508",
    description: "Agricultural resilience, water security and land-use change in a warming world.",
    subjectAreas: ["AGRI", "ENVI"],
  },
  {
    id: "extremes",
    label: "Extreme Events & Risk",
    icon: "⚡",
    colour: "#e07060",
    bg: "#1e0e0c",
    description: "Heatwaves, floods, wildfires and storms — attribution, prediction and disaster risk reduction.",
    subjectAreas: ["EART", "ENVI"],
  },
];
