import { getStore } from "@netlify/blobs";

export default async function handler(event) {
  // 处理跨域预检请求
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
    // 仅允许 POST 请求
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

    // 检查请求体是否存在
    if (!event.body) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "请求体不能为空" 
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // 解析请求体
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (err) {
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

    // 检查 content 参数
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

    // 生成动态数据
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

    // 写入 Netlify Blobs
    const store = getStore("waxuedi-dynamics-store");
    const rawData = await store.get("all-dynamics") || "[]";
    const dynamics = JSON.parse(rawData);
    dynamics.push(newDynamic);
    await store.set("all-dynamics", JSON.stringify(dynamics));

    // 返回成功响应
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    // 捕获未知错误
    return new Response(JSON.stringify({ 
      success: false, 
      message: `服务器错误：${err.message}` 
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
