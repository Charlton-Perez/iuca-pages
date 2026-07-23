// climate-areas.js — the curated map of dashboard "areas" to SciVal topic clusters.
//
// This is the editorial source of truth for What We Do:
//   • The pipeline searches IUCA papers, enriches them with SciVal, then keeps
//     only papers whose topicClusterId appears below — everything else is dropped.
//   • Papers are bucketed into the area that owns their cluster and ranked by FWCI.
//   • Settings lists these areas/clusters as an enable/disable checklist.
//
// To curate: comment out a cluster line to exclude it, or add a new one by ID.
// The full SciVal taxonomy (1,528 clusters) is in scival-clusters.tsv at the
// repo root — grep it for candidates. `prom` = global prominence percentile
// (citation momentum, 99 = top 1% worldwide); `out` = global paper count.
//
// A cluster must live in exactly ONE area (a paper has one cluster, so overlap
// would be ambiguous). If you move a cluster, delete it from its old area.

export const CLIMATE_AREAS = [
  {
    id: "weather-oceans-dynamics",
    name: "Weather & Climate Dynamics",
    blurb: "The physical climate system — variability, extremes, and the modelling behind prediction.",
    clusters: [
      { id: 14,  name: "Climate Variability and Tropical Cyclone Dynamics" },      // prom 92 · 41,311
      { id: 774, name: "Climate Change Impacts on Precipitation and Extreme Events" }, // prom 81 · 16,234
      { id: 260, name: "Interactions of Atmospheric Layers and Water Vapor" },     // prom 65 · 16,513
      { id: 868, name: "Data Assimilation and Sea Level Dynamics" },               // prom 47 · 9,613  (climate-modelling proxy)
    ],
  },
  {
    id: "air-quality-emissions",
    name: "Air Quality & Emissions",
    blurb: "Atmospheric pollution, greenhouse gases, and their sources.",
    clusters: [
      { id: 23,  name: "Atmospheric Aerosol Emissions and Pollution Dynamics" },   // prom 95 · 40,850
      { id: 523, name: "Nitrogen Dynamics and Greenhouse Gas Emissions" },         // prom 85 · 17,196
      { id: 447, name: "Waste Management Strategies for Carbon Emission Reduction" }, // prom 91 · 21,021
      { id: 104, name: "Methane Reduction through Feed Supplementation Strategies" }, // prom 80 · 23,664
      // { id: 251, name: "Health Impacts of Air Pollution Exposure" },            // prom 94 — or put under Resilience & Health
    ],
  },
  {
    id: "economics-policy",
    name: "Climate Economics & Policy",
    blurb: "The economics, governance, and policy of decarbonisation.",
    clusters: [
      { id: 131, name: "Interconnections of Economic Growth and Environmental Impact" }, // prom 99 · 44,936
      { id: 403, name: "Climate Policy and Carbon Emission Dynamics" },            // prom 96 · 24,550
      { id: 975, name: "Sustainable Energy Transition and Community Development" }, // prom 93 · 20,953
      // 833 Consumer Behavior & Climate Awareness moved to "Information Integrity & Climate"
    ],
  },
  {
    id: "energy-transition",
    name: "Energy Transition & Circular Economy",
    blurb: "Clean energy generation, storage, and the circular economy.",
    clusters: [
      { id: 187, name: "Hydrogen Production and Combustion Dynamics Insights" },   // prom 98 · 29,933
      { id: 426, name: "Circular Economy and Life Cycle Assessment Integration" }, // prom 99 · 33,041
      { id: 356, name: "Photovoltaic Energy Systems and Storage" },               // prom 95 · 32,649
      { id: 280, name: "Control Strategies for Renewable Energy Systems" },        // prom 90 · 31,821
      { id: 1062, name: "Sustainable Energy Systems and Rural Electrification" },  // prom 84 · 12,944
      // Materials-science clusters — high prominence but mostly non-climate. Left out:
      // { id: 73,  name: "Perovskite and Dye-Sensitized Solar Cell Innovations" }, // prom 99
      // { id: 303, name: "High-Performance Materials for Lithium-Ion Batteries" }, // prom 97
    ],
  },
  {
    id: "ecosystems-carbon-biodiversity",
    name: "Ecosystems, Carbon & Biodiversity",
    blurb: "Terrestrial carbon, vegetation, forests, and biodiversity under climate change.",
    clusters: [
      { id: 539, name: "Water and Carbon Dynamics in Ecosystems" },               // prom 76 · 15,461
      { id: 20,  name: "Soil Carbon Dynamics in Agricultural Ecosystems" },        // prom 97 · 43,714
      { id: 592, name: "Vegetation and Climate Change Monitoring and Modeling" },  // prom 95 · 26,639
      { id: 357, name: "Diversity and Interactions in Forest Ecosystems" },        // prom 79 · 17,961
      { id: 593, name: "Plant Responses to Climate Change and Water Efficiency" }, // prom 75 · 15,329
      { id: 1296, name: "Climate Change Impacts on Species Distribution Models" }, // prom 65 · 11,051
      { id: 1129, name: "Conservation Strategies for Biodiversity and Resource Management" }, // prom 59 · 8,727
      { id: 1345, name: "Climate Influence on Forest Dynamics and Health" },       // prom 33 · 6,528
    ],
  },
  {
    id: "oceans-marine",
    name: "Oceans & Marine Ecosystems",
    blurb: "Marine and coastal ecosystems, reefs, and the changing ocean.",
    clusters: [
      { id: 479, name: "Coral Reefs and Marine Ecosystem Resilience" },            // prom 74 · 15,737
      { id: 643, name: "Marine Ecosystems and Climate Change Interactions" },      // prom 57 · 10,846
      { id: 1088, name: "Marine Ecosystem Dynamics and Climate Resilience" },      // prom 51 · 7,907
      { id: 912, name: "Mangrove Ecosystems and Heavy Metal Pollution Dynamics" }, // prom 75 · 11,077
      { id: 842, name: "Coastal Dynamics and Sediment Transport Mechanisms" },     // prom 54 · 10,119
      { id: 629, name: "Ecosystem Dynamics and Carbon Management in Fisheries" },  // prom 46 · 10,162
      { id: 1315, name: "Marine Ecosystems and Plastic Waste Management" },        // prom 37 · 5,632
      { id: 1099, name: "Sediment Dynamics and Tectonic Influences in River Basins" }, // prom 23 · 6,453
    ],
  },
  {
    id: "ice-glaciers-sea-level",
    name: "Ice, Glaciers & Sea Level",
    blurb: "The cryosphere — ice sheets, glaciers, permafrost, sea ice, and paleoclimate.",
    clusters: [
      { id: 1247, name: "Climate Change Impacts on Ice Sheet Dynamics" },          // prom 49 · 8,580  (contains glacier sub-topics)
      { id: 1020, name: "Climate Change Impacts on Frozen Soil Dynamics" },        // prom 66 · 12,443 (permafrost)
      { id: 278,  name: "Paleoclimate Insights from Glacial Sediments and Foraminifera" }, // prom 51 · 13,125
      { id: 1275, name: "Arctic Sea Ice Dynamics and Environmental Impact" },      // prom 28 · 6,944
      { id: 1408, name: "Holocene Climate Variability and Geodiversity Insights" }, // prom 32 · 6,264
    ],
  },
  {
    id: "resilience-health",
    name: "Climate Resilience & Health",
    blurb: "Human resilience, adaptation, and the health impacts of a changing climate.",
    clusters: [
      { id: 438, name: "Resilience Strategies for Climate Change and Disasters" }, // prom 93 · 28,575
      { id: 381, name: "Health Impacts of Climate Change and Ergonomics" },        // prom 90 · 24,137
      { id: 251, name: "Health Impacts of Air Pollution Exposure" },              // prom 94 · 28,101
      { id: 1137, name: "Cultural Heritage and Climate Change Resilience" },       // prom 46 · 11,737
      { id: 263, name: "Urban Heat Management and Thermal Comfort Solutions" },   // prom 97 · 30,622
      // 1507 Indigenous Knowledge moved to "Just Transition & Indigenous Knowledge"
    ],
  },
  {
    id: "land-fire-agriculture",
    name: "Land, Fire & Agriculture",
    blurb: "Land use, wildfire, soils, and climate-smart agriculture.",
    clusters: [
      { id: 1143, name: "Fire Management and Environmental Impact Assessment" },   // prom 75 · 11,406
      { id: 1218, name: "Climate Impact on Agricultural Practices and Technology" }, // prom 79 · 12,421
      { id: 140,  name: "Ecosystem Services and Land Use Dynamics" },              // prom 96 · 32,027
      { id: 583,  name: "Climate Change Impacts on Soil Moisture Dynamics" },      // prom 72 · 12,997
      { id: 1286, name: "Agroforestry and Biomass in Climate Resilience" },        // prom 50 · 6,991
      { id: 1259, name: "Innovative Approaches in Forest Management and Biomass Estimation" }, // prom 48 · 6,819
    ],
  },

  // ── Social-science areas ────────────────────────────────────────────────────
  // SciVal's taxonomy has no dedicated clusters for these themes — climate
  // communication, justice and education research is spread across broader
  // social-science clusters. The clusters below were identified by running
  // global Scopus searches per theme and seeing where those papers cluster.
  // They are thinner than the physical-science areas; expect fewer papers.
  {
    id: "information-integrity",
    name: "Information Integrity & Climate",
    blurb: "Climate communication, public perception, and the contest over credible information.",
    clusters: [
      { id: 833, name: "Consumer Behavior and Climate Change Awareness" },        // prom 86 · 23,786
      { id: 1322, name: "Risk Perception in Energy Transition" },                 // prom 39 · 5,278
      { id: 181, name: "Media Influence on Political Communication Dynamics" },   // prom 90 · 29,144
    ],
  },
  {
    id: "just-transition-indigenous",
    name: "Just Transition & Indigenous Knowledge",
    blurb: "Equity in the energy transition, indigenous knowledge, and community governance.",
    clusters: [
      { id: 1507, name: "Indigenous Knowledge and Climate Resilience in Arctic Communities" }, // prom 10 · 2,378
      { id: 1349, name: "Social Movements and Environmental Justice Dynamics" },  // prom 13 · 5,996
      { id: 1065, name: "Integrating Community Forestry and Environmental Governance" }, // prom 30 · ~6,000
      { id: 1461, name: "Empowerment and Rights in Land Management" },            // prom 12 · ~3,000
      { id: 1262, name: "Urban Policy and Livelihood Strategies in the Global South" }, // prom 24 · 6,694
    ],
  },
  {
    id: "climate-education",
    name: "Climate Education",
    blurb: "Teaching climate and sustainability, and building climate literacy.",
    clusters: [
      { id: 1179, name: "Sustainable Development in Higher Education Practices" }, // prom 72 · 10,771
    ],
  },
];

// Flat lookup: topicClusterId (number) -> { areaId, areaName, clusterName }
export const CLUSTER_TO_AREA = Object.fromEntries(
  CLIMATE_AREAS.flatMap(area =>
    area.clusters.map(c => [c.id, { areaId: area.id, areaName: area.name, clusterName: c.name }])
  )
);

// All curated cluster IDs — the whitelist the pipeline filters against.
export const CURATED_CLUSTER_IDS = CLIMATE_AREAS.flatMap(a => a.clusters.map(c => c.id));
