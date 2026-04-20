"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface LeaderboardEntry {
  userId: string;
  userEmail: string;
  totalScore: number;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const snap = await getDoc(doc(db, "system_data", "leaderboard_snapshot"));
        if (snap.exists()) {
          setEntries(snap.data().entries || []);
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="rounded-[2rem] bg-[#10101f] border border-white/5 p-8 shadow-xl flex flex-col h-full relative overflow-hidden"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
          <Trophy size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white leading-tight">Bảng xếp hạng</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Top 10 học viên thực thụ</p>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {loading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
          ))
        ) : entries.length > 0 ? (
          entries.map((entry, idx) => {
            const isTop3 = idx < 3;
            const medalColors = ["text-yellow-400", "text-slate-300", "text-orange-400"];
            
            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all group"
              >
                <div className="flex-shrink-0 flex items-center justify-center w-8">
                  {isTop3 ? (
                    <Medal className={medalColors[idx]} size={24} />
                  ) : (
                    <span className="text-sm font-bold text-slate-500">{idx + 1}</span>
                  )}
                </div>

                <div className="h-10 w-10 rounded-full bg-[#1a1a2e] border border-white/10 flex items-center justify-center overflow-hidden">
                   <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#6c5ce7]/20 to-[#00cec9]/20 text-slate-400">
                    <User size={18} />
                   </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate group-hover:text-[#aca3ff] transition-colors">
                    {entry.userEmail.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">Học tiến sĩ</div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-white">{entry.totalScore.toLocaleString()}</div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Điểm</p>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-500 text-sm italic">Chưa có bảng xếp hạng.</p>
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-white/5">
        <button className="w-full py-3 rounded-2xl bg-white/5 border border-white/5 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:bg-[#6c5ce7] hover:text-white transition-all">
          Xem tất cả thứ hạng
        </button>
      </div>
    </motion.div>
  );
}
