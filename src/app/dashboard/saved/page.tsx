"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Bookmark, 
  Trash2, 
  Search, 
  HelpCircle,
  Loader2,
  BookOpen,
  ArrowLeft,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  MoreVertical
} from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { SavedQuestion } from "@/types/user";

// --- Types for Grouping ---
interface GroupedTopic {
  id: string;
  name: string;
  questions: SavedQuestion[];
}

interface GroupedSubject {
  id: string;
  name: string;
  count: number;
  topics: GroupedTopic[];
}

interface QuestionDetail {
  id: string;
  content: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// --- Mock Data ---
const MOCK_SAVED_QUESTIONS: SavedQuestion[] = [
  {
    subjectId: "subject-math",
    questionId: "q1",
    content: "Đạo hàm của hàm số y = sinx là?",
    savedAt: new Date().toISOString(),
    topicId: "topic-calculus",
    topicName: "Giải tích 12"
  },
  {
    subjectId: "subject-math",
    questionId: "q2",
    content: "Nguyên hàm của hàm số f(x) = e^x là?",
    savedAt: new Date().toISOString(),
    topicId: "topic-calculus",
    topicName: "Giải tích 12"
  },
  {
    subjectId: "subject-math",
    questionId: "q3",
    content: "Tính thể tích khối chóp có diện tích đáy B và chiều cao h.",
    savedAt: new Date().toISOString(),
    topicId: "topic-geometry",
    topicName: "Hình học không gian"
  },
  {
    subjectId: "subject-it",
    questionId: "q4",
    content: "Giao thức nào sau đây thuộc tầng Transport?",
    savedAt: new Date().toISOString(),
    topicId: "topic-network",
    topicName: "Mạng máy tính"
  },
  {
    subjectId: "subject-it",
    questionId: "q5",
    content: "Địa chỉ IP Version 4 có độ dài bao nhiêu bit?",
    savedAt: new Date().toISOString(),
    topicId: "topic-network",
    topicName: "Mạng máy tính"
  },
  {
     subjectId: "subject-it",
     questionId: "q6",
     content: "Câu hỏi chưa phân loại về cơ sở dữ liệu.",
     savedAt: new Date().toISOString()
  }
];

export default function SavedQuestionsPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [savedList, setSavedList] = useState<SavedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionDetail | null>(null);
  const [subjectsData, setSubjectsData] = useState<Record<string, string>>({});
  
  // UI States
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        // FETCHING REAL DATA
        // await fetchSavedQuestions(authUser.uid);
        
        // FOR MOCK REVIEW:
        setTimeout(() => {
           setSavedList(MOCK_SAVED_QUESTIONS);
           setSubjectsData({
             "subject-math": "Toán Học Cao Cấp",
             "subject-it": "Cấu trúc dữ liệu & Giải thuật"
           });
           setLoading(false);
        }, 1000);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Logic: Grouping ---
  const groupedData = useMemo(() => {
    const filtered = savedList.filter(q => 
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subjectsData[q.subjectId] || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.topicName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const subjectMap: Record<string, GroupedSubject> = {};

    filtered.forEach(q => {
      if (!subjectMap[q.subjectId]) {
        subjectMap[q.subjectId] = {
          id: q.subjectId,
          name: subjectsData[q.subjectId] || "Môn học chưa biết",
          count: 0,
          topics: []
        };
      }

      const subject = subjectMap[q.subjectId];
      subject.count++;

      const topicId = q.topicId || "uncategorized";
      const topicName = q.topicName || "Chưa phân loại";

      let topic = subject.topics.find(t => t.id === topicId);
      if (!topic) {
        topic = { id: topicId, name: topicName, questions: [] };
        subject.topics.push(topic);
      }
      topic.questions.push(q);
    });

    return Object.values(subjectMap);
  }, [savedList, subjectsData, searchQuery]);

  // --- Search: Auto-expand logic ---
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const newExpSubjects = new Set<string>();
      const newExpTopics = new Set<string>();

      groupedData.forEach(sub => {
        newExpSubjects.add(sub.id);
        sub.topics.forEach(top => {
           newExpTopics.add(`${sub.id}-${top.id}`);
        });
      });

      setExpandedSubjects(newExpSubjects);
      setExpandedTopics(newExpTopics);
    }
  }, [searchQuery, groupedData]);

  const toggleSubject = (sId: string) => {
    setExpandedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(sId)) next.delete(sId);
      else next.add(sId);
      return next;
    });
  };

  const toggleTopic = (sId: string, tId: string) => {
    const key = `${sId}-${tId}`;
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleReviewSubject = (subject: GroupedSubject) => {
    toast.success(`Bắt đầu bài Test với ${subject.count} câu hỏi môn ${subject.name}`, {
      icon: "🚀",
      style: { borderRadius: "12px", background: "#10101f", color: "#fff", border: "1px solid rgba(108, 92, 231, 0.2)" }
    });
  };

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
      } else {
         // Fallback for Mock
         toast.error("Dữ liệu thật không tồn tại (Bạn đang xem Mock Data)", { id: toastId });
      }
    } catch (error) {
       toast.error("Lỗi khi tải chi tiết.", { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#6c5ce7]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase font-outfit">
             Kho lưu trữ <span className="bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] bg-clip-text text-transparent">Cá nhân</span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium italic">Tổ chức kiến thức theo môn học và chuyên đề.</p>
        </div>
      </div>

      <div className="relative md:max-w-md">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input 
          type="text" 
          placeholder="Tìm kiếm câu hỏi, môn hoặc phần học..."
          className="w-full rounded-2xl border border-white/5 bg-[#10101f] py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-[#6c5ce7]/50 focus:ring-4 focus:ring-[#6c5ce7]/5 transition-all shadow-xl"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {groupedData.length > 0 ? (
        <div className="space-y-6">
          {groupedData.map((subject) => (
            <motion.div 
              layout
              key={subject.id}
              className="rounded-[2.5rem] bg-[#10101f] border border-white/5 overflow-hidden shadow-2xl"
            >
              {/* --- Subject Header --- */}
              <div 
                className="flex items-center justify-between p-6 md:p-8 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => toggleSubject(subject.id)}
              >
                <div className="flex items-center gap-6">
                   <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-white shadow-lg shadow-[#6c5ce7]/20">
                      <BookOpen size={28} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-white tracking-tight">{subject.name}</h3>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">{subject.count} câu hỏi đã lưu</p>
                   </div>
                </div>
                
                <div className="flex items-center gap-4">
                   <button 
                    onClick={(e) => { e.stopPropagation(); handleReviewSubject(subject); }}
                    className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#00cec9]/10 border border-[#00cec9]/20 text-[#00cec9] text-xs font-black hover:bg-[#00cec9] hover:text-black transition-all shadow-lg"
                   >
                     <PlayCircle size={16} />
                     <span>ÔN TẬP NGAY</span>
                   </button>
                   <div className={`p-3 rounded-2xl bg-white/5 text-slate-400 transition-transform duration-300 ${expandedSubjects.has(subject.id) ? "rotate-180" : ""}`}>
                      <ChevronDown size={20} />
                   </div>
                </div>
              </div>

              {/* --- Topics (Collapsible Content) --- */}
              <AnimatePresence>
                {expandedSubjects.has(subject.id) && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 md:px-8 md:pb-8 space-y-4">
                      {subject.topics.map((topic) => (
                        <div key={topic.id} className="rounded-3xl bg-black/20 border border-white/5 overflow-hidden">
                           <div 
                              className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                              onClick={() => toggleTopic(subject.id, topic.id)}
                           >
                              <div className="flex items-center gap-3">
                                <div className={`h-2 w-2 rounded-full ${topic.id === "uncategorized" ? "bg-slate-700" : "bg-[#00cec9]"}`} />
                                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">{topic.name}</h4>
                                <span className="text-[10px] font-black text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{topic.questions.length}</span>
                              </div>
                              <ChevronRight size={18} className={`text-slate-600 transition-transform duration-300 ${expandedTopics.has(`${subject.id}-${topic.id}`) ? "rotate-90" : ""}`} />
                           </div>

                           <AnimatePresence>
                             {expandedTopics.has(`${subject.id}-${topic.id}`) && (
                               <motion.div
                                 initial={{ height: 0, opacity: 0 }}
                                 animate={{ height: "auto", opacity: 1 }}
                                 exit={{ height: 0, opacity: 0 }}
                                 className="overflow-hidden bg-black/10"
                               >
                                 <div className="p-4 space-y-3">
                                   {topic.questions.map((q) => (
                                     <div 
                                      key={q.questionId}
                                      className="group flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-[#6c5ce7]/30 transition-all"
                                     >
                                        <div className="flex-1 cursor-pointer" onClick={() => viewQuestionDetail(q)}>
                                           <div className="flex items-center gap-2 mb-1">
                                              <span className="text-[10px] text-slate-500">{new Date(q.savedAt).toLocaleDateString()}</span>
                                           </div>
                                           <h5 className="text-sm font-bold text-white leading-relaxed line-clamp-1 group-hover:text-[#aca3ff] transition-colors">{q.content}</h5>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button 
                                            onClick={() => viewQuestionDetail(q)}
                                            className="p-2 rounded-xl text-slate-500 hover:text-white transition-colors"
                                          >
                                            <Bookmark size={16} fill="currentColor" className="text-[#6c5ce7]" />
                                          </button>
                                          <button 
                                            onClick={() => removeBookmark(q.questionId)}
                                            className="p-2 rounded-xl text-slate-600 hover:text-red-400 transition-colors"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </div>
                                     </div>
                                   ))}
                                 </div>
                               </motion.div>
                             )}
                           </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[400px] rounded-[3rem] border-2 border-dashed border-white/5 bg-[#10101f]/30">
          <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <HelpCircle size={40} className="text-slate-700" />
          </div>
          <h3 className="text-xl font-bold text-white font-outfit uppercase tracking-wider">Trống rỗng</h3>
          <p className="text-slate-500 mt-2 text-center max-w-sm px-6 font-medium">
            Những nội dung bạn tìm kiếm hoặc lưu trữ sẽ xuất hiện tại đây.
          </p>
          <Link href="/dashboard" className="mt-8 px-8 py-3 rounded-2xl bg-[#6c5ce7] text-white font-black transition-all shadow-xl shadow-[#6c5ce7]/20 hover:scale-105 active:scale-95">
             KHÁM PHÁ THƯ VIỆN
          </Link>
        </div>
      )}

      {/* Question Detail Modal (Reused) */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a14]/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl rounded-[3rem] bg-[#10101f] border border-white/10 shadow-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <PlayCircle className="text-[#6c5ce7]" size={28} />
                  <h3 className="text-xl font-black text-white font-outfit uppercase">Chi tiết ôn tập</h3>
               </div>
               <button onClick={() => setSelectedQuestion(null)} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400">
                  <ArrowLeft size={20} />
               </button>
            </div>
            
            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
               <h4 className="text-xl font-bold leading-relaxed text-white">{selectedQuestion.content}</h4>
               
               <div className="grid grid-cols-1 gap-4">
                  {selectedQuestion.options.map((opt, i) => {
                    const isCorrect = i === selectedQuestion.correctAnswer;
                    return (
                      <div 
                        key={i}
                        className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${
                          isCorrect 
                            ? "bg-[#00cec9]/10 border-[#00cec9]/30 text-white" 
                            : "bg-white/[0.02] border-white/5 text-slate-400 shadow-inner"
                        }`}
                      >
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black border ${
                          isCorrect ? "bg-[#00cec9] border-[#00cec9] text-[#0a0a14]" : "bg-black/20 border-white/10 text-slate-500"
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="flex-1 font-bold">{opt}</span>
                        {isCorrect && <CheckCircle2 size={24} className="text-[#00cec9]" />}
                      </div>
                    );
                  })}
               </div>

               {selectedQuestion.explanation && (
                 <div className="p-6 rounded-3xl bg-[#6c5ce7]/5 border border-[#6c5ce7]/20 space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                       <Info size={100} />
                    </div>
                    <div className="flex items-center gap-2 text-[#aca3ff] text-[10px] font-black uppercase tracking-[0.2em]">
                       <Sparkles size={14} />
                       <span>Phân tích đáp án</span>
                    </div>
                    <p className="text-slate-300 text-sm italic leading-relaxed relative z-10">{selectedQuestion.explanation}</p>
                 </div>
               )}
            </div>

            <div className="p-8 bg-white/[0.02] border-t border-white/5">
                <button 
                  onClick={() => setSelectedQuestion(null)}
                  className="w-full py-4 rounded-2xl bg-white/5 text-slate-400 font-black hover:bg-white/10 transition-all border border-white/5 uppercase tracking-widest text-xs"
                >
                  Đóng cửa sổ
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Style for scrollbar and fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(108, 92, 231, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}

// Add missing icon
function Sparkles({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
