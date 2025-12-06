import { kv } from "@netlify/functions";

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ success: false, message: "仅支持 POST 请求" })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { dynamicId } = body;
    if (!dynamicId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, message: "动态ID不能为空" })
      };
    }

    // 读取现有数据并过滤删除
    const rawData = (await kv.get("all-dynamics")) || "[]";
    let dynamics = JSON.parse(rawData);
    const initialLength = dynamics.length;
    dynamics = dynamics.filter(d => d.id !== dynamicId);

    // 若数据无变化，返回失败
    if (dynamics.length === initialLength) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, message: "动态不存在" })
      };
    }

    // 写入更新后的数据
    await kv.set("all-dynamics", JSON.stringify(dynamics));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: false, message: err.message })
    };
  }
};