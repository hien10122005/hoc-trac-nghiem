import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "Server thiếu API Key (GEMINI_API_KEY)." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { title, content, subjectId, count = 10 } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Nội dung tài liệu không được để trống." }, { status: 400 });
    }

    const aiPrompt = `
      Bạn là chuyên gia thiết kế đề thi trắc nghiệm theo thang tư duy Bloom.
      Nhiệm vụ: Dựa trên tài liệu "${title}" có nội dung bên dưới, hãy tạo ${count} câu hỏi trắc nghiệm.
      
      Phân bổ cấp độ Bloom (BẮT BUỘC):
      - Level 1 (Nhận biết - Remember): 40% (Ví dụ: Hỏi về định nghĩa, ngày tháng, tên nhân vật).
      - Level 2 (Thông hiểu - Understand): 30% (Ví dụ: Yêu cầu giải thích ý nghĩa, tóm tắt ý chính).
      - Level 3 (Vận dụng - Apply): 20% (Ví dụ: Áp dụng công thức/lý thuyết vào tình huống cụ thể).
      - Level 4 (Phân tích/Đánh giá - Analyze/Evaluate): 10% (Ví dụ: So sánh, đánh giá tính đúng đắn, phân tích nguyên nhân - kết quả).

      Nội dung tài liệu:
      ${content}

      Yêu cầu định dạng phản hồi (JSON duy nhất, không kèm Markdown):
      {
        "questions": [
          {
            "content": "Câu hỏi...",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": 0,
            "explanation": "Giải thích tại sao chọn đáp án này...",
            "bloomLevel": 1
          }
        ]
      }
      Lưu ý quan trọng: "correctAnswer" là số nguyên 0-3. "bloomLevel" BẮT BUỘC có giá trị 1, 2, 3 hoặc 4.
    `;

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

        const result = await model.generateContent(aiPrompt);
        const response = await result.response;
        const text = response.text().trim();
        const data = JSON.parse(text);
        
        // Validation & Default values if AI misses something
        if (data.questions && Array.isArray(data.questions)) {
          data.questions = data.questions.map((q: any) => ({
            ...q,
            bloomLevel: [1, 2, 3, 4].includes(q.bloomLevel) ? q.bloomLevel : 1,
            subjectId: subjectId || "unknown"
          }));
        }

        return NextResponse.json(data);
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed, trying next...`);
        if (!err.message?.includes("429") && !err.message?.includes("404") && !err.message?.includes("403")) {
          break;
        }
      }
    }

  } catch (error: any) {
    console.error("AI API Error:", error);
    return NextResponse.json({ error: "Lỗi Server: " + (error.message || "Unknown error") }, { status: 500 });
  }
}
