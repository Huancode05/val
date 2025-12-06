const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: false, message: "仅支持 POST 请求" })
    };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: false, message: "请求体错误" })
    };
  }

  const { id, voteType } = data;
  if (!id || !voteType) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: false, message: "缺少参数" })
    };
  }

  const store = getStore("dynamics");
  const list = await store.get("list", { type: "json" }) || [];

  const item = list.find(v => v.id === id);
  if (!item) {
    return {
      statusCode: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: false, message: "动态不存在" })
    };
  }

  item.noiseVotes = item.noiseVotes || {};
  item.noiseVotes[voteType] = (item.noiseVotes[voteType] || 0) + 1;

  await store.set("list", list, { type: "json" });

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ success: true })
  };
};