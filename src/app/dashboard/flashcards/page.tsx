"use client";

import { useEffect, useState } from "react";
import { auth, db, getCachedDocs } from "@/lib/firebase";
import { collection, collectionGroup, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// ... (RotateCcw, etc imports unchanged)
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Loader2,
  BookOpen,
  Eye,
  EyeOff,
  CheckCircle2,
  Layers,
} from "lucide-react";

interface Flashcard {
  id: string;
  content: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  subjectName: string;
}

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mastered, setMastered] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("flashcard_mastered");
      try {
        return saved ? new Set(JSON.parse(saved)) : new Set();
      } catch {
        return new Set();
      }
    }
    return new Set();
  });
  const [showMastered, setShowMastered] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 1. Lấy tất cả subjects để map ID -> Name (Tiết kiệm lượt đọc bằng getCachedDocs)
          const subSnap = await getCachedDocs(collection(db, "subjects"));
          const subjectMap: Record<string, string> = {};
          subSnap.docs.forEach(doc => {
            subjectMap[doc.id] = doc.data().name;
          });

          // 2. Dùng collectionGroup để lấy TẤT CẢ câu hỏi trong 1 lần truy vấn duy nhất
          // Thay vì lặp qua từng môn học (N+1 Query)
          const qSnap = await getCachedDocs(collectionGroup(db, "questions"));
          
          const allCards: Flashcard[] = qSnap.docs.map((qDoc) => {
            const d = qDoc.data();
            // Lấy ID môn học từ path: subjects/{subjectId}/questions/{questionId}
            const subjectId = qDoc.ref.parent.parent?.id || "";
            
            return {
              id: qDoc.id,
              content: d.content,
              options: d.options,
              correctAnswer: d.correctAnswer,
              explanation: d.explanation || "",
              subjectName: subjectMap[subjectId] || "Môn học",
            };
          });

          // Trộn ngẫu nhiên
          allCards.sort(() => Math.random() - 0.5);
          setCards(allCards);
        } catch (err) {
          console.error("Flashcards error:", err);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);



  const saveMastered = (newSet: Set<string>) => {
    setMastered(newSet);
    localStorage.setItem("flashcard_mastered", JSON.stringify([...newSet]));
  };

  const visibleCards = showMastered ? cards : cards.filter((c) => !mastered.has(c.id));
  const currentCard = visibleCards[currentIdx];

  const handleNext = () => {
    setFlipped(false);
    setTimeout(() => setCurrentIdx((p) => (p + 1) % visibleCards.length), 150);
  };

  const handlePrev = () => {
    setFlipped(false);
    setTimeout(() => setCurrentIdx((p) => (p - 1 + visibleCards.length) % visibleCards.length), 150);
  };

  const handleShuffle = () => {
    setFlipped(false);
    setCards([...cards].sort(() => Math.random() - 0.5));
    setCurrentIdx(0);
  };

  const toggleMastered = (id: string) => {
    const newSet = new Set(mastered);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    saveMastered(newSet);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="animate-spin text-[#6c5ce7]" size={40} />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-40 space-y-6">
        <div className="mx-auto h-24 w-24 rounded-3xl bg-[#6c5ce7]/10 flex items-center justify-center">
          <Layers size={48} className="text-[#6c5ce7]" />
        </div>
        <h2 className="text-2xl font-bold text-white">Chưa có thẻ ghi nhớ</h2>
        <p className="text-slate-400">Hệ thống cần có câu hỏi để tạo flashcard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Layers className="text-[#6c5ce7]" size={32} />
            Thẻ ghi nhớ
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Nhấn vào thẻ để xem đáp án • {visibleCards.length} thẻ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMastered(!showMastered)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            {showMastered ? <Eye size={14} /> : <EyeOff size={14} />}
            {showMastered ? "Ẩn đã thuộc" : "Hiện tất cả"}
          </button>
          <button
            onClick={handleShuffle}
            className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white transition-colors"
            title="Trộn ngẫu nhiên"
          >
            <Shuffle size={18} />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] rounded-full transition-all duration-500"
            style={{ width: `${((currentIdx + 1) / visibleCards.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 font-mono shrink-0">
          {currentIdx + 1}/{visibleCards.length}
        </span>
        <span className="text-xs text-green-400 font-bold shrink-0">
          ✓ {mastered.size} thuộc
        </span>
      </div>

      {/* Flashcard */}
      {currentCard && (
        <div className="perspective-1000">
          <div
            onClick={() => setFlipped(!flipped)}
            className="relative w-full min-h-[380px] cursor-pointer group"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front */}
            <div
              className={`absolute inset-0 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c0e17] to-[#13152a] p-8 flex flex-col justify-between backface-hidden transition-transform duration-500 ${
                flipped ? "[transform:rotateY(180deg)]" : ""
              }`}
              style={{ backfaceVisibility: "hidden" }}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 rounded-lg bg-[#6c5ce7]/10 text-[#6c5ce7] text-xs font-bold">
                    {currentCard.subjectName}
                  </span>
                  <span className="text-xs text-slate-500">Nhấn để lật</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                  {currentCard.content}
                </p>
              </div>
              <div className="space-y-2 pt-4">
                {currentCard.options.map((opt, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-slate-300"
                  >
                    <span className="h-7 w-7 shrink-0 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-slate-500">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </div>
                ))}
              </div>
            </div>

            {/* Back */}
            <div
              className={`absolute inset-0 rounded-3xl border border-[#00cec9]/20 bg-gradient-to-br from-[#0c1a1a] to-[#0c0e17] p-8 flex flex-col justify-between backface-hidden transition-transform duration-500 ${
                flipped ? "" : "[transform:rotateY(-180deg)]"
              }`}
              style={{ backfaceVisibility: "hidden" }}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 rounded-lg bg-[#00cec9]/10 text-[#00cec9] text-xs font-bold uppercase tracking-wider">
                    Đáp án
                  </span>
                  <span className="text-xs text-slate-500">Nhấn để lật lại</span>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-[#00cec9]/10 border border-[#00cec9]/20 flex items-center justify-center text-2xl font-bold text-[#00cec9]">
                    {String.fromCharCode(65 + currentCard.correctAnswer)}
                  </div>
                  <p className="text-lg font-bold text-white">
                    {currentCard.options[currentCard.correctAnswer]}
                  </p>
                </div>
                {currentCard.explanation && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <p className="text-sm text-slate-300 italic leading-relaxed">{currentCard.explanation}</p>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMastered(currentCard.id);
                }}
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold transition-all ${
                  mastered.has(currentCard.id)
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-white/5 text-slate-400 border border-white/10 hover:bg-[#00cec9]/10 hover:text-[#00cec9]"
                }`}
              >
                <CheckCircle2 size={18} />
                {mastered.has(currentCard.id) ? "Đã thuộc ✓" : "Đánh dấu đã thuộc"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handlePrev}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/10 bg-white/[0.03] text-white font-bold text-sm hover:bg-white/[0.06] transition-colors"
        >
          <ChevronLeft size={18} />
          Trước
        </button>
        <button
          onClick={() => setFlipped(!flipped)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#6c5ce7] text-white font-bold text-sm shadow-lg shadow-[#6c5ce7]/20 hover:scale-105 active:scale-95 transition-all"
        >
          <RotateCcw size={18} />
          Lật thẻ
        </button>
        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/10 bg-white/[0.03] text-white font-bold text-sm hover:bg-white/[0.06] transition-colors"
        >
          Sau
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
