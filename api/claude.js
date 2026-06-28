// api/claude.js — server-side proxy for Anthropic API calls
// Keeps ANTHROPIC_API_KEY out of the browser bundle.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=86400");

  const { theme, description, uniSummary, universities } = req.body;

  const prompt = `You are an expert science communicator for the International Universities Climate Alliance.

Theme: "${theme}"
Description: "${description}"

Paper titles from IUCA member universities in this theme (university: sample titles):
${uniSummary || "(no data — use your knowledge of these universities' research strengths)"}

Create exactly 4 subcategories within this theme that:
1. Are meaningful and distinct to a public audience (not jargon-heavy)
2. Reflect what IUCA universities actually research
3. For each subcategory, include ALL universities from the list that genuinely have research strength in that area — do not artificially limit the count. A subcategory may have anywhere from 3 to 20+ universities if the evidence supports it.

Universities to choose from: ${universities.join(", ")}

Respond ONLY with a JSON array (no markdown, no explanation):
[
  {
    "label": "Plain-English subcategory name",
    "summary": "One sentence explaining this research area for a public audience.",
    "universities": ["Every university name that genuinely researches this area"]
  }
]`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!r.ok) {
      const body = await r.text();
      return res.status(r.status).json({ error: `Anthropic ${r.status}`, detail: body.slice(0, 300) });
    }

    const data = await r.json();
    const text = data.content?.find(b => b.type === "text")?.text || "[]";
    const subcategories = JSON.parse(text.replace(/```json|```/g, "").trim());
    return res.status(200).json({ subcategories });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
