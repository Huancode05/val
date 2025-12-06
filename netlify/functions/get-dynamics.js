import { kv } from "@netlify/functions";

exports.handler = async (event, context) => {
  // 处理 OPTIONS 预检请求
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: "{}"
    };
  }

  try {
    const rawData = (await kv.get("all-dynamics")) || "[]";
    
    let dynamics;
    try {
      dynamics = JSON.parse(rawData);
    } catch (parseErr) {
      dynamics = [];
      await kv.set("all-dynamics", JSON.stringify([]));
    }

    dynamics.sort((a, b) => b.timestamp - a.timestamp);

    // 返回 Response 对象（新版规范）
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ dynamics, success: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: false,
        message: `获取动态失败：${err.message}`,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
      })
    };
  }
};

exports.config = {
  memoryMB: 128,
  timeoutSeconds: 10
};