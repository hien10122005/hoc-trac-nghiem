"use client";

import { useEffect, useState, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from "recharts";
import { Loader2, Target } from "lucide-react";

export default function ProgressRadar() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const statsDoc = await getDoc(doc(db, "user_stats", user.uid));
          if (statsDoc.exists()) {
            setStats(statsDoc.data());
          }
        } catch (err) {
          console.error("Radar fetch error:", err);
        } finally {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const radarData = useMemo(() => {
    if (!stats || !stats.subjectStats) return [];
    
    return Object.entries(stats.subjectStats).map(([id, data]: [string, any]) => {
      const name = data.name || "Môn học";
      const avg = data.totalExams > 0 ? (data.totalScoreSum / data.totalExams) : 0;
      return {
        subject: name.length > 12 ? name.substring(0, 10) + "..." : name,
        full: name,
        value: parseFloat(avg.toFixed(1)),
      };
    }).slice(0, 6); // Top 6 subjects for clarity
  }, [stats]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center rounded-[2rem] bg-[#10101f] border border-white/5">
        <Loader2 className="animate-spin text-[#6c5ce7]" />
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] bg-[#10101f] border border-white/5 p-8 shadow-xl flex flex-col h-full relative overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-[#00cec9]/10 flex items-center justify-center text-[#00cec9]">
          <Target size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white leading-tight">Năng lực bản thân</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Phân tích đa chiều</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center min-h-[300px]">
        {radarData.length >= 3 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
              <PolarGrid stroke="rgba(255,255,255,0.05)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
              <Radar
                name="Điểm"
                dataKey="value"
                stroke="#6c5ce7"
                fill="#6c5ce7"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center space-y-4">
             <p className="text-slate-500 text-xs italic px-6">Bắt đầu thi để thấy bản đồ năng lực của bạn.</p>
             <div className="h-24 w-24 mx-auto rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center">
                <Target className="text-slate-700" size={32} />
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
