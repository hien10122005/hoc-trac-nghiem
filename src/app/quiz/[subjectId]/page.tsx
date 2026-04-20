"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  collection,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  getDocs,
  where
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Trophy, 
  Home, 
  Eye, 
  Loader2,
  Send,
  HelpCircle,
  Info,
  WifiOff,
  Wifi,
  Sparkles,
  Brain,
  Bookmark
} from "lucide-react";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

import { Question } from "@/types/question";
import { useBloomProgress } from "@/hooks/useBloomProgress";
import { FirestoreUserData } from "@/types/user";
import { Lock } from "lucide-react";

interface QuizState {
  questions: Question[]; // This will store the filtered questions for the active level
  allQuestions: Question[]; // All questions fetched for the subject
  activeLevel: 1 | 2 | 3 | 4;
  currentIdx: number;
  userAnswers: (number | null)[];
  timeLeft: number; 
  isFinished: boolean;
  score: number;
  correctCount: number;
  reviewMode: boolean;
}

export default function QuizPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  const router = useRouter();
  const [_user, setUser] = useState<FirebaseUser | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [_loading, setLoading] = useState(true);
  
  const [state, setState] = useState<QuizState>({
    questions: [],
    allQuestions: [],
    activeLevel: 1,
    currentIdx: 0,
    userAnswers: [],
    timeLeft: 20 * 60,
    isFinished: false,
    score: 0,
    correctCount: 0,
    reviewMode: false,
  });

  const [userStats, setUserStats] = useState<FirestoreUserData | null>(null);
  const bloomProgress = useBloomProgress(userStats?.subjectStats?.[subjectId]);

  const [isOnline, setIsOnline] = useState(true);
  const [showOnlineSuccess, setShowOnlineSuccess] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [draftData, setDraftData] = useState<{answers: (number|null)[], timeLeft: number, currentIdx: number} | null>(null);

  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [isExplaining, setIsExplaining] = useState(false);
  const isExplainingRef = useRef(false);
  const [savedQuestionIds, setSavedQuestionIds] = useState<Set<string>>(new Set());

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Network Status
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineSuccess(true);
      setTimeout(() => setShowOnlineSuccess(false), 3000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check Draft
  useEffect(() => {
    if (typeof window !== "undefined" && subjectId) {
       const saved = localStorage.getItem(`draft_quiz_${subjectId}`);
       if (saved) {
         try {
           setDraftData(JSON.parse(saved));
           setShowResumeModal(true);
         } catch {
           localStorage.removeItem(`draft_quiz_${subjectId}`);
         }
       }
    }
  }, [subjectId]);

  const restoreDraft = () => {
     if (draftData) {
       setState(prev => ({
          ...prev,
          userAnswers: draftData.answers || prev.userAnswers,
          timeLeft: draftData.timeLeft || prev.timeLeft,
          currentIdx: draftData.currentIdx || prev.currentIdx
       }));
     }
     setShowResumeModal(false);
  };
  
  const discardDraft = () => {
     localStorage.removeItem(`draft_quiz_${subjectId}`);
     setShowResumeModal(false);
  };


  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        // Fetch saved questions and user progress
        try {
          const statsRef = doc(db, "user_stats", authUser.uid);
          const statsSnap = await getDoc(statsRef);
          if (statsSnap.exists()) {
             const statsData = statsSnap.data() as FirestoreUserData;
             setUserStats(statsData);
             const saved = statsData.savedQuestions || [];
             setSavedQuestionIds(new Set(saved.map((item: {questionId: string}) => item.questionId)));
          }
        } catch (error) {
          console.warn("Could not fetch user stats:", error);
        }
      }
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
        const quizDoc = await getDoc(doc(db, "quizzes", subjectId));
        const rawQuestions = quizDoc.exists() ? (quizDoc.data().questions as Question[] || []) : [];

        setState(prev => {
          const filtered = rawQuestions.filter(q => (q.bloomLevel || 1) === prev.activeLevel);
          const shuffled = shuffleArray(filtered).map(q => {
            const correctText = q.options[q.correctAnswer];
            const shuffledOptions = shuffleArray(q.options);
            const newCorrectAnswer = shuffledOptions.indexOf(correctText);
            return { ...q, options: shuffledOptions, correctAnswer: newCorrectAnswer };
          });

          return {
            ...prev,
            allQuestions: rawQuestions,
            questions: shuffled,
            userAnswers: new Array(shuffled.length).fill(null)
          };
        });
      } catch (error) {
        console.error("Error loading quiz:", error);
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [subjectId]);

  const handleFinishQuiz = useCallback(async (currentState?: QuizState) => {
    const s = currentState || state;
    if (s.isFinished) return;

    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate score
    let correct = 0;
    const total = s.questions.length;

    s.userAnswers.forEach((ans, idx) => {
      if (ans === s.questions[idx].correctAnswer) {
        correct++;
      }
    });

    const score = total > 0 ? Math.round((correct / total) * 10) : 0;
    
    // Optimized Result Saving (1 Write Document = 1 Session)
    if (_user) {
      try {
        const userId = _user.uid;
        
        // 1. Lưu kết quả thi chi tiết (Dành cho bảng lịch sử)
        await addDoc(collection(db, "results"), {
          userId,
          userEmail: _user.email,
          subjectId,
          subjectName,
          score,
          correctCount: correct,
          totalQuestions: total,
          createdAt: serverTimestamp()
        });

        // 2. Aggregation: Cập nhật tài liệu tổng hợp user_stats
        const statsRef = doc(db, "user_stats", userId);
        
        const updateData: Record<string, any> = {
          totalExams: increment(1),
          totalCorrect: increment(correct),
          totalQuestions: increment(total),
          totalScoreSum: increment(score),
          lastUpdatedAt: serverTimestamp()
        };

        // Cập nhật thống kê theo môn học cụ thể
        updateData[`subjectStats.${subjectId}.totalExams`] = increment(1);
        updateData[`subjectStats.${subjectId}.totalCorrect`] = increment(correct);
        updateData[`subjectStats.${subjectId}.totalQuestions`] = increment(total);
        updateData[`subjectStats.${subjectId}.totalScoreSum`] = increment(score);
        updateData[`subjectStats.${subjectId}.name`] = subjectName;

        // Cập nhật thống kê Bloom Level
        const newCorrectStat = (userStats?.subjectStats?.[subjectId]?.bloomLevelStats?.[s.activeLevel]?.correct || 0) + correct;
        const newTotalStat = (userStats?.subjectStats?.[subjectId]?.bloomLevelStats?.[s.activeLevel]?.total || 0) + total;

        updateData[`subjectStats.${subjectId}.bloomLevelStats.${s.activeLevel}.correct`] = increment(correct);
        updateData[`subjectStats.${subjectId}.bloomLevelStats.${s.activeLevel}.total`] = increment(total);

        // Dùng merge: true để tạo mới nếu chưa có hoặc cập nhật nếu đã có
        await setDoc(statsRef, updateData, { merge: true });

        // Update local state to trigger bloomProgress update
        setUserStats(prev => {
          if (!prev) return prev;
          const newStats = { ...prev };
          if (!newStats.subjectStats) newStats.subjectStats = {};
          if (!newStats.subjectStats[subjectId]) {
              newStats.subjectStats[subjectId] = {
                  name: subjectName,
                  totalExams: 0,
                  totalCorrect: 0,
                  totalQuestions: 0,
                  totalScoreSum: 0,
                  bestScore: 0
              };
          }
          const sub = newStats.subjectStats[subjectId];
          sub.totalExams += 1;
          sub.totalCorrect += correct;
          sub.totalQuestions += total;
          sub.totalScoreSum += score;
          sub.bestScore = Math.max(sub.bestScore, score);
          
          if (!sub.bloomLevelStats) sub.bloomLevelStats = {};
          sub.bloomLevelStats[s.activeLevel] = { correct: newCorrectStat, total: newTotalStat };
          
          return newStats;
        });

        // 3. Cập nhật Best Score (Chỉ khi điểm mới cao hơn điểm cũ)
        const statsSnap = await getDoc(statsRef);
        if (statsSnap.exists()) {
          const stats = statsSnap.data();
          if (score > (stats.bestScore || 0)) {
            await setDoc(statsRef, { bestScore: score }, { merge: true });
          }
        }
      } catch (error) {
        console.warn("Could not save result/update stats:", error);
      }
    }

    // Clean up
    localStorage.removeItem(`draft_quiz_${subjectId}`);

    setState(prev => ({
      ...prev,
      isFinished: true,
      correctCount: correct,
      score: score
    }));

    // Success feedback
    if (total > 0 && (score >= 8 || correct / total >= 0.8)) {
      toast.success("Chúc mừng! Bạn đã đạt thành tích xuất sắc!", {
          icon: '🎉',
          style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
          },
      });

      const end = Date.now() + 3 * 1000;
      const colors = ['#a25afd', '#ff5e7e', '#88ff5a', '#26ccff'];

      (function frame() {
        confetti({
          particleCount: 8,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: colors
        });
        confetti({
          particleCount: 8,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }, [state, subjectId, subjectName, _user]);

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
  }, [state.questions.length, state.isFinished, state.timeLeft, handleFinishQuiz]);

  // Auto-save logic
  useEffect(() => {
    if (state.questions.length > 0 && !state.isFinished && subjectId) {
      localStorage.setItem(`draft_quiz_${subjectId}`, JSON.stringify({
        answers: state.userAnswers,
        timeLeft: state.timeLeft,
        currentIdx: state.currentIdx
      }));
    }
  }, [state.userAnswers, state.timeLeft, state.currentIdx, state.questions.length, state.isFinished, subjectId]);

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

  const handleSwitchLevel = (level: number) => {
    const levelData = bloomProgress.levels.find(l => l.level === level);
    if (!levelData?.isUnlocked) {
      toast.error(`Level ${level} đang bị khóa. Hãy đạt 80% Level ${level - 1} để mở rộng kiến thức!`);
      return;
    }

    setState(prev => {
      const filtered = prev.allQuestions.filter(q => (q.bloomLevel || 1) === level);
      if (filtered.length === 0) {
        toast.error(`Hiện tại chưa có câu hỏi nào cho Level ${level}.`);
        return prev;
      }

      const shuffled = shuffleArray(filtered).map(q => {
        const correctText = q.options[q.correctAnswer];
        const shuffledOptions = shuffleArray(q.options);
        const newCorrectAnswer = shuffledOptions.indexOf(correctText);
        return { ...q, options: shuffledOptions, correctAnswer: newCorrectAnswer };
      });

      return {
        ...prev,
        activeLevel: level as 1|2|3|4,
        questions: shuffled,
        currentIdx: 0,
        userAnswers: new Array(shuffled.length).fill(null),
        isFinished: false,
        reviewMode: false,
        timeLeft: 20 * 60
      };
    });
  };

  const handleAIExplain = async (qIdx: number) => {
    // 1. Chặn click tức thì ở tầng Ref (Synchronous)
    if (isExplainingRef.current) return; 
    
    // 2. Chặn click ở tầng State (Dùng cho UI re-render)
    if (isExplaining) return; 
    
    const question = state.questions[qIdx];
    const qKey = `${subjectId}_${qIdx}`;
    
    if (aiExplanations[qKey]) return;

    isExplainingRef.current = true; // Khóa Ref ngay lập tức
    setIsExplaining(true); // Bật trạng thái loading cho UI
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.content,
          options: question.options,
          correctAnswer: question.correctAnswer,
          userAnswer: state.userAnswers[qIdx] !== undefined ? state.userAnswers[qIdx] : null
        })
      });

      if (res.status === 429) {
        toast.error("Hệ thống AI đang quá tải. Vui lòng thử lại sau 1 phút!");
        return;
      }

      const data = await res.json();
      if (res.ok && data.explanation) {
        setAiExplanations(prev => ({ ...prev, [qKey]: data.explanation }));
        toast.success("Gia sư QIU đã trả lời!");
      } else {
        toast.error(data.error || "AI đang bận, vui lòng thử lại sau!");
      }
    } catch (_err) {
      toast.error("Có lỗi kết nối đến AI Tutor.");
    } finally {
      isExplainingRef.current = false; // Mở khóa Ref
      setIsExplaining(false); // Tắt loading UI
    }
  };

  const toggleBookmark = async (question: Question) => {
    if (!_user) return;
    const userId = _user.uid;
    const qId = question.id;
    const isBookmarked = savedQuestionIds.has(qId);
    
    const statsRef = doc(db, "user_stats", userId);
    
    try {
      if (isBookmarked) {
        // Remove
        await setDoc(statsRef, {
          savedQuestions: arrayRemove({
            subjectId,
            questionId: qId,
            content: question.content,
            savedAt: new Date().toISOString()
          })
        }, { merge: true });
        
        // Note: arrayRemove needs the EXACT object to match. 
        // This is tricky if savedAt differs. 
        // BETTER: Fetch, Filter, Update. Or use a separate collection.
        // Let's use the safer way for Saved Questions: Fetch -> Filter -> Set
        const snap = await getDoc(statsRef);
        if (snap.exists()) {
            const saved = snap.data().savedQuestions || [];
            const updated = saved.filter((item: {questionId: string}) => item.questionId !== qId);
            await updateDoc(statsRef, { savedQuestions: updated });
        }

        setSavedQuestionIds(prev => {
          const next = new Set(prev);
          next.delete(qId);
          return next;
        });
        toast.success("Đã bỏ lưu câu hỏi");
      } else {
        // Add
        const newItem = {
          subjectId,
          questionId: qId,
          content: question.content,
          savedAt: new Date().toISOString()
        };
        await setDoc(statsRef, {
          savedQuestions: arrayUnion(newItem)
        }, { merge: true });
        
        setSavedQuestionIds(prev => new Set(prev).add(qId));
        toast.success("Đã lưu câu hỏi vào kho cá nhân!", { icon: '🔖' });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast.error("Không thể cập nhật danh sách câu hỏi.");
    }
  };

  // UI States
  if (_loading) {
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
      {/* Network Status Banners */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-500 text-black py-2 px-4 flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-orange-500/20 animate-in slide-in-from-top-4">
          <WifiOff size={16} />
          <span>Bị mất kết nối! Đừng lo, bạn vẫn có thể làm tiếp. Bài thi sẽ được lưu tự động.</span>
        </div>
      )}
      {showOnlineSuccess && isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-emerald-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-emerald-500/20 animate-in slide-in-from-top-4">
          <Wifi size={16} />
          <span>Đã khôi phục kết nối!</span>
        </div>
      )}

      {/* Show Resume Modal */}
      {showResumeModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0c0e17]/95 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="max-w-md w-full rounded-3xl bg-[#10101f] border border-white/10 p-6 text-center shadow-2xl relative overflow-hidden">
               <div className="h-16 w-16 mx-auto rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center mb-4">
                 <Clock size={32} />
               </div>
               <h3 className="text-xl font-bold mb-2">Bạn có bài thi đang làm dở</h3>
               <p className="text-slate-400 text-sm mb-6">Hệ thống phát hiện bản lưu nháp. Bạn có muốn tiếp tục làm bài không?</p>
               <div className="flex justify-center gap-3">
                 <button onClick={discardDraft} className="px-5 py-2.5 rounded-xl bg-white/5 font-medium hover:bg-white/10 transition">Làm lại từ đầu</button>
                 <button onClick={restoreDraft} className="px-5 py-2.5 rounded-xl bg-blue-600 font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-500/20 text-white">Tiếp tục thi</button>
               </div>
            </div>
         </div>
      )}

      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#6c5ce7]/3 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#00cec9]/3 blur-[120px]" />
      </div>

      {/* Header / Nav */}
      <header className="relative z-50 px-6 py-4 border-b border-white/5 bg-[#0c0e17]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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
               <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Đang ôn tập - Level {state.activeLevel}</p>
             </div>
          </div>

          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${state.timeLeft < 300 ? "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse" : "bg-white/5 border-white/10 text-white"}`}>
              <Clock size={16} />
              <span className="font-mono font-bold">{formatTime(state.timeLeft)}</span>
            </div>
            <button 
              onClick={() => handleFinishQuiz()}
              className="group hidden sm:flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] px-6 py-3 text-sm font-black transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(108,92,231,0.3)]"
            >
              <Send size={18} />
              <span className="tracking-wide uppercase">Nộp bài</span>
            </button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="relative z-40 h-1.5 w-full bg-white/5 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
        <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Bloom Level Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {bloomProgress.levels.map((lvl) => {
              const isActive = state.activeLevel === lvl.level;
              const levelNames = ["Nhận biết", "Thông hiểu", "Vận dụng", "Nâng cao"];
              
              return (
                <button
                  key={lvl.level}
                  onClick={() => handleSwitchLevel(lvl.level)}
                  className={`group relative flex flex-col p-4 rounded-2xl border transition-all duration-500 overflow-hidden ${
                    isActive 
                      ? "bg-[#6c5ce7]/10 border-[#6c5ce7] shadow-xl shadow-[#6c5ce7]/10 scale-[1.02]" 
                      : lvl.isUnlocked 
                        ? "bg-white/5 border-white/5 hover:bg-white/10" 
                        : "bg-black/40 border-white/5 opacity-60 grayscale cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-[#6c5ce7]" : "text-slate-500"}`}>
                      Level {lvl.level}
                    </span>
                    {!lvl.isUnlocked && <Lock size={12} className="text-slate-600" />}
                  </div>
                  
                  <h4 className={`text-sm font-bold mb-3 ${isActive ? "text-white" : "text-slate-400"}`}>
                    {levelNames[lvl.level - 1]}
                  </h4>

                  {/* Progress Bar Mini */}
                  <div className="mt-auto">
                      <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-bold text-slate-500">{lvl.correct}/{lvl.total > 0 ? lvl.total : "?"}</span>
                          <span className="text-[9px] font-bold text-[#00cec9]">{Math.round(lvl.percentage)}%</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                              className={`h-full transition-all duration-1000 ${isActive ? "bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe]" : "bg-slate-700"}`}
                              style={{ width: `${Math.min(lvl.percentage, 100)}%` }}
                          />
                      </div>
                  </div>

                  {isActive && (
                    <div className="absolute -right-2 -top-2 h-12 w-12 bg-[#6c5ce7]/20 blur-2xl rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Question Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#6c5ce7] uppercase tracking-widest bg-[#6c5ce7]/10 px-2 py-0.5 rounded">Câu hỏi {state.currentIdx + 1} / {state.questions.length}</span>
              
              <button 
                onClick={() => toggleBookmark(currentQ)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                  savedQuestionIds.has(currentQ.id) 
                    ? "bg-[#6c5ce7]/20 border-[#6c5ce7]/40 text-[#aca3ff]" 
                    : "bg-white/5 border-white/5 text-slate-500 hover:text-white"
                }`}
              >
                <Bookmark size={16} fill={savedQuestionIds.has(currentQ.id) ? "currentColor" : "none"} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{savedQuestionIds.has(currentQ.id) ? "Đã lưu" : "Lưu câu hỏi"}</span>
              </button>
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

          {/* AI Explanation Section */}
          {(state.isFinished || state.reviewMode) && (
            <div className="space-y-4">
                {!aiExplanations[`${subjectId}_${state.currentIdx}`] ? (
                  <button 
                   onClick={() => handleAIExplain(state.currentIdx)}
                   disabled={isExplaining}
                   className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white text-sm font-bold shadow-lg shadow-[#6c5ce7]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:hover:scale-100"
                  >
                    {isExplaining ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Sparkles size={18} />
                    )}
                    <span>{isExplaining ? "✨ Đang phân tích..." : "✨ Giải thích bằng AI"}</span>
                  </button>
                ) : (
                 <div className="p-6 rounded-3xl bg-[#6c5ce7]/5 border border-[#6c5ce7]/20 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <Brain size={80} className="text-[#6c5ce7]" />
                    </div>
                    <div className="flex items-center gap-2 text-[#a29bfe] text-xs font-bold uppercase tracking-widest relative z-10">
                      <Sparkles size={14} />
                      <span>Trợ lý ảo QIU</span>
                    </div>
                    <div className="text-slate-300 text-sm leading-relaxed relative z-10 whitespace-pre-wrap">
                       {aiExplanations[`${subjectId}_${state.currentIdx}`]}
                    </div>
                    <div className="pt-2 flex items-center gap-2 text-[10px] text-slate-500 italic relative z-10">
                       <Info size={10} />
                       <span>Nội dung được tạo bởi AI Gemini - Luôn kiểm tra lại kiến thức chính thống.</span>
                    </div>
                 </div>
               )}
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
                  
                  {/* Unlock Notification */}
                  {state.score >= 8 && state.activeLevel < 4 && (
                      <div className="mt-6 p-4 rounded-2xl bg-[#6c5ce7]/10 border border-[#6c5ce7]/20 flex items-center justify-center gap-3 animate-bounce">
                        <div className="h-10 w-10 rounded-full bg-[#6c5ce7] flex items-center justify-center text-white">
                           <Trophy size={20} />
                        </div>
                        <div className="text-left">
                           <p className="text-xs font-bold text-[#aca3ff] uppercase tracking-tighter">Thành tựu mới!</p>
                           <p className="text-sm font-bold text-white">Đã mở khóa Level {state.activeLevel + 1} thành công!</p>
                        </div>
                      </div>
                  )}
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
