import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "Server thiếu cấu hình API Key (GEMINI_API_KEY)." }, { status: 500 });
    }

    // Parse request body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Không thể đọc dữ liệu yêu cầu" }, { status: 400 });
    }

    const { question, options, correctAnswer: rawCorrect, userAnswer: rawUser } = body;
    
    if (!question || !options || !Array.isArray(options)) {
      return NextResponse.json({ error: "Dữ liệu câu hỏi không hợp lệ" }, { status: 400 });
    }

    // 1. Tạo Cache Key từ câu hỏi và các lựa chọn (để tránh giải thích sai cho câu hỏi giống nhau nhưng đổi options)
    const normalizedContent = `${question.trim()}_${options.map(o => o.trim()).sort().join("|")}`;
    const cacheKey = crypto.createHash("md5").update(normalizedContent).digest("hex");

    // 2. Kiểm tra Cache trong Firestore
    try {
      const cacheRef = doc(db, "ai_explanations", cacheKey);
      const cacheSnap = await getDoc(cacheRef);
      
      if (cacheSnap.exists()) {
        console.log("AI Cache Hit: " + cacheKey);
        return NextResponse.json({ 
          explanation: cacheSnap.data().explanation,
          modelUsed: "cached",
          isCached: true
        });
      }
    } catch (cacheErr) {
      console.warn("Firestore Cache Check failed (soft error):", cacheErr);
    }

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

    const genAI = new GoogleGenerativeAI(apiKey);
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
3. Câu văn thân thiện, hiện đại, mang tinh thần QIU.
4. Giới hạn ngắn gọn trong 3-5 câu.
5. Không dùng markdown phức tạp.
`;

    // Ưu tiên 2.5-flash-lite > 2.5-flash > 2.0-flash-lite
    const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash-lite"];
    let lastError: any = null;

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (text) {
          // 3. Lưu vào Cache trước khi trả về
          try {
            await setDoc(doc(db, "ai_explanations", cacheKey), {
              explanation: text,
              model: modelName,
              question,
              createdAt: serverTimestamp()
            });
            console.log("AI Cache Saved: " + cacheKey);
          } catch (saveErr) {
            console.error("Failed to save AI cache:", saveErr);
          }

          return NextResponse.json({ 
            explanation: text,
            modelUsed: modelName 
          });
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed, trying next...`);
        if (!err.message?.includes("429") && !err.message?.includes("404") && !err.message?.includes("403")) {
           break;
        }
      }
    }

    const googleErrorMessage = lastError?.message || "Lỗi không xác định từ Google API";
    return NextResponse.json({ 
      error: `Google API Error: ${googleErrorMessage}`,
      suggestion: "Vui lòng kiểm tra lại Quota tại Google AI Studio."
    }, { status: 502 });

  } catch (err: any) {
    console.error("AI Route Panic:", err);
    return NextResponse.json({ error: "Lỗi hệ thống: " + err.message }, { status: 500 });
  }
}
