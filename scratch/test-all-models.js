const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testAllModels() {
  const apiKey = "AIzaSyDJL89Am7qR7FLvTe0DlfckRXyqkkVRtDw";
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Tất cả model có thể hoạt động được
  const models = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
  ];
  
  for (const modelName of models) {
    try {
      console.log(`\n--- Testing: ${modelName} ---`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello in Vietnamese, one sentence only.");
      const response = await result.response;
      const text = response.text();
      console.log(`✅ SUCCESS with ${modelName}: ${text.substring(0, 100)}`);
      return; // Tìm được model hoạt động, dừng lại
    } catch (err) {
      // Chỉ hiển thị phần quan trọng của lỗi
      const msg = err.message || "";
      if (msg.includes("429")) {
        console.log(`❌ ${modelName}: QUOTA EXCEEDED (429)`);
      } else if (msg.includes("404")) {
        console.log(`❌ ${modelName}: MODEL NOT FOUND (404)`);
      } else if (msg.includes("400")) {
        console.log(`❌ ${modelName}: BAD REQUEST (400) - ${msg.substring(0, 120)}`);
      } else {
        console.log(`❌ ${modelName}: ${msg.substring(0, 150)}`);
      }
    }
  }
  console.log("\n⚠️ KHÔNG CÓ MODEL NÀO HOẠT ĐỘNG VỚI KEY NÀY.");
}

testAllModels();
