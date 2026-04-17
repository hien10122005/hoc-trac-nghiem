import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { wrongQuestions } = await req.json();

    if (!wrongQuestions || !Array.isArray(wrongQuestions)) {
      return NextResponse.json({ error: "Dữ liệu câu hỏi không hợp lệ" }, { status: 400 });
    }

    // Model Lite để xử lý nhanh nhất
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Bạn là một Gia sư tận tâm tại Đại học Nam Cần Thơ (DNC). 
      Dưới đây là các câu hỏi trắc nghiệm mà học viên của bạn đã làm sai:
      ${JSON.stringify(wrongQuestions)}

      Yêu cầu:
      1. Phân tích lỗ hổng kiến thức: Dựa trên các lỗi sai, hãy đưa ra nhận xét chuyên môn (3-4 câu) bằng giọng văn của một thầy giáo miền Tây thân thiện, gần gũi.
      2. Tạo 1 câu hỏi tương đương: Tạo 1 câu hỏi trắc nghiệm mới cùng chủ đề để giúp học viên củng cố lại kiến thức vừa hổng.
      
      Phải trả về kết quả dưới định dạng JSON duy nhất như sau (không kèm markdown):
      {
        "analysis": "Lời nhận xét và phân tích của thầy...",
        "newQuestion": {
          "content": "Nội dung câu hỏi luyện tập mới...",
          "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
          "correctAnswer": 0
        }
      }
      Lưu ý: "correctAnswer" là số nguyên từ 0-3 tương ứng với vị trí đáp án đúng trong mảng options.
    `;

    const result = await model.generateContent(prompt);
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
