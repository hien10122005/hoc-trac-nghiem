"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  CheckCircle2, 
  HelpCircle,
  Trophy
} from "lucide-react";
import { Flashcard } from "@/types/flashcard";

interface FlashcardViewerProps {
  cards: Flashcard[];
  onComplete?: (knownIds: string[]) => void;
}

export default function FlashcardViewer({ cards, onComplete }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<string[]>([]);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [isComplete, setIsComplete] = useState(false);

  if (!cards || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-2xl">
        <HelpCircle size={48} className="mb-4 opacity-20" />
        <p>Bộ thẻ này hiện chưa có nội dung.</p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setDirection(1);
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 50);
    } else {
      setIsComplete(true);
      onComplete?.(knownIds);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex - 1), 50);
    }
  };

  const markAsKnown = () => {
    if (!knownIds.includes(currentCard.id)) {
      setKnownIds([...knownIds, currentCard.id]);
    }
    handleNext();
  };

  const reset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownIds([]);
    setIsComplete(false);
  };

  if (isComplete) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-12 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl text-center"
      >
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 text-emerald-400">
          <Trophy size={40} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Chúc mừng!</h2>
        <p className="text-zinc-400 mb-8">
          Bạn đã hoàn thành bộ thẻ này. <br/>
          Số thẻ đã thuộc: <span className="text-emerald-400 font-bold">{knownIds.length}/{cards.length}</span>
        </p>
        <button 
          onClick={reset}
          className="flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors"
        >
          <RotateCcw size={18} />
          Học lại từ đầu
        </button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8 px-2">
        <div className="flex justify-between text-xs text-zinc-500 mb-2 font-medium tracking-wider uppercase">
          <span>Tiến độ học tập</span>
          <span>{currentIndex + 1} / {cards.length}</span>
        </div>
        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card Container */}
      <div className="relative h-80 perspective-1000 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full h-full"
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              className="w-full h-full relative preserve-3d"
            >
              {/* Front Side */}
              <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
                <span className="absolute top-6 left-6 text-[10px] text-zinc-600 font-bold tracking-widest uppercase">Mặt trước (Khái niệm)</span>
                <p className="text-2xl font-medium text-white text-center leading-relaxed">
                  {currentCard.frontText}
                </p>
                {currentCard.hint && (
                  <p className="mt-4 text-xs text-zinc-500 italic">
                    Gợi ý: {currentCard.hint}
                  </p>
                )}
                <div className="absolute bottom-6 text-[10px] text-zinc-600 animate-pulse">NHẤP ĐỂ LẬT THẺ</div>
              </div>

              {/* Back Side */}
              <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 bg-emerald-950/20 border border-emerald-500/30 rounded-3xl shadow-2xl rotate-y-180">
                <span className="absolute top-6 left-6 text-[10px] text-emerald-500/50 font-bold tracking-widest uppercase">Mặt sau (Giải nghĩa)</span>
                <p className="text-xl text-emerald-50 text-center leading-relaxed">
                  {currentCard.backText}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="mt-10 grid grid-cols-2 gap-4">
        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 transition-all text-zinc-400 group"
        >
          <RotateCcw size={24} className="group-hover:rotate-[-45deg] transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Chưa thuộc</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); markAsKnown(); }}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-500 text-black hover:bg-emerald-400 transition-all font-bold group"
        >
          <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] uppercase tracking-tighter">Đã thuộc bản</span>
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between px-2">
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-2 text-zinc-600 hover:text-white disabled:opacity-0 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-1.5">
          {cards.map((_, i) => (
            <div 
              key={i} 
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-white w-4' : 'bg-zinc-800'}`}
            />
          ))}
        </div>
        <button 
          onClick={handleNext}
          className="p-2 text-zinc-600 hover:text-white transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
