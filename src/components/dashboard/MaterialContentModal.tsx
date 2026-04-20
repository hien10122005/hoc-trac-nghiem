"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Clock, Maximize2, Edit3, Save, Loader2, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

interface MaterialContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  materialId: string;
}

export default function MaterialContentModal({ isOpen, onClose, title, content, materialId }: MaterialContentModalProps) {
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showNotes, setShowNotes] = useState(false);
  const notesRef = useRef<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auth & Load existing notes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        if (materialId) {
          try {
            const noteDoc = await getDoc(doc(db, "user_stats", authUser.uid, "notes", materialId));
            if (noteDoc.exists()) {
              const val = noteDoc.data().text || "";
              setNotes(val);
              notesRef.current = val;
            }
          } catch (e) {
            console.error("Error loading note:", e);
          }
        }
      }
    });
    return () => unsubscribe();
  }, [materialId, isOpen]);

  // Debounce logic for saving notes
  useEffect(() => {
    if (!isOpen || !user || !materialId) return;
    if (notes === notesRef.current) return; // No change

    setSaveStatus('saving');
    
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const notePath = doc(db, "user_stats", user.uid, "notes", materialId);
        await setDoc(notePath, {
          text: notes,
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        notesRef.current = notes;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        console.error("Error saving note:", e);
        setSaveStatus('idle');
      }
    }, 1500); // 1.5s debounce

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notes, user, materialId, isOpen]);

  // Ước tính thời gian đọc (giả sử 200 từ/phút)
  const wordCount = content?.split(/\s+/).length || 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-10">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0a0a14]/90 backdrop-blur-xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl max-h-[90vh] rounded-[2rem] bg-[#10101f] border border-white/10 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white line-clamp-1">{title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-widest">
                       <Clock size={12} />
                       <span>{readingTime} phút đọc</span>
                    </div>
                    <span className="h-1 w-1 rounded-full bg-slate-700" />
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest bg-emerald-500/5 px-2 py-0.5 rounded">Bản đọc trực tiếp</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowNotes(!showNotes)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all font-bold text-sm ${
                    showNotes 
                      ? "bg-[#6c5ce7] text-white shadow-lg shadow-[#6c5ce7]/20" 
                      : "bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  <Edit3 size={18} />
                  <span>{showNotes ? "Đóng Ghi chú" : "Ghi chú"}</span>
                </button>

                <button 
                  onClick={onClose}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all group"
                >
                  <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>
            </div>

            {/* Main Content Area Split */}
            <div className="flex-1 flex overflow-hidden">
              {/* Reading Content */}
              <div className={`flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar bg-[#0f0f1a] transition-all duration-500 ${showNotes ? "hidden md:block" : "block"}`}>
                <article className="prose prose-invert prose-emerald max-w-none 
                  prose-headings:text-white prose-headings:font-bold 
                  prose-p:text-slate-300 prose-p:leading-relaxed 
                  prose-strong:text-emerald-400 prose-strong:font-bold
                  prose-code:text-[#00cec9] prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-2xl
                  prose-li:text-slate-400
                  prose-blockquote:border-l-emerald-500 prose-blockquote:bg-emerald-500/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl prose-blockquote:italic
                  prose-img:rounded-3xl prose-img:shadow-2xl prose-img:border prose-img:border-white/10"
                >
                  <ReactMarkdown>{content}</ReactMarkdown>
                </article>

                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center">
                   <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-4">
                      <Maximize2 size={20} />
                   </div>
                   <p className="text-xs text-slate-600 font-bold uppercase tracking-[0.2em]">Hết nội dung bài học</p>
                   <button 
                      onClick={onClose}
                      className="mt-6 px-10 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/10 hover:text-white transition-all shadow-xl"
                   >
                      Xong, quay về thư viện
                   </button>
                </div>
              </div>

              {/* Notes Panel */}
              <AnimatePresence>
                {showNotes && (
                  <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    className="w-full md:w-80 lg:w-96 border-l border-white/5 bg-[#0a0a14] flex flex-col shrink-0"
                  >
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Edit3 size={16} className="text-[#6c5ce7]" />
                          <h4 className="text-sm font-bold uppercase tracking-widest text-[#aca3ff]">Ghi chú cá nhân</h4>
                       </div>
                       
                       <div className="flex items-center gap-2">
                          {saveStatus === 'saving' && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 uppercase tracking-tighter italic">
                               <Loader2 size={10} className="animate-spin" />
                               <span>Đang lưu...</span>
                            </div>
                          )}
                          {saveStatus === 'saved' && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">
                               <CheckCircle2 size={10} />
                               <span>Đã lưu</span>
                            </div>
                          )}
                       </div>
                    </div>
                    
                    <textarea 
                      className="flex-1 bg-transparent p-6 text-sm text-slate-300 outline-none resize-none placeholder:text-slate-600 leading-relaxed font-manrope"
                      placeholder="Ghi chú lại những kiến thức hay bạn vừa đọc được... (Hệ thống sẽ tự động lưu)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    
                    <div className="p-4 bg-white/[0.02] border-t border-white/5">
                        <p className="text-[10px] text-slate-600 leading-tight">
                           Ghi chú này là của riêng bạn và sẽ được bảo mật trong kho lưu trữ cá nhân.
                        </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Progress Indicator (Pseudo) */}
            <div className="h-1 w-full bg-white/5">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-[#00cec9] w-[15%] rounded-r-full shadow-[0_0_10px_#10b981]" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Global CSS for scrollbar if not exists */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </AnimatePresence>
  );
}
