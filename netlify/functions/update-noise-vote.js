import { getStore } from "@netlify/blobs";

export default async function handler(event, context) {
  if (event.method === "OPTIONS") {
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  try {
    if (event.method !== "POST") {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "仅支持 POST 请求" 
      }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Allow": "POST"
        }
      });
    }

    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (parseErr) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "请求体格式错误（需 JSON）" 
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    const { dynamicId, level } = body;
    if (!dynamicId || !["low", "medium", "high"].includes(level)) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "参数错误：dynamicId 必传，level 仅支持 low/medium/high" 
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    const store = getStore("waxuedi-dynamics-store");
    const rawData = await store.get("all-dynamics") || "[]";
    const dynamics = JSON.parse(rawData);

    const targetDynamic = dynamics.find(d => d.id === dynamicId);
    if (!targetDynamic) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "动态不存在" 
      }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    const userId = event.headers["x-nf-client-ip"] || `user_${Math.random().toString(36).substr(2, 9)}`;
    targetDynamic.noiseVotes = targetDynamic.noiseVotes || {};
    targetDynamic.noiseVotes[userId] = level;

    await store.set("all-dynamics", JSON.stringify(dynamics));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      message: `更新投票失败：${err.message}`
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

export const config = {
  memoryMB: 128,
  timeoutSeconds: 10
};