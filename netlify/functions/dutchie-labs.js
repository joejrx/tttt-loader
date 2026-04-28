exports.handler = async function (event) {
  try {
    const params = event.queryStringParameters || {};
    const location = params.location;

    if (!location) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing location parameter" }),
      };
    }

    const DUTCHIE_KEYS = {
      FRX_EAST_LIVERPOOL: process.env.DUTCHIE_API_KEY_FRX_EAST_LIVERPOOL,
    };

    const apiKey = DUTCHIE_KEYS[location];
    if (!apiKey) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Invalid or unauthorized location" }),
      };
    }

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
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
``
