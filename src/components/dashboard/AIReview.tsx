"use client";

import { useState, useEffect } from "react";
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
  const [displayedAnalysis, setDisplayedAnalysis] = useState("");
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Hiệu ứng Typing Animation cho phần phân tích của AI
  useEffect(() => {
    if (aiData?.analysis) {
      let i = 0;
      const fullText = aiData.analysis;
      const interval = setInterval(() => {
        setDisplayedAnalysis(prev => prev + (fullText[i] || ""));
        i++;
        if (i >= fullText.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }
  }, [aiData]);

  const getIncorrectData = () => {
    const allIncorrect = results.flatMap(r => r.incorrectQuestions || []);
    const unique = Array.from(new Set(allIncorrect.map(q => q.content)))
      .slice(0, 5)
      .map(content => allIncorrect.find(q => q.content === content));
    
    return unique.filter(Boolean) as IncorrectQuestion[];
  };

  const handleAIAnalyze = async () => {
    const wrongQuestions = getIncorrectData();
    if (wrongQuestions.length === 0) {
      toast.error("Bạn cần hoàn thành ít nhất 1 bài thi để AI có dữ liệu phân tích");
      return;
    }

    setLoading(true);
    setAiData(null);
    setDisplayedAnalysis("");
    setIsAnswered(false);
    setSelectedAns(null);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wrongQuestions: wrongQuestions.map(q => ({
          q: q.content,
          options: q.options,
          correct: q.options[q.correctAnswer]
        })) })
      });

      if (!response.ok) throw new Error("Lỗi mạng hoặc API Server");
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setDisplayedAnalysis(""); // Khởi tạo lại chuỗi hiển thị trước khi bắt đầu typing
      setAiData(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gia sư AI đang bận, vui lòng thử lại sau!";
      console.error("AI Error:", error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative rounded-3xl border transition-all duration-700 ${
      loading ? "border-[#6c5ce7] shadow-[0_0_30px_rgba(108,92,231,0.3)] bg-[#6c5ce7]/5" : "border-white/10 bg-white/[0.03]"
    } p-8 backdrop-blur-xl overflow-hidden group`}>
      
      {/* Dynamic Glow Glow Background */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-[#6c5ce7]/20 to-transparent blur-[120px] animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Blur */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#6c5ce7]/10 blur-[100px] group-hover:bg-[#6c5ce7]/20 transition-all duration-700" />
      
      <div className="relative z-10 px-2 lg:px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#8e44ad] p-[1px] shadow-2xl shadow-[#6c5ce7]/20">
              <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#07070a]">
                <BrainCircuit size={32} className={`transition-colors duration-500 ${loading ? "text-[#00cec9]" : "text-[#a29bfe]"}`} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-extrabold text-white tracking-tight">AI Smart Review</h2>
                <Sparkles size={20} className="text-yellow-400 animate-bounce" />
              </div>
              <p className="text-xs text-slate-400 mt-1.5 uppercase tracking-widest font-black opacity-80 decoration-[#6c5ce7] decoration-2">DNC Virtual Tutor Hub</p>
            </div>
          </div>

          <button
            onClick={handleAIAnalyze}
            disabled={loading}
            className="group/btn flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-white text-black font-black text-sm hover:bg-[#6c5ce7] hover:text-white transition-all duration-500 shadow-2xl shadow-black/20 disabled:opacity-50 animate-pulse"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} className="group-hover/btn:rotate-180 transition-transform duration-500" />}
            {aiData ? "Phân tích lại" : "Khám phá tiềm năng"}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-16 space-y-6"
            >
              <div className="relative h-24 w-24">
                 <motion.div 
                   animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                   transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute inset-0 rounded-full border-2 border-[#6c5ce7] border-dashed shadow-[0_0_40px_rgba(108,92,231,0.6)]"
                 />
                 <div className="absolute inset-5 flex items-center justify-center text-[#6c5ce7]">
                    <Sparkles className="animate-pulse" size={32} />
                 </div>
              </div>
              <div className="space-y-2 text-center">
                <p className="text-white text-xl font-bold tracking-wide animate-pulse">
                  Gia sư AI đang quét dữ liệu lỗ hổng...
                </p>
                <p className="text-slate-500 text-sm font-medium">Bản sắc cá nhân hóa kiến thức Đại học Nam Cần Thơ</p>
              </div>
            </motion.div>
          ) : aiData ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-10"
            >
              {/* Persona Style Analysis Text */}
              <div className="relative p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent overflow-hidden group/card shadow-2xl">
                <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-[#6c5ce7] via-[#00cec9] to-[#6c5ce7] bg-[length:200%_100%] animate-shimmer" />
                <div className="flex items-center gap-3 mb-5">
                   <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                   <h4 className="text-sm font-black text-[#00cec9] uppercase tracking-[0.3em]">Lời thầy nhắn nhủ:</h4>
                </div>
                <p className="text-slate-100 leading-relaxed text-xl font-medium min-h-[4rem]">
                   {displayedAnalysis}
                   <motion.span 
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-1.5 h-6 bg-[#6c5ce7] ml-1 align-middle"
                   />
                </p>
              </div>

              {/* Question Section */}
              <div className="space-y-8 pb-4">
                <div className="flex items-center gap-4">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] whitespace-nowrap">Thử thách Củng cố Kiến thức</span>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
                </div>

                <div className="rounded-[2.5rem] bg-black/40 border border-white/5 p-10 shadow-inner">
                  <h3 className="text-2xl font-bold text-white mb-10 leading-snug">
                    {aiData.newQuestion.content}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {aiData.newQuestion.options.map((option, idx) => (
                      <button
                        key={idx}
                        disabled={isAnswered}
                        onClick={() => setSelectedAns(idx)}
                        className={`group relative flex items-center gap-5 rounded-2xl border p-6 text-left transition-all duration-300 ${
                          isAnswered
                            ? idx === aiData.newQuestion.correctAnswer
                              ? "border-[#00cec9] bg-[#00cec9]/15 scale-[1.02] shadow-lg shadow-[#00cec9]/10"
                              : idx === selectedAns
                              ? "border-red-500/50 bg-red-500/10 opacity-70"
                              : "border-white/5 opacity-40"
                            : selectedAns === idx
                            ? "border-[#6c5ce7] bg-[#6c5ce7]/20 shadow-lg shadow-[#6c5ce7]/10"
                            : "border-white/5 bg-white/[0.03] hover:border-white/20 hover:bg-white/5"
                        }`}
                      >
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 text-lg font-black transition-all duration-300 ${
                          selectedAns === idx ? "border-[#6c5ce7] bg-[#6c5ce7] text-white shadow-lg shadow-[#6c5ce7]/30" : "border-white/10 text-slate-500 group-hover:text-white"
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="font-semibold text-slate-200 text-lg">{option}</span>
                        
                        {isAnswered && idx === aiData.newQuestion.correctAnswer && (
                          <div className="absolute right-6 h-8 w-8 rounded-full bg-[#00cec9] flex items-center justify-center text-black">
                             <CheckCircle2 size={20} />
                          </div>
                        )}
                        {isAnswered && idx === selectedAns && idx !== aiData.newQuestion.correctAnswer && (
                          <div className="absolute right-6 h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-white">
                             <XCircle size={20} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {!isAnswered && selectedAns !== null && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-12 flex justify-center lg:justify-end"
                    >
                      <button
                        onClick={() => setIsAnswered(true)}
                        className="group flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] text-white font-black text-sm hover:shadow-[0_0_30px_rgba(108,92,231,0.4)] transition-all transform hover:-translate-y-1"
                      >
                        KIỂM TRA ĐÁP ÁN
                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
              <div className="relative">
                <div className="absolute inset-0 bg-[#6c5ce7]/20 blur-[60px] rounded-full" />
                <div className="relative h-28 w-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <BrainCircuit size={48} className="text-slate-600 group-hover:text-[#6c5ce7] transition-colors duration-500" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-white">Bạn sẵn sàng bứt phá?</h3>
                <p className="text-slate-500 max-w-lg text-lg leading-relaxed font-medium">
                  Gia sư AI sẽ phân tích mọi lỗi sai của bạn và gợi ý con đường ngắn nhất để đạt điểm tối đa. Bấm nút phía trên để bắt đầu!
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
      
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 10s linear infinite;
        }
      `}</style>
    </div>
  );
}
