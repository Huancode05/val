import { kv } from "@netlify/functions";

exports.handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*"
      },
      body: "{}"
    };
  }

  try {
    console.log("Received request method:", event.httpMethod);
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

    const { content } = body;
    if (!content || content.trim() === "") {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false, message: "动态内容不能为空" })
      };
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

    let success = false;
    let retryCount = 0;
    const maxRetries = 3;

    while (!success && retryCount < maxRetries) {
      try {
        const rawData = (await kv.get("all-dynamics")) || "[]";
        const dynamics = JSON.parse(rawData);
        dynamics.push(newDynamic);
        await kv.set("all-dynamics", JSON.stringify(dynamics));
        success = true;
      } catch (retryErr) {
        retryCount++;
        if (retryCount >= maxRetries) throw retryErr;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

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
        message: `新增动态失败：${err.message}`
      })
    };
  }
}

exports.config = {
  memoryMB: 128,
  timeoutSeconds: 10
};
