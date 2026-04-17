"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  serverTimestamp,
  doc,
  getDoc
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Trophy, 
  RefreshCcw, 
  Home, 
  Eye, 
  Loader2,
  Send,
  HelpCircle,
  Info
} from "lucide-react";

interface Question {
  id: string;
  content: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizState {
  questions: Question[];
  currentIdx: number;
  userAnswers: (number | null)[];
  timeLeft: number; // in seconds
  isFinished: boolean;
  score: number;
  correctCount: number;
  reviewMode: boolean;
}

export default function QuizPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [state, setState] = useState<QuizState>({
    questions: [],
    currentIdx: 0,
    userAnswers: [],
    timeLeft: 20 * 60, // 20 minutes
    isFinished: false,
    score: 0,
    correctCount: 0,
    reviewMode: false,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUser(user);
      else router.push("/login");
    });
    return () => unsubscribe();
  }, [router]);

  // Shuffle Helper
  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Fetch and Shuffle Quiz
  useEffect(() => {
    async function loadQuiz() {
      if (!subjectId) return;

      try {
        // Fetch Subject Name
        const subDoc = await getDoc(doc(db, "subjects", subjectId));
        if (subDoc.exists()) setSubjectName(subDoc.data().name);

        // Fetch Questions
        const q = query(collection(db, "questions"), where("subjectId", "==", subjectId));
        const querySnapshot = await getDocs(q);
        const rawQuestions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Question[];

        if (rawQuestions.length === 0) {
          setLoading(false);
          return;
        }

        // Shuffle questions and options
        const processedQuestions = shuffleArray(rawQuestions).map(q => {
          const correctText = q.options[q.correctAnswer];
          const shuffledOptions = shuffleArray(q.options);
          const newCorrectAnswer = shuffledOptions.indexOf(correctText);
          return {
            ...q,
            options: shuffledOptions,
            correctAnswer: newCorrectAnswer
          };
        });

        setState(prev => ({
          ...prev,
          questions: processedQuestions,
          userAnswers: new Array(processedQuestions.length).fill(null)
        }));
      } catch (error) {
        console.error("Error loading quiz:", error);
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [subjectId]);

  // Timer logic
  useEffect(() => {
    if (state.questions.length > 0 && !state.isFinished && state.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.timeLeft <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleFinishQuiz(prev);
            return { ...prev, timeLeft: 0 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.questions.length, state.isFinished]);

  const handleFinishQuiz = async (currentState?: QuizState) => {
    const s = currentState || state;
    if (s.isFinished) return;

    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate score
    let correct = 0;
    s.userAnswers.forEach((ans, idx) => {
      if (ans === s.questions[idx].correctAnswer) correct++;
    });

    const score = Math.round((correct / s.questions.length) * 10);
    
    // Save to Firestore
    try {
      if (user) {
        await addDoc(collection(db, "results"), {
          userId: user.uid,
          userEmail: user.email,
          subjectId,
          subjectName,
          score,
          correctAnswers: correct,
          totalQuestions: s.questions.length,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error saving results:", error);
    }

    setState(prev => ({
      ...prev,
      isFinished: true,
      correctCount: correct,
      score: score
    }));
  };

  const handleSelectOption = (optIdx: number) => {
    if (state.isFinished) return;
    setState(prev => {
      const newAnswers = [...prev.userAnswers];
      newAnswers[prev.currentIdx] = optIdx;
      return { ...prev, userAnswers: newAnswers };
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // UI States
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0e17]">
        <Loader2 className="h-10 w-10 animate-spin text-[#6c5ce7]" />
      </div>
    );
  }

  if (state.questions.length === 0) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#0c0e17] text-[#f0f0fd] p-8 text-center">
        <div className="h-20 w-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
          <HelpCircle size={40} className="text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Môn học này chưa có câu hỏi</h2>
        <p className="text-slate-500 max-w-sm mb-8">Hệ thống đang cập nhật nội dung cho môn học này. Vui lòng quay lại sau.</p>
        <button onClick={() => router.push("/dashboard")} className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold">Quay lại Dashboard</button>
      </div>
    );
  }

  const currentQ = state.questions[state.currentIdx];
  const progress = ((state.currentIdx + 1) / state.questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#0c0e17] text-[#f0f0fd] font-manrope selection:bg-[#6c5ce7]/30 flex flex-col">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#6c5ce7]/3 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#00cec9]/3 blur-[120px]" />
      </div>

      {/* Header / Nav */}
      <header className="relative z-50 px-6 py-4 border-b border-white/5 bg-[#0c0e17]/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
             onClick={() => { if(confirm("Bạn có chắc muốn thoát? Kết quả sẽ không được lưu.")) router.push("/dashboard") }}
             className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="h-8 w-px bg-white/10 hidden sm:block" />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[#aca3ff] uppercase">{subjectName}</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Đang ôn tập</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${state.timeLeft < 300 ? "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse" : "bg-white/5 border-white/10 text-white"}`}>
            <Clock size={16} />
            <span className="font-mono font-bold">{formatTime(state.timeLeft)}</span>
          </div>
          <button 
            onClick={() => handleFinishQuiz()}
            className="hidden sm:flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#5b4bc4] text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#6c5ce7]/20"
          >
            <Send size={14} />
            <span>Nộp bài</span>
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="relative z-40 h-1.5 w-full bg-white/5 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Quiz Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
        <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Question Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#6c5ce7] uppercase tracking-widest bg-[#6c5ce7]/10 px-2 py-0.5 rounded">Câu hỏi {state.currentIdx + 1} / {state.questions.length}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold leading-snug tracking-tight">
              {currentQ.content}
            </h2>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-4">
            {currentQ.options.map((opt, i) => {
              const isSelected = state.userAnswers[state.currentIdx] === i;
              const isCorrect = i === currentQ.correctAnswer;
              const showReview = state.isFinished || state.reviewMode;

              let variantStyles = "border-white/5 bg-white/[0.02] text-[#f0f0fd] hover:border-[#6c5ce7]/30 hover:bg-white/[0.04]";
              
              if (isSelected && !showReview) {
                variantStyles = "bg-[#00cec9]/10 border-[#00cec9]/40 text-[#00cec9] shadow-[0_0_20px_rgba(0,206,201,0.05)]";
              }

              if (showReview) {
                 if (isCorrect) variantStyles = "bg-green-500/10 border-green-500/40 text-green-400";
                 else if (isSelected && !isCorrect) variantStyles = "bg-red-500/10 border-red-500/40 text-red-400";
                 else variantStyles = "opacity-50 border-white/5 bg-transparent text-slate-500";
              }

              return (
                <button
                  key={i}
                  disabled={showReview}
                  onClick={() => handleSelectOption(i)}
                  className={`flex items-center gap-5 p-5 md:p-6 rounded-3xl border text-left transition-all relative overflow-hidden group/opt ${variantStyles}`}
                >
                  <div className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center font-bold text-sm transition-all ${
                    isSelected ? "bg-[#00cec9] text-[#0a0a14]" : "bg-white/5 text-slate-500 group-hover/opt:bg-white/10"
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-base md:text-lg font-medium">{opt}</span>
                  
                  {showReview && isCorrect && <CheckCircle2 size={24} className="ml-auto text-green-400 shrink-0" />}
                  {showReview && isSelected && !isCorrect && <AlertCircle size={24} className="ml-auto text-red-500 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation in Review Mode */}
          {state.reviewMode && currentQ.explanation && (
            <div className="p-6 rounded-3xl bg-orange-500/5 border border-orange-500/10 space-y-2 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-widest">
                <Info size={14} />
                <span>Giải thích chi tiết</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed italic">{currentQ.explanation}</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="relative z-50 px-6 py-6 border-t border-white/5 bg-[#0c0e17]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button 
            disabled={state.currentIdx === 0}
            onClick={() => setState(p => ({ ...p, currentIdx: p.currentIdx - 1 }))}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-slate-400 font-bold hover:text-white disabled:opacity-0 transition-all"
          >
            <ChevronLeft size={20} />
            <span>Câu trước</span>
          </button>

          <div className="hidden md:flex gap-1">
             {state.questions.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1 rounded-full transition-all ${
                    idx === state.currentIdx ? "w-8 bg-[#6c5ce7]" : "w-2 bg-white/10"
                  } ${state.userAnswers[idx] !== null ? "bg-[#00cec9]/40" : ""}`}
                />
             ))}
          </div>

          {state.currentIdx === state.questions.length - 1 ? (
             <button 
                onClick={() => state.isFinished ? setState(p => ({ ...p, reviewMode: !p.reviewMode })) : handleFinishQuiz()}
                className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95 ${
                  state.isFinished 
                    ? "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10" 
                    : "bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] shadow-[#6c5ce7]/20"
                }`}
             >
               {state.isFinished ? <Eye size={18} /> : <Send size={18} />}
               <span>{state.isFinished ? "Xem lời giải" : "Nộp bài"}</span>
             </button>
          ) : (
            <button 
              onClick={() => setState(p => ({ ...p, currentIdx: p.currentIdx + 1 }))}
              className="group flex items-center gap-2 px-8 py-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold transition-all active:scale-95"
            >
              <span>Câu tiếp theo</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </footer>

      {/* Result Overlay */}
      {state.isFinished && !state.reviewMode && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0c0e17]/95 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="max-w-md w-full text-center space-y-10 animate-in zoom-in-95 duration-500">
               <div className="relative inline-block">
                  <div className="h-40 w-40 rounded-full border-4 border-white/5 flex items-center justify-center bg-white/[0.02]">
                     <div className="text-center">
                        <p className="text-5xl font-black text-white">{state.score}<span className="text-xl text-slate-500">/10</span></p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#6c5ce7] mt-1">Điểm số</p>
                     </div>
                  </div>
                  {state.score >= 5 && (
                    <div className="absolute -top-4 -right-4 h-14 w-14 rounded-full bg-gradient-to-br from-[#00cec9] to-[#6c5ce7] flex items-center justify-center text-white shadow-xl animate-bounce">
                      <Trophy size={24} />
                    </div>
                  )}
               </div>

               <div className="space-y-4">
                  <h2 className="text-3xl font-bold">
                    {state.score >= 8 ? "Thật xuất sắc!" : state.score >= 5 ? "Làm tốt lắm!" : "Cố gắng hơn nhé!"}
                  </h2>
                  <p className="text-slate-400">Bạn đã hoàn thành bài thi môn <span className="text-white font-bold">{subjectName}</span> với <span className="text-[#00cec9] font-bold">{state.correctCount}</span> câu trả lời đúng.</p>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center justify-center gap-2 py-4 rounded-3xl bg-white/5 border border-white/10 text-slate-300 font-bold hover:bg-white/10 hover:text-white transition-all"
                  >
                    <Home size={18} />
                    <span>Trang chủ</span>
                  </button>
                  <button 
                    onClick={() => setState(p => ({ ...p, reviewMode: true }))}
                    className="flex items-center justify-center gap-2 py-4 rounded-3xl bg-gradient-to-r from-[#6c5ce7] to-[#5b4bc4] text-white font-bold shadow-lg shadow-[#6c5ce7]/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Eye size={18} />
                    <span>Xem lại bài</span>
                  </button>
               </div>
            </div>
         </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        .font-manrope { font-family: 'Manrope', sans-serif; }
      `}</style>
    </div>
  );
}
