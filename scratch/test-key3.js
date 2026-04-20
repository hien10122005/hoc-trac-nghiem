const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testAllModels() {
  const apiKey = "AIzaSyBp4tWzsQ_HA0P2f5xREWovGexGVsNcBxs";
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
  ];
  
  for (const modelName of models) {
    try {
      console.log(`\n--- Testing: ${modelName} ---`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello in Vietnamese, one sentence only.");
      const response = await result.response;
      const text = response.text();
      console.log(`✅ SUCCESS with ${modelName}: ${text.substring(0, 100)}`);
      return;
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("429")) console.log(`❌ ${modelName}: QUOTA EXCEEDED (429)`);
      else if (msg.includes("404")) console.log(`❌ ${modelName}: MODEL NOT FOUND (404)`);
      else if (msg.includes("403")) console.log(`❌ ${modelName}: FORBIDDEN (403)`);
      else if (msg.includes("400")) console.log(`❌ ${modelName}: INVALID KEY (400)`);
      else console.log(`❌ ${modelName}: ${msg.substring(0, 150)}`);
    }
  }
  console.log("\n⚠️ KHÔNG CÓ MODEL NÀO HOẠT ĐỘNG VỚI KEY NÀY.");
}

testAllModels();
