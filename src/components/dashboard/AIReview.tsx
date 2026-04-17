"use client";

import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BrainCircuit, ChevronRight, CheckCircle2, XCircle, RefreshCw, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface IncorrectQuestion {
  content: string;
  options: string[];
  correctAnswer: number;
  userAnswer: number | null;
  explanation: string;
}

interface Result {
  incorrectQuestions?: IncorrectQuestion[];
}

interface AIReviewProps {
  results: Result[];
}

interface AIResponse {
  analysis: string;
  newQuestion: {
    content: string;
    options: string[];
    correctAnswer: number; // 0-based index
  };
}

export default function AIReview({ results }: AIReviewProps) {
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Group and get the most frequent wrong questions (top 5)
  const getIncorrectData = () => {
    const allIncorrect = results.flatMap(r => r.incorrectQuestions || []);
    // Take the 5 most recent unique questions
    const unique = Array.from(new Set(allIncorrect.map(q => q.content)))
      .slice(0, 5)
      .map(content => allIncorrect.find(q => q.content === content));
    
    return unique.filter(Boolean) as IncorrectQuestion[];
  };

  const handleAIAnalyze = async () => {
    const wrongQuestions = getIncorrectData();
    if (wrongQuestions.length === 0) {
      toast.error("Bạn cần hoàn thành ít nhất 1 bài thi và có câu sai để AI phân tích!");
      return;
    }

    setLoading(true);
    setAiData(null);
    setIsAnswered(false);
    setSelectedAns(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key chưa được cấu hình!");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Dưới đây là danh sách các câu hỏi trắc nghiệm mà học viên đã làm sai:
        ${JSON.stringify(wrongQuestions.map(q => ({ q: q.content, options: q.options, correct: q.options[q.correctAnswer] })))}

        Nhiệm vụ của bạn:
        1. Phân tích ngắn gọn (khoảng 3-4 câu) lý do học viên thường sai ở các kiến thức này.
        2. Tạo ra 1 câu hỏi trắc nghiệm MỚI tương tự (cùng cấp độ khó) để kiểm tra lại kiến thức.
        
        Trả về kết quả dưới dạng JSON CHÍNH XÁC với cấu trúc:
        {
          "analysis": "Lời giải thích của bạn...",
          "newQuestion": {
            "content": "Nội dung câu hỏi mới...",
            "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
            "correctAnswer": 0
          }
        }
        Lưu ý: "correctAnswer" là index của mảng options (0 đến 3).
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean potential markdown code blocks
      const jsonStr = text.replace(/```json|```/g, "").trim();
      const data: AIResponse = JSON.parse(jsonStr);
      setAiData(data);
    } catch (error) {
      console.error("AI Error:", error);
      toast.error("Không thể kết nối với AI. Vui lòng thử lại sau!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#6c5ce7]/10 blur-[100px] group-hover:bg-[#6c5ce7]/20 transition-all duration-700" />
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#8e44ad] p-0.5 shadow-lg shadow-[#6c5ce7]/20">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#07070a]">
                <BrainCircuit size={28} className="text-[#a29bfe]" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Góc Ôn Tập Thông Minh <Sparkles size={20} className="text-yellow-400" />
              </h2>
              <p className="text-sm text-slate-400 mt-1 uppercase tracking-widest font-bold">AI - Powered Knowledge Coach</p>
            </div>
          </div>

          <button
            onClick={handleAIAnalyze}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] text-white font-bold text-sm shadow-xl shadow-[#6c5ce7]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            {aiData ? "Phân tích lại" : "Bắt đầu phân tích"}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-12 space-y-4"
            >
              <div className="relative h-20 w-20">
                 <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[#6c5ce7] shadow-[0_0_20px_rgba(108,92,231,0.5)]"
                 />
                 <div className="absolute inset-4 flex items-center justify-center">
                    <BrainCircuit className="text-[#6c5ce7] animate-pulse" size={32} />
                 </div>
              </div>
              <p className="text-slate-400 font-medium animate-pulse text-lg tracking-wide">
                AI đang phân tích lỗ hổng kiến thức của bạn...
              </p>
            </motion.div>
          ) : aiData ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Analysis Text */}
              <div className="relative p-6 rounded-2xl border border-[#6c5ce7]/30 bg-[#6c5ce7]/5 overflow-hidden">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#6c5ce7] to-[#00cec9]" />
                <h4 className="text-sm font-bold text-[#a29bfe] uppercase tracking-widest mb-3">AI Nhận xét:</h4>
                <p className="text-slate-200 leading-relaxed italic text-lg">
                  &ldquo;{aiData.analysis}&rdquo;
                </p>
              </div>

              {/* New Practice Question */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-0.5 flex-1 bg-white/5" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Thử thách Củng cố Kiến thức</span>
                  <div className="h-0.5 flex-1 bg-white/5" />
                </div>

                <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-8">
                  <h3 className="text-xl font-bold text-white mb-8 leading-tight">
                    {aiData.newQuestion.content}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiData.newQuestion.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => !isAnswered && setSelectedAns(idx)}
                        className={`group relative flex items-center gap-4 rounded-xl border p-5 text-left transition-all ${
                          isAnswered
                            ? idx === aiData.newQuestion.correctAnswer
                              ? "border-[#00cec9] bg-[#00cec9]/10"
                              : idx === selectedAns
                              ? "border-red-500/50 bg-red-500/10"
                              : "border-white/5 opacity-50"
                            : selectedAns === idx
                            ? "border-[#6c5ce7] bg-[#6c5ce7]/10"
                            : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        }`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition-colors ${
                          selectedAns === idx ? "border-[#6c5ce7] bg-[#6c5ce7] text-white" : "border-white/10 text-slate-400 group-hover:text-white"
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="font-medium text-slate-200">{option}</span>
                        
                        {isAnswered && idx === aiData.newQuestion.correctAnswer && (
                          <CheckCircle2 size={24} className="absolute right-4 text-[#00cec9]" />
                        )}
                        {isAnswered && idx === selectedAns && idx !== aiData.newQuestion.correctAnswer && (
                          <XCircle size={24} className="absolute right-4 text-red-500" />
                        )}
                      </button>
                    ))}
                  </div>

                  {!isAnswered && selectedAns !== null && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 flex justify-end"
                    >
                      <button
                        onClick={() => setIsAnswered(true)}
                        className="group flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-[#6c5ce7] hover:text-white transition-all shadow-xl"
                      >
                        Xác nhận đáp án
                        <ChevronRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <BrainCircuit size={40} className="text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sẵn sàng phân tích?</h3>
              <p className="text-slate-500 max-w-sm">
                AI sẽ quét qua lịch sử làm bài để chỉ ra những điểm bạn còn yếu và giúp bạn luyện tập thêm.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
