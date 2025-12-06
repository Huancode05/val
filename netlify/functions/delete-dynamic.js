import { getStore } from "@netlify/blobs";

export default async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { dynamicId } = body;
    if (!dynamicId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "动态ID不能为空" })
      };
    }

    // 读取现有数据并过滤删除
    const store = getStore("waxuedi-dynamics-store");
    const rawData = await store.get("all-dynamics") || "[]";
    let dynamics = JSON.parse(rawData);
    const initialLength = dynamics.length;
    dynamics = dynamics.filter(d => d.id !== dynamicId);

    // 若数据无变化，返回失败
    if (dynamics.length === initialLength) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "动态不存在" })
      };
    }

    // 写入更新后的数据
    await store.set("all-dynamics", JSON.stringify(dynamics));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: err.message })
    };
  }
};