// scripts/fetch-logos.mjs — download a square icon ("emojified logo") for each
// member university into public/logos/<slug>.png.
//
// Source: Google's favicon service at 128px, which returns each institution's
// site icon (usually its crest/logo). Reliable and unauthenticated. Clearbit's
// free logo API was discontinued by HubSpot, so it is not used.
//
// Usage:  node scripts/fetch-logos.mjs
// Re-run after adding a member; existing files are skipped unless --force.
// If any logo is poor quality, just drop a replacement PNG at
// public/logos/<slug>.png by hand — this script won't overwrite it.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root    = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir  = join(root, "public/logos");
const force   = process.argv.includes("--force");
mkdirSync(outDir, { recursive: true });

const { UNIVERSITIES } = await import(join(root, "src/data.js"));

// Shared slug rule — must match slugForLogo() in src/data.js
export function slug(name) {
  return name.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function domainFromUrl(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    const parts = h.split(".");
    const ccSld = new Set(["ac", "edu", "co", "com", "org", "gov", "net"]);
    if (parts.length > 2 && ccSld.has(parts[parts.length - 2])) return parts.slice(-3).join(".");
    return parts.slice(-2).join(".");
  } catch { return null; }
}

let got = 0, skipped = 0, failed = [];
for (const u of UNIVERSITIES) {
  const file = join(outDir, `${slug(u.name)}.png`);
  if (existsSync(file) && !force) { skipped++; continue; }

  const domain = domainFromUrl(u.researchUrl);
  // Try sources in order; keep the first that returns a real icon (>500 bytes,
  // to skip the generic globe/placeholder each service falls back to).
  const sources = [
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://unavatar.io/${domain}?fallback=false`,
  ];
  let saved = false;
  for (const url of sources) {
    try {
      const r = await fetch(url, { redirect: "follow" });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 500) continue; // generic/empty placeholder
      writeFileSync(file, buf); // ICO bytes render fine under a .png name (browsers sniff)
      got++; saved = true;
      console.log(`  ✓ ${slug(u.name)}.png  ${buf.length}b  ${domain}`);
      break;
    } catch { /* try next source */ }
  }
  if (!saved) failed.push(`${u.name} (${domain})`);
}

console.log(`\nDownloaded ${got}, skipped ${skipped} existing.`);
if (failed.length) {
  console.log(`Failed (${failed.length}) — add a PNG by hand at public/logos/<slug>.png:`);
  failed.forEach(f => console.log(`  ✗ ${f}`));
}
