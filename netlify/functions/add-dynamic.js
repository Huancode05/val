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

    const { content } = body;
    if (!content || content.trim() === "") {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "动态内容不能为空" 
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    const now = new Date();
    const datetimeStr = now.toLocaleString("zh-CN", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).replace(/\//g, "-");

    const newDynamic = {
      id: Date.now().toString(),
      content: content.trim(),
      datetime: datetimeStr,
      timestamp: now.getTime(),
      noiseVotes: {}
    };

    const store = getStore("waxuedi-dynamics-store");
    let success = false;
    let retryCount = 0;
    const maxRetries = 3;

    while (!success && retryCount < maxRetries) {
      try {
        const rawData = await store.get("all-dynamics") || "[]";
        const dynamics = JSON.parse(rawData);
        dynamics.push(newDynamic);
        await store.set("all-dynamics", JSON.stringify(dynamics), {
          ttl: 2592000
        });
        success = true;
      } catch (retryErr) {
        retryCount++;
        if (retryCount >= maxRetries) throw retryErr;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

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
      message: `新增动态失败：${err.message}`
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