import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "Server thiếu cấu hình API Key (GEMINI_API_KEY). Vui lòng kiểm tra lại Dashboard Vercel." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { wrongQuestions } = (await req.json()) as { wrongQuestions: Record<string, unknown>[] };

    if (!wrongQuestions || !Array.isArray(wrongQuestions) || wrongQuestions.length === 0) {
      return NextResponse.json({ error: "Bạn cần hoàn thành ít nhất 1 bài thi để AI có dữ liệu phân tích" }, { status: 400 });
    }

    // Model Lite để xử lý nhanh nhất
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const aiPrompt = `
      Bạn là QIU AI Tutor - Gia sư thông minh của hệ thống QIU (Nền tảng Học tập Thông minh). 
      Dưới đây là các câu hỏi trắc nghiệm mà học viên của bạn đã làm sai:
      ${JSON.stringify(wrongQuestions)}

      Yêu cầu:
      1. Phân tích lỗ hổng kiến thức: Dựa trên các lỗi sai, hãy đưa ra nhận xét chuyên môn (3-4 câu) bằng giọng văn chuyên nghiệp, động viên nhưng vẫn cực kỳ sắc bén trong việc chỉ ra kiến thức bị hổng.
      2. Tạo 1 câu hỏi tương đương: Tạo 1 câu hỏi trắc nghiệm mới cùng chủ đề để giúp học viên củng cố lại kiến thức vừa hổng.
      
      Phải trả về kết quả dưới định dạng JSON duy nhất như sau (không kèm markdown):
      {
        "analysis": "Lời nhận xét và phân tích của QIU AI Tutor...",
        "newQuestion": {
          "content": "Nội dung câu hỏi luyện tập mới...",
          "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
          "correctAnswer": 0
        }
      }
      Lưu ý: "correctAnswer" là số nguyên từ 0-3 tương ứng với vị trí đáp án đúng trong mảng options.
    `;

    console.log("Calling Gemini API for AI Smart Review. Total questions to analyze:", wrongQuestions.length);
    let result;
    try {
      result = await model.generateContent(aiPrompt);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      console.error("Lỗi từ Gemini API:", apiError);
      return NextResponse.json({ error: "Lỗi kết nối Gemini API bị từ chối: " + (apiError.message || "Unknown error") }, { status: 502 });
    }

    const response = await result.response;
    const text = response.text();
    
    // Clean potential markdown if AI returns it despite instructions
    const jsonStr = text.replace(/```json|```/g, "").trim();
    
    try {
      const data = JSON.parse(jsonStr);
      return NextResponse.json(data);
    } catch {
      console.error("JSON Parse Error:", text);
      return NextResponse.json({ error: "Không thể xử lý phản hồi từ AI" }, { status: 500 });
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Lỗi server";
    console.error("AI API Error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
