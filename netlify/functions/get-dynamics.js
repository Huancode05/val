import { getStore } from "@netlify/blobs";

export default async function handler(event, context) {
  // 处理 OPTIONS 预检请求
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
    const store = getStore("waxuedi-dynamics-store");
    const rawData = await store.get("all-dynamics") || "[]";
    
    let dynamics;
    try {
      dynamics = JSON.parse(rawData);
    } catch (parseErr) {
      dynamics = [];
      await store.set("all-dynamics", JSON.stringify([]));
    }

    dynamics.sort((a, b) => b.timestamp - a.timestamp);

    // 返回 Response 对象（新版规范）
    return new Response(JSON.stringify({ dynamics, success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      message: `获取动态失败：${err.message}`,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
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