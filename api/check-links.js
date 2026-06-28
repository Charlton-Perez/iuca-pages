// api/check-links.js — HEAD-checks a list of URLs and returns which are reachable.
// Called from the Settings Members tab so users can find and fix dead research links.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { urls } = req.body;
  if (!Array.isArray(urls) || urls.length > 50) {
    return res.status(400).json({ error: "urls must be an array of up to 50 strings" });
  }

  const results = {};
  await Promise.all(urls.map(async (url) => {
    if (!url || !url.startsWith("http")) { results[url] = false; return; }
    try {
      const r = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(6000),
        headers: { "User-Agent": "IUCA-Dashboard-LinkChecker/1.0" },
        redirect: "follow",
      });
      // Treat any 2xx or 3xx as alive; some sites return 405 for HEAD but are valid
      results[url] = r.status < 400 || r.status === 405;
    } catch {
      results[url] = false;
    }
  }));

  return res.status(200).json({ results });
}
