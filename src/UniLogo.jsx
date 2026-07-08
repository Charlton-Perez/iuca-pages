import { useState } from "react";
import { slugForLogo } from "./data.js";

// Palette for the initials-avatar fallback (used when a logo is missing or
// fails to load). Deterministic per name so a given university is always
// the same colour.
const COLORS = ["#5b9bd5","#3ab5c6","#5caa72","#e8a44a","#c97fd4","#d4a843","#e07060","#87c98e","#a87ec9"];

function initials(name = "") {
  const words = name.replace(/^(University of|The|National|Chinese)\s+/i, "").split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] || "") + (words[1]?.[0] || "")).toUpperCase();
}

// A small square "emojified" university logo. Falls back to a coloured
// initials chip if the logo image is missing (see scripts/fetch-logos.mjs).
export default function UniLogo({ name, size = 20 }) {
  const [failed, setFailed] = useState(false);
  const base = {
    width: size, height: size, borderRadius: 4, flexShrink: 0,
    objectFit: "contain", verticalAlign: "middle",
  };

  if (failed) {
    const c = COLORS[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % COLORS.length];
    return (
      <span title={name} style={{
        ...base, background: c, color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.42, fontWeight: 700, letterSpacing: "-0.02em",
      }}>
        {initials(name)}
      </span>
    );
  }

  return (
    <img
      src={`/logos/${slugForLogo(name)}.png`}
      alt={name}
      title={name}
      loading="lazy"
      style={{ ...base, background: "#fff" }}
      onError={() => setFailed(true)}
    />
  );
}
