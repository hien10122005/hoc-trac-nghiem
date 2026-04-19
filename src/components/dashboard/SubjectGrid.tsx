"use client";

import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, Clock, Star, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Subject {
  id: string;
  name: string;
  description?: string;
}

interface SubjectGridProps {
  subjects: Subject[];
  loading: boolean;
  onSelect?: (id: string, name: string) => void;
}

export default function SubjectGrid({ subjects, loading, onSelect }: SubjectGridProps) {

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 rounded-[2rem] bg-white/5 border border-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {subjects.map((item, idx) => {
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: Math.max(0, idx * 0.15), type: "spring", stiffness: 100 }}
            onClick={() => onSelect?.(item.id, item.name)}
            className="group relative p-8 rounded-[2rem] border transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-xl flex flex-col justify-between h-64 hover:scale-[1.05] hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(108,92,231,0.2)] bg-white/[0.03] border-white/5 hover:border-[#6c5ce7]/50 shadow-2xl"
          >
            {/* Glow effect on hover */}
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full blur-[60px] opacity-0 group-hover:opacity-40 transition-opacity bg-[#6c5ce7]" />

            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] text-white flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-lg shadow-[#6c5ce7]/20">
                  <GraduationCap size={28} />
                </div>
                
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  <span>Hệ thống DNC</span>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#6c5ce7] transition-colors">{item.name}</h3>
              <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                {item.description || "Bắt đầu bài thi ôn tập để đánh giá năng lực của bạn ngay hôm nay."}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-[#6c5ce7]" />
                  <span>20:00</span>
                </div>
                <div className="flex items-center gap-1 border-l border-white/10 pl-3">
                  <Star size={14} className="text-amber-400" />
                  <span>Trắc nghiệm</span>
                </div>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6c5ce7] text-white transition-all group-hover:translate-x-1">
                <ArrowRight size={18} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
