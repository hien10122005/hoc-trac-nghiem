"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Save, 
  BookOpen, 
  Layout, 
  Search,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp,
  query,
  where
} from "firebase/firestore";
import { Flashcard, FlashcardDeck } from "@/types/flashcard";
import toast from "react-hot-toast";

interface Subject {
  id: string;
  name: string;
}

export default function AdminFlashcards() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [deckTitle, setDeckTitle] = useState("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [material, setMaterial] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load subjects
  useEffect(() => {
    async function fetchSubjects() {
      setIsLoading(true);
      try {
        const snap = await getDocs(collection(db, "subjects"));
        const list = snap.docs.map(d => ({ id: d.id, name: d.data().name }));
        setSubjects(list);
      } catch (err) {
        toast.error("Không thể tải danh sách môn học.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchSubjects();
  }, []);

  // Load existing deck when subject changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setCards([]);
      setDeckTitle("");
      return;
    }

    async function fetchDeck() {
      setIsLoading(true);
      try {
        const q = query(collection(db, "flashcard_decks"), where("subjectId", "==", selectedSubjectId));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const data = snap.docs[0].data() as FlashcardDeck;
          setCards(data.cards || []);
          setDeckTitle(data.title || "");
        } else {
          setCards([]);
          const subject = subjects.find(s => s.id === selectedSubjectId);
          setDeckTitle(subject ? `Flashcard: ${subject.name}` : "");
        }
      } catch (err) {
        toast.error("Lỗi khi tải bộ thẻ cũ.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchDeck();
  }, [selectedSubjectId, subjects]);

  const addCard = () => {
    const newCard: Flashcard = {
      id: `manual_${Date.now()}`,
      frontText: "",
      backText: "",
      hint: ""
    };
    setCards([...cards, newCard]);
  };

  const removeCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
  };

  const updateCard = (id: string, field: keyof Flashcard, value: string) => {
    setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const generateWithAI = async () => {
    if (!material || material.length < 50) {
      toast.error("Vui lòng dán nội dung kiến thức dài hơn (ít nhất 50 ký tự).");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-flashcards", {
        method: "POST",
        body: JSON.stringify({ material }),
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Trộn thêm vào danh sách hiện tại
      setCards([...cards, ...data.cards]);
      toast.success(`Đã sinh thêm ${data.cards.length} thẻ học mới!`);
      setMaterial(""); // Clear material after success
    } catch (err: any) {
      toast.error(err.message || "Lỗi AI không xác định.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveDeck = async () => {
    if (!selectedSubjectId || !deckTitle) {
      toast.error("Vui lòng chọn môn học và nhập tên bộ thẻ.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Lưu Deck
      const deckId = selectedSubjectId; // Dùng subjectId làm ID deck để dễ truy vấn 1-Read
      const deckRef = doc(db, "flashcard_decks", deckId);
      
      await setDoc(deckRef, {
        subjectId: selectedSubjectId,
        title: deckTitle,
        cards: cards,
        updatedAt: serverTimestamp(),
        authorId: "admin"
      }, { merge: true });

      // 2. Cập nhật System Metadata để thông báo Student sync
      await setDoc(doc(db, "system_metadata", "flashcards"), {
        lastUpdated: serverTimestamp()
      }, { merge: true });

      toast.success("Đã đồng bộ bộ thẻ học lên hệ thống!");
    } catch (err) {
      toast.error("Lỗi khi lưu dữ liệu.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Layout className="text-emerald-500" />
            FlashLearn Manager
          </h1>
          <p className="text-zinc-500 mt-1">Thiết kế và AI-Distill bộ thẻ học thông minh (Mô hình 1-Read)</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            <option value="">-- Chọn Môn học --</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          
          <button 
            onClick={saveDeck}
            disabled={isSaving || !selectedSubjectId}
            className="bg-emerald-500 text-black font-bold px-6 py-2.5 rounded-xl hover:bg-emerald-400 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Đồng bộ Cloud
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: AI Distillation */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Sparkles className="text-amber-400" size={20} />
              QIU AI Distiller
            </h2>
            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
              Dán nội dung kiến thức (văn bản, ghi chú) vào đây. AI sẽ tự động chiết xuất thành 10 thẻ ghi nhớ chất lượng cao.
            </p>
            <textarea 
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Dán nội dung bài học tại đây..."
              className="w-full h-64 bg-black border border-zinc-800 rounded-xl p-4 text-sm outline-none focus:border-amber-400 transition-colors resize-none mb-4"
            />
            <button 
              onClick={generateWithAI}
              disabled={isGenerating || !selectedSubjectId}
              className="w-full bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              Sinh 10 thẻ bằng AI
            </button>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6">
            <h3 className="text-emerald-500 text-sm font-bold flex items-center gap-2 mb-2">
              <CheckCircle size={16} />
              Mẹo tối ưu:
            </h3>
            <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside">
              <li>Mỗi môn học chỉ nên có 1 bộ thẻ tổng hợp.</li>
              <li>Đặt câu hỏi ở mặt trước ngắn gọn (dưới 15 từ).</li>
              <li>Dùng giải thích ở mặt sau súc tích để ghi nhớ lâu.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Card Editor */}
        <div className="lg:col-span-2">
          {!selectedSubjectId ? (
            <div className="bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-2xl p-20 flex flex-col items-center justify-center text-zinc-600">
              <Layout size={64} className="mb-4 opacity-10" />
              <p className="font-medium">Vui lòng chọn một môn học để bắt đầu</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 mb-6">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Tiêu đề Bộ thẻ</label>
                <input 
                  type="text" 
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  placeholder="Ví dụ: Flashcard Sinh học 12 - Chương 1"
                  className="w-full bg-transparent text-xl font-bold outline-none text-white border-b border-zinc-800 pb-2 focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-zinc-300">Danh sách thẻ ({cards.length})</h2>
                <button 
                  onClick={addCard}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 text-sm bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 transition-all"
                >
                  <Plus size={16} /> Thêm thẻ thủ công
                </button>
              </div>

              {cards.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 italic">Chưa có thẻ nào. Hãy dùng AI hoặc thêm thủ công.</div>
              ) : (
                <div className="space-y-4">
                  {cards.map((card, index) => (
                    <div key={card.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors relative group">
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-500 border border-zinc-700">
                        {index + 1}
                      </div>
                      
                      <button 
                        onClick={() => removeCard(card.id)}
                        className="absolute -right-2 -top-2 w-8 h-8 bg-black border border-zinc-800 rounded-full flex items-center justify-center text-zinc-500 hover:text-red-500 hover:border-red-500/30 opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                      >
                        <Trash2 size={14} />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase mb-1 block">Mặt trước (Khái niệm)</label>
                          <textarea 
                            value={card.frontText}
                            onChange={(e) => updateCard(card.id, "frontText", e.target.value)}
                            className="bg-black/50 w-full rounded-lg border border-zinc-800 p-2 text-sm focus:border-zinc-500 outline-none h-20 resize-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase mb-1 block">Mặt sau (Giải nghĩa)</label>
                          <textarea 
                            value={card.backText}
                            onChange={(e) => updateCard(card.id, "backText", e.target.value)}
                            className="bg-black/50 w-full rounded-lg border border-zinc-800 p-2 text-sm focus:border-zinc-500 outline-none h-20 resize-none"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase mb-1 block flex items-center gap-1">
                          <AlertCircle size={10} /> Mẹo nhớ nhanh (Hint)
                        </label>
                        <input 
                          type="text" 
                          value={card.hint || ""}
                          onChange={(e) => updateCard(card.id, "hint", e.target.value)}
                          className="bg-black/50 w-full rounded-lg border border-zinc-800 p-2 text-xs focus:border-zinc-500 outline-none"
                          placeholder="Ví dụ: Dùng mẹo ABC để nhớ..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
