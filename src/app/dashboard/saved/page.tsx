"use client";

import { useState, useEffect } from "react";
import { 
  Bookmark, 
  Trash2, 
  Search, 
  HelpCircle,
  Loader2,
  BookOpen,
  ArrowLeft,
  Info,
  CheckCircle2
} from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import Link from "next/link";
import toast from "react-hot-toast";

interface SavedQuestion {
  subjectId: string;
  questionId: string;
  content: string;
  savedAt: string;
}

interface QuestionDetail {
  id: string;
  content: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function SavedQuestionsPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [savedList, setSavedList] = useState<SavedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionDetail | null>(null);
  const [subjects, setSubjects] = useState<Record<string, string>>({});

  const fetchSavedQuestions = async (uid: string) => {
    try {
      const statsRef = doc(db, "user_stats", uid);
      const statsSnap = await getDoc(statsRef);
      if (statsSnap.exists()) {
        const saved = statsSnap.data().savedQuestions || [];
        // Sort by newest
        setSavedList(saved.sort((a: SavedQuestion, b: SavedQuestion) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()));
        
        // Fetch subject names
        const subjectIds = Array.from(new Set(saved.map((q: SavedQuestion) => q.subjectId)));
        const subjectNames: Record<string, string> = {};
        
        for (const sId of subjectIds as string[]) {
           const sDoc = await getDoc(doc(db, "subjects", sId));
           if (sDoc.exists()) {
             subjectNames[sId] = sDoc.data().name;
           }
        }
        setSubjects(subjectNames);
      }
    } catch (error) {
      console.error("Error fetching saved questions:", error);
      toast.error("Không thể tải danh sách câu hỏi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        fetchSavedQuestions(authUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const removeBookmark = async (qId: string) => {
    if (!user) return;
    if (!confirm("Bạn có chắc muốn bỏ lưu câu hỏi này?")) return;

    try {
      const statsRef = doc(db, "user_stats", user.uid);
      const updatedList = savedList.filter(item => item.questionId !== qId);
      await updateDoc(statsRef, { savedQuestions: updatedList });
      setSavedList(updatedList);
      toast.success("Đã xóa khỏi kho lưu trữ");
    } catch (error) {
      toast.error("Lỗi khi xóa câu hỏi");
    }
  };

  const viewQuestionDetail = async (item: SavedQuestion) => {
    const toastId = toast.loading("Đang tải chi tiết câu hỏi...");
    try {
      const quizDoc = await getDoc(doc(db, "quizzes", item.subjectId));
      if (quizDoc.exists()) {
        const questions = quizDoc.data().questions || [];
        const qDetail = questions.find((q: QuestionDetail) => q.id === item.questionId);
        if (qDetail) {
          setSelectedQuestion(qDetail);
          toast.dismiss(toastId);
        } else {
          toast.error("Câu hỏi này không còn tồn tại trên hệ thống.", { id: toastId });
        }
      }
    } catch (error) {
       toast.error("Lỗi khi tải chi tiết.", { id: toastId });
    }
  };

  const filteredList = savedList.filter(q => 
    q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (subjects[q.subjectId] || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#6c5ce7]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Kho lưu trữ <span className="bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] bg-clip-text text-transparent">Cá nhân</span>
          </h1>
          <p className="text-slate-400 mt-1">Nơi ôn tập lại những câu hỏi bạn đã đánh dấu.</p>
        </div>
      </div>

      <div className="relative md:max-w-md">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input 
          type="text" 
          placeholder="Tìm kiếm câu hỏi hoặc môn học..."
          className="w-full rounded-2xl border border-white/5 bg-[#10101f] py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-[#6c5ce7]/50 focus:ring-4 focus:ring-[#6c5ce7]/5 transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredList.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredList.map((q) => (
            <div 
              key={q.questionId}
              className="group relative flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-[#10101f] to-[#16162d] border border-white/5 p-6 hover:border-[#6c5ce7]/30 transition-all duration-300"
            >
              <div className="flex items-center gap-5 flex-1 cursor-pointer" onClick={() => viewQuestionDetail(q)}>
                <div className="h-14 w-14 rounded-2xl bg-[#6c5ce7]/10 flex items-center justify-center text-[#6c5ce7] shadow-inner group-hover:scale-110 transition-transform">
                  <Bookmark size={24} fill="currentColor" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{subjects[q.subjectId] || "Môn học"}</span>
                     <span className="h-1 w-1 rounded-full bg-slate-700" />
                     <span className="text-[10px] text-slate-500">{new Date(q.savedAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#aca3ff] transition-colors line-clamp-2">{q.content}</h3>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => viewQuestionDetail(q)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 text-xs font-bold transition-all"
                >
                  Xem đáp án
                </button>
                <button 
                  onClick={() => removeBookmark(q.questionId)}
                  className="p-3 rounded-xl bg-red-500/5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[400px] rounded-[2.5rem] border-2 border-dashed border-white/5 bg-[#10101f]/30">
          <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <HelpCircle size={40} className="text-slate-700" />
          </div>
          <h3 className="text-xl font-bold text-white">Chưa có câu hỏi nào được lưu</h3>
          <p className="text-slate-500 mt-2 text-center max-w-sm px-6">
            Trong lúc làm bài thi, hãy nhấn vào biểu tượng 🔖 để lưu những câu hỏi khó vào đây nhé.
          </p>
          <Link href="/dashboard" className="mt-8 px-8 py-3 rounded-2xl bg-[#6c5ce7]/10 text-[#aca3ff] font-bold border border-[#6c5ce7]/20 hover:bg-[#6c5ce7] hover:text-white transition-all shadow-xl">
             Khám phá thư viện ngay
          </Link>
        </div>
      )}

      {/* Question Detail Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a14]/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl rounded-[2.5rem] bg-[#10101f] border border-white/10 shadow-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <BookOpen className="text-[#6c5ce7]" />
                  <h3 className="text-xl font-bold text-white">Chi tiết câu hỏi</h3>
               </div>
               <button onClick={() => setSelectedQuestion(null)} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400">
                  <ArrowLeft size={20} />
               </button>
            </div>
            
            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
               <h4 className="text-xl font-bold leading-relaxed">{selectedQuestion.content}</h4>
               
               <div className="grid grid-cols-1 gap-3">
                  {selectedQuestion.options.map((opt, i) => {
                    const isCorrect = i === selectedQuestion.correctAnswer;
                    return (
                      <div 
                        key={i}
                        className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${
                          isCorrect 
                            ? "bg-[#00cec9]/10 border-[#00cec9]/30 text-white" 
                            : "bg-white/[0.02] border-white/5 text-slate-400"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold border ${
                          isCorrect ? "bg-[#00cec9] border-[#00cec9] text-[#0a0a14]" : "bg-black/20 border-white/10"
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="flex-1">{opt}</span>
                        {isCorrect && <CheckCircle2 size={20} className="text-[#00cec9]" />}
                      </div>
                    );
                  })}
               </div>

               {selectedQuestion.explanation && (
                 <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-[#aca3ff] text-[10px] font-bold uppercase tracking-[0.2em]">
                       <Info size={14} />
                       <span>Giải thích đáp án</span>
                    </div>
                    <p className="text-slate-300 text-sm italic leading-relaxed">{selectedQuestion.explanation}</p>
                 </div>
               )}
            </div>

            <div className="p-8 bg-white/[0.02] border-t border-white/5">
                <button 
                  onClick={() => setSelectedQuestion(null)}
                  className="w-full py-4 rounded-2xl bg-white/5 text-slate-400 font-bold hover:bg-white/10 transition-all border border-white/5"
                >
                  Đóng
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
