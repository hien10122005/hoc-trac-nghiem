import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "Server missing GEMINI_API_KEY." }, { status: 500 });
    }

    const { material } = (await req.json()) as { material: string };

    if (!material || material.length < 50) {
      return NextResponse.json({ error: "Nội dung quá ngắn để tạo bộ thẻ (tối thiểu 50 ký tự)." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" }
    });

    const aiPrompt = `
      Bạn là chuyên gia phân tích dữ liệu giáo dục của hệ thống QIU.
      Nhiệm vụ: Chuyển đổi nội dung dưới đây thành đúng 10 thẻ ghi nhớ (Flashcards) cực kỳ chất lượng.
      
      NỘI DUNG:
      "${material}"
      
      YÊU CẦU CHI TIẾT:
      1. Số lượng: Chính xác 10 thẻ.
      2. Nội dung: Chỉ tập trung vào "Key Takeaways" (Ý chính cốt lõi). Không lan man.
      3. Gợi ý (Hints): Phải có "Memetic hints" (Mẹo nhớ nhanh, ví dụ các từ viết tắt, hình ảnh liên tưởng, hoặc các vần điệu vui nhộn).
      4. Ngôn ngữ: Tiếng Việt, văn phong hiện đại, chuyên nghiệp.
      
      ĐỊNH DẠNG JSON:
      {
        "cards": [
          {
            "frontText": "Câu hỏi hoặc khái niệm (Ngắn gọn)",
            "backText": "Giải nghĩa hoặc câu trả lời (Dưới 30 từ)",
            "hint": "Mẹo nhớ nhanh..."
          }
        ]
      }
    `;

    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    const text = response.text();
    
    const data = JSON.parse(text);
    
    // Đảm bảo card nào cũng có ID ngẫu nhiên
    const cardsWithIds = data.cards.map((c: any, index: number) => ({
      ...c,
      id: `ai_${Date.now()}_${index}`
    }));

    return NextResponse.json({ cards: cardsWithIds });

  } catch (error: any) {
    console.error("AI Flashcard Generation Error:", error);
    return NextResponse.json({ error: "Lỗi Server: " + (error.message || "Unknown error") }, { status: 500 });
  }
}
