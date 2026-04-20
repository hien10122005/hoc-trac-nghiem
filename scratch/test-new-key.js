const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testKey() {
  const apiKey = "AIzaSyDJL89Am7qR7FLvTe0DlfckRXyqkkVRtDw";
  console.log("Testing New Key:", apiKey);
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ["gemini-2.0-flash", "gemini-1.5-flash"];
  
  for (const modelName of models) {
    try {
      console.log(`Trying model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello");
      const response = await result.response;
      console.log(`Success with ${modelName}:`, response.text());
      return;
    } catch (err) {
      console.error(`Error with ${modelName}:`, err.message);
    }
  }
}

testKey();
