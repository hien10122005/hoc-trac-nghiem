import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "Server thiếu cấu hình API Key (GEMINI_API_KEY). Vui lòng kiểm tra lại Dashboard Vercel." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Parse request body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Không thể đọc dữ liệu yêu cầu" }, { status: 400 });
    }

    const { question, options, correctAnswer: rawCorrect, userAnswer: rawUser } = body;
    const toIndex = (val: any): number => {
      if (typeof val === "number") return val;
      if (typeof val === "string") {
        const code = val.toUpperCase().charCodeAt(0);
        if (code >= 65 && code <= 68) return code - 65;
      }
      return 0;
    };

    const correctAnswer = toIndex(rawCorrect);
    const userAnswer = rawUser !== null && rawUser !== undefined ? toIndex(rawUser) : null;

    if (!question || !options || !Array.isArray(options)) {
      return NextResponse.json({ error: "Dữ liệu câu hỏi không hợp lệ" }, { status: 400 });
    }

    const prompt = `
Bạn là QIU AI Tutor - Gia sư thông minh của hệ thống QIU. 
Hãy giải thích câu hỏi trắc nghiệm sau đây một cách ngắn gọn, dễ hiểu và chuyên nghiệp.

Câu hỏi: ${question}
Các lựa chọn:
${options.map((opt: string, i: number) => `${String.fromCharCode(65 + i)}. ${opt}`).join("\n")}

Đáp án đúng: ${String.fromCharCode(65 + correctAnswer)}
${userAnswer !== null ? `Học viên đã chọn: ${String.fromCharCode(65 + userAnswer)}` : ""}

Yêu cầu:
1. Giải thích tại sao đáp án ${String.fromCharCode(65 + correctAnswer)} là đúng.
2. Nếu học viên chọn sai, hãy chỉ ra lỗi sai phổ biến hoặc tại sao lựa chọn đó không chính xác.
3. Câu văn thân thiện, hiện đại, mang tinh thần QIU (ví dụ: "QIU-er", "các bạn học viên QIU"...).
4. Giới hạn ngắn gọn trong 3-5 câu.
5. Không dùng markdown phức tạp, chỉ dùng in đậm cho từ khóa.
`;

    // Chiến lược Fallback Model: Thử 2.0 trước, nếu lỗi thì xuống 1.5
    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];
    let lastError: any = null;

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (text) {
          return NextResponse.json({ 
            explanation: text,
            modelUsed: modelName 
          });
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed, trying next... Error:`, err.message);
        // Nếu lỗi không phải 429 hay 404 (ví dụ lỗi Auth) thì dừng luôn
        if (!err.message?.includes("429") && !err.message?.includes("404")) {
           break;
        }
        continue;
      }
    }

    // Nếu chạy hết vòng lặp mà vẫn lỗi
    console.error("All AI models failed. Last error from Google:", lastError);
    
    const googleErrorMessage = lastError?.message || "Lỗi không xác định từ Google API";
    
    // Trả về lỗi chi tiết để người dùng chẩn đoán Key
    return NextResponse.json({ 
      error: `Google API Error: ${googleErrorMessage}`,
      suggestion: "Vui lòng kiểm tra lại Quota hoặc Billing của Key này tại Google AI Studio."
    }, { status: 429 });

  } catch (err: any) {
    console.error("AI Route Panic:", err);
    return NextResponse.json({ error: "Lỗi hệ thống (Internal): " + err.message }, { status: 500 });
  }
}
