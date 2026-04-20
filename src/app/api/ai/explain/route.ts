import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json({ error: "Server thiếu cấu hình API Key (GEMINI_API_KEY). Vui lòng kiểm tra lại Dashboard Vercel." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Parse request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Không thể đọc dữ liệu yêu cầu" }, { status: 400 });
    }

    const { question, options, correctAnswer: rawCorrect, userAnswer: rawUser } = body as {
      question: string;
      options: string[];
      correctAnswer: string | number;
      userAnswer?: string | number | null;
    };

    // Helper to convert 'A', 'B', 'C', 'D' or number to index 0-3
    const toIndex = (val: string | number | null | undefined): number => {
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

    // Sử dụng model mới nhất tương thích với API Key của QIU
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
3. Câu văn thân thiện, hiện đại, mang tinh thần QIU (với những từ như "QIU-er", "các bạn học viên QIU"...).
4. Giới hạn trong khoảng 3-5 câu.
5. Không dùng markdown quá phức tạp, chỉ dùng in đậm cho các từ khóa.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      return NextResponse.json({ error: "AI trả về kết quả rỗng" }, { status: 502 });
    }

    return NextResponse.json({ explanation: text });

  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error("AI Explain Error:", error);

    if (error.message?.includes("429")) {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }

    return NextResponse.json({ error: "Lỗi AI: " + (error.message || "Unknown error") }, { status: 500 });
  }
}
