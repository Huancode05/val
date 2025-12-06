const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  try {
    const store = getStore("dynamics");
    const data = JSON.parse(event.body);

    // 读取旧数据
    const { value } = await store.get("list", { type: "json" }) || { value: [] };

    // 添加新动态
    value.push({
      text: data.text,
      date: Date.now(),
    });

    // 保存
    await store.set("list", value, { type: "json" });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};