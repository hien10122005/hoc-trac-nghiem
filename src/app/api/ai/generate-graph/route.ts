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

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
        }
    });

    const lessonsData = materials.map((m: any) => ({
      id: m.id,
      title: m.title,
      description: m.description
    }));

    const prompt = `
Bạn là chuyên gia thiết kế lộ trình học tập cao cấp.
Nhiệm vụ: Dựa vào danh sách bài học của môn "${subjectName || 'Chuyên ngành'}", hãy xác định các mối liên hệ logic, tiên quyết và ứng dụng giữa chúng.

Danh sách bài học:
${JSON.stringify(lessonsData)}

Yêu cầu trả về mảng JSON các "edges" nối các bài học. Mỗi edge gồm:
- source: ID của bài học làm tiền đề (bài học trước).
- target: ID của bài học tiếp theo (bài học sau).
- label: Giải thích ngắn gọn lý do kết nối (Ví dụ: "Kiến thức nền", "Ứng dụng thực tế", "Nâng cao").

Quy tắc:
1. Không tạo vòng lặp (A -> B -> A).
2. Chỉ tạo các liên kết thực sự có ý nghĩa sư phạm.
3. Trả về đúng định dạng JSON: { "edges": [{ "source": "...", "target": "...", "label": "..." }] }
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch (parseError) {
      return NextResponse.json({ 
        error: "AI trả về định dạng JSON không hợp lệ.", 
        raw: text 
      }, { status: 502 });
    }

  } catch (error: any) {
    console.error("Generate Graph Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
