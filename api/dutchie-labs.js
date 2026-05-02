export default async function handler(req, res) {

  // ✅ CORS (already working)
  res.setHeader("Access-Control-Allow-Origin", "https://joejrx.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

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
    };

    const apiKey = DUTCHIE_KEYS[location];
    if (!apiKey) {
      return res.status(403).json({ error: "Invalid or unauthorized location" });
    }

    // 🔍 INVENTORY PROBE #1
    const dutchieUrl =
      "https://api.dutchie.com/v1/inventory?includeLabResults=true";

    const response = await fetch(dutchieUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; TerpTable/1.0)",
      },
    });

    const text = await response.text();

    // Log raw response for inspection
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        error: "Non-JSON response from inventory endpoint",
        raw: text.substring(0, 500),
      });
    }

    // 🔍 DIAGNOSTICS (THIS IS WHAT WE CARE ABOUT)
    const sample = Array.isArray(data) ? data[0] : data?.items?.[0];

    return res.status(200).json({
      diagnostic: {
        isArray: Array.isArray(data),
        topLevelKeys: Object.keys(data || {}),
        sampleKeys: sample ? Object.keys(sample) : null,
        labResultsPresent: !!sample?.labResults,
        labResultsValue: sample?.labResults || null,
      },
      sampleItem: sample || null,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
