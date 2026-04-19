import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key chưa được cấu hình." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Không thể đọc dữ liệu yêu cầu" }, { status: 400 });
    }

    const { question, options, correctAnswer: rawCorrect, userAnswer: rawUser } = body;

    // Helper to convert 'A', 'B', 'C', 'D' or number to index 0-3
    const toIndex = (val: any) => {
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

    // Sử dụng gemini-2.5-flash (model miễn phí hiện có)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Bạn là một Gia sư tại Đại học Nam Cần Thơ (DNC). 
Hãy giải thích câu hỏi trắc nghiệm sau đây một cách ngắn gọn, dễ hiểu và chuyên nghiệp.

Câu hỏi: ${question}
Các lựa chọn:
${options.map((opt: string, i: number) => `${String.fromCharCode(65 + i)}. ${opt}`).join("\n")}

Đáp án đúng: ${String.fromCharCode(65 + correctAnswer)}
${userAnswer !== null ? `Học viên đã chọn: ${String.fromCharCode(65 + userAnswer)}` : ""}

Yêu cầu:
1. Giải thích tại sao đáp án ${String.fromCharCode(65 + correctAnswer)} là đúng.
2. Nếu học viên chọn sai, hãy chỉ ra lỗi sai phổ biến hoặc tại sao lựa chọn đó không chính xác.
3. Câu văn thân thiện, đậm chất DNC (với những từ như "DNC-er", "các bạn sinh viên"...).
4. Giới hạn trong khoảng 3-5 câu.
5. Không dùng markdown quá phức tạp, chỉ dùng in đậm cho các từ khóa quan trọng.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      return NextResponse.json({ error: "AI trả về kết quả rỗng" }, { status: 502 });
    }

    return NextResponse.json({ explanation: text });

  } catch (error: any) {
    console.error("AI Explain Error:", error);

    if (error.message?.includes("429")) {
      return NextResponse.json({ error: "AI đang bận (đạt giới hạn). Thử lại sau 1 phút." }, { status: 429 });
    }
    
    return NextResponse.json({ error: "Lỗi AI: " + (error.message || "Unknown") }, { status: 500 });
  }
}
