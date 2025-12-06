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

    const store = getStore("waxuedi-dynamics-store");
    await store.set("all-dynamics", JSON.stringify([]));

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
      message: `清空动态失败：${err.message}`
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