import { kv } from "@netlify/functions";

exports.handler = async (event, context) => {
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
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Allow": "POST"
        },
        body: JSON.stringify({ success: false, message: "仅支持 POST 请求" })
      };
    }

    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (parseErr) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false, message: "请求体格式错误（需 JSON）" })
      };
    }

    const { dynamicId, level } = body;
    if (!dynamicId || !["low", "medium", "high"].includes(level)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          success: false,
          message: "参数错误：dynamicId 必传，level 仅支持 low/medium/high"
        })
      };
    }

    const rawData = (await kv.get("all-dynamics")) || "[]";
    const dynamics = JSON.parse(rawData);

    const targetDynamic = dynamics.find(d => d.id === dynamicId);
    if (!targetDynamic) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false, message: "动态不存在" })
      };
    }

    const userId = event.headers["x-nf-client-ip"] || `user_${Math.random().toString(36).substr(2, 9)}`;
    targetDynamic.noiseVotes = targetDynamic.noiseVotes || {};
    targetDynamic.noiseVotes[userId] = level;

    await kv.set("all-dynamics", JSON.stringify(dynamics));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ success: true })
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
        message: `更新投票失败：${err.message}`
      })
    };
  }
};

exports.config = {
  memoryMB: 128,
  timeoutSeconds: 10
};