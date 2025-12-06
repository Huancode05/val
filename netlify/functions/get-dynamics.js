const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
  try {
    const store = getStore("dynamics");

    const { value } = (await store.get("list", { type: "json" })) || { value: [] };

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: true, dynamics: value })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};