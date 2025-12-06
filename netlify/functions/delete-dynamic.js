const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  try {
    const store = getStore("dynamics");

    const id = event.queryStringParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, message: "缺少 ID" })
      };
    }

    const { value } = (await store.get("list", { type: "json" })) || { value: [] };

    const newList = value.filter(item => item.id !== id);

    await store.set("list", newList, { type: "json" });

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