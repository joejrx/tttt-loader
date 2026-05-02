export default async function handler(req, res) {

  // ✅ CORS HEADERS — MUST BE FIRST
  res.setHeader("Access-Control-Allow-Origin", "https://joejrx.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle browser preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const location = req.query.location;

    if (!location) {
      return res.status(400).json({ error: "Missing location parameter" });
    }

    const DUTCHIE_KEYS = {
      FRX_EAST_LIVERPOOL: process.env.DUTCHIE_API_KEY_FRX_EAST_LIVERPOOL,
      // add other locations later
    };

    const apiKey = DUTCHIE_KEYS[location];
    if (!apiKey) {
      return res.status(403).json({ error: "Invalid or unauthorized location" });
    }

    const dutchieUrl = "https://api.dutchie.com/v1/lab_results";

    const response = await fetch(dutchieUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "Mozilla/5.0 (compatible; TerpTable/1.0)",
      },
    });

    const text = await response.text();

    // If Dutchie/Cloudflare returns HTML, surface it clearly
    if (!response.ok || text.startsWith("<!DOCTYPE")) {
      return res.status(502).json({
        error: "Dutchie blocked request",
        raw: text.substring(0, 500),
      });
    }

    const data = JSON.parse(text);
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
