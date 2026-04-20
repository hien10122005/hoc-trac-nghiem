import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "Server thiếu cấu hình API Key (GEMINI_API_KEY)." }, { status: 500 });
    }

    const body = await req.json();
    const { subjectName, materials } = body;

    if (!materials || !Array.isArray(materials)) {
      return NextResponse.json({ error: "Danh sách bài học không hợp lệ." }, { status: 400 });
    }

    const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-1.5-flash"];
    let lastError: any = null;

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        const parsed = JSON.parse(text);
        return NextResponse.json(parsed);

      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed in graph generation, trying next...`);
        if (!err.message?.includes("429") && !err.message?.includes("404") && !err.message?.includes("403")) {
          break;
        }
      }
    }

  } catch (error: any) {
    console.error("Generate Graph Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
