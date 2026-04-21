import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "Server thiếu cấu hình API Key (GEMINI_API_KEY)." }, { status: 500 });
    }

    const body = await req.json();
    const { subjectName, rawContent } = body;

    if (!rawContent || typeof rawContent !== "string") {
      return NextResponse.json({ error: "Nội dung văn bản không hợp lệ." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `
Bạn là một Senior Learning Architect chuyên nghiệp.
Nhiệm vụ: Phân tích nội dung văn bản sau đây để xây dựng một "Sơ đồ tri thức" (Knowledge Graph) hoàn chỉnh cho môn học "${subjectName || 'Chuyên ngành'}".

Nội dung văn bản:
"${rawContent.substring(0, 50000)}" 

Yêu cầu kỹ thuật:
1. Trích xuất tối thiểu 10-15 node quan trọng nhất thể hiện các chủ đề, bài học hoặc mục tiêu kiến thức.
2. Xác định các mối liên hệ (edges) giữa chúng:
   - "Prerequisite": Mối quan hệ tiên quyết (Bài A phải học trước bài B).
   - "Next Step": Mối quan hệ tiếp nối logic.
   - "Related": Mối quan hệ liên quan bổ trợ.
3. Tự động tính toán tọa độ (x, y) để sơ đồ trông cân đối (Ví dụ: x tăng dần theo tiến trình, y thay đổi để phân nhánh).

Trả về cấu trúc JSON chính xác như sau:
{
  "nodes": [
    { "id": "node-1", "label": "Tên chủ đề", "description": "Mô tả ngắn", "x": 100, "y": 100 }
  ],
  "edges": [
    { "id": "e1-2", "source": "node-1", "target": "node-2", "label": "Tiền đề" }
  ]
}

Quy tắc quan trọng:
- Trả về DUY NHẤT mã JSON. Không có văn bản giải thích.
- Các node phải có ID duy nhất.
- Đảm bảo sơ đồ không có vòng lặp logic (Cycle).
`;

    const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-1.5-flash"];
    let lastError: any = null;

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.2,
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
