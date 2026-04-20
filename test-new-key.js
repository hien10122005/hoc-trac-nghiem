const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  const apiKey = "AIzaSyAKA0xtxYQbOHAyOxbi8G317neBJr19Fiw";
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
     const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
     const result = await model.generateContent("Hello, are you working?");
     const response = await result.response;
     console.log("SUCCESS GEMINI 2.0:", response.text());
  } catch(e) { 
     console.log("FAILED GEMINI 2.0:", e.message); 
  }

  try {
     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
     const result = await model.generateContent("Hello, are you working?");
     const response = await result.response;
     console.log("SUCCESS GEMINI 1.5:", response.text());
  } catch(e) { 
     console.log("FAILED GEMINI 1.5:", e.message); 
  }
}
test();
