const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
  try {
    const store = getStore("dynamics");

    await store.set("list", [], { type: "json" });

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};