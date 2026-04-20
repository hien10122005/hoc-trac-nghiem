"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Sparkles, 
  BookOpen, 
  Loader2, 
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { useFlashcards } from "@/hooks/useFlashcards";
import FlashcardViewer from "@/components/FlashcardViewer";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function FlashcardStudyPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;
  const { deck, loading, error } = useFlashcards(subjectId);
  const [subjectName, setSubjectName] = useState("");

  useEffect(() => {
    async function fetchSubject() {
      if (!subjectId) return;
      try {
        const snap = await getDoc(doc(db, "subjects", subjectId));
        if (snap.exists()) {
          setSubjectName(snap.data().name);
        }
      } catch (err) {
        console.error("Error fetching subject name:", err);
      }
    }
    fetchSubject();
  }, [subjectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
        <p className="text-zinc-500 font-medium tracking-widest uppercase text-[10px]">Đang chuẩn bị bộ thẻ học...</p>
      </div>
    );
  }

  if (error || (!deck && !loading)) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 text-zinc-700">
          <HelpCircle size={40} />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Chưa có bộ thẻ cho môn này</h1>
        <p className="text-zinc-500 max-w-xs mb-8">
          Hệ thống AI đang soạn thảo bộ thẻ cho môn {subjectName}. Vui lòng quay lại sau!
        </p>
        <button 
          onClick={() => router.back()}
          className="px-6 py-2 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
        >
          Quay lại Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden flex flex-col">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Nav */}
      <nav className="relative z-10 px-6 py-8 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-amber-500 mb-1">
            <Sparkles size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">FlashLearn AI</span>
          </div>
          <h1 className="text-lg font-bold text-white">{deck?.title}</h1>
        </div>

        <div className="w-10 h-10 opacity-0" /> {/* Spacer */}
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Side: Info (Desktop only) */}
          <div className="hidden lg:flex lg:col-span-4 flex-col gap-6">
            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl backdrop-blur-xl">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-4">
                <BookOpen size={24} />
              </div>
              <h3 className="text-white font-bold mb-2">Chế độ Học nhanh</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Hệ thống đã chiết xuất 10 khái niệm quan trọng nhất của môn **{subjectName}** để bạn ôn tập chớp nhoáng.
              </p>
            </div>

            <div className="p-6 bg-emerald-500/[0.03] border border-emerald-500/5 rounded-3xl backdrop-blur-xl">
              <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase mb-4">
                <AlertCircle size={14} />
                <span>Mẹo ghi nhớ</span>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed italic">
                "Hãy đọc câu hỏi ở mặt trước, tự trả lời trong đầu rồi mới lật thẻ để kiểm tra kết quả."
              </p>
            </div>
          </div>

          {/* Right Side: Card Viewer */}
          <div className="lg:col-span-8 w-full">
            <FlashcardViewer 
              cards={deck?.cards || []} 
              onComplete={(knownIds) => {
                console.log("Completed learning. Known cards:", knownIds.length);
              }}
            />
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 p-8 flex justify-center opacity-30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg" />
          <span className="text-xs font-bold text-white tracking-widest uppercase">QIU CORE ENGINE</span>
        </div>
      </footer>
    </div>
  );
}
