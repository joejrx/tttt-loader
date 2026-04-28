export async function handler(event) {
  try {
    // Read location from query string
    const params = event.queryStringParameters || {};
    const location = params.location;

    if (!location) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing location parameter" }),
      };
    }

    // Map locations to Dutchie API keys
    const DUTCHIE_KEYS = {
      FRX_EAST_LIVERPOOL: process.env.DUTCHIE_API_KEY_FRX_EAST_LIVERPOOL,
      // other locations will be added here later
    };

    const apiKey = DUTCHIE_KEYS[location];

    if (!apiKey) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Invalid or unauthorized location" }),
      };
    }

    // Dutchie endpoint (we can adjust this once we confirm exact lab URL)
    const dutchieUrl = "https://api.dutchie.com/v1/lab_results";

    const response = await fetch(dutchieUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: text }),
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
``
