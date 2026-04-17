"use client";

import { motion } from "framer-motion";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from "recharts";
import { BarChart2, Info } from "lucide-react";

interface StatsWidgetProps {
  data: {
    subject: string;
    score: number;
    fullMark: number;
  }[];
  loading?: boolean;
}

export default function StatsWidget({ data, loading }: StatsWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="rounded-[2rem] bg-[#10101f] border border-white/5 p-6 shadow-xl flex flex-col h-full overflow-hidden relative group"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#6c5ce7]/10 flex items-center justify-center text-[#6c5ce7]">
            <BarChart2 size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">Phân tích kỹ năng</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Điểm trung bình theo môn</p>
          </div>
        </div>
        <button className="p-2 rounded-lg hover:bg-white/5 text-slate-500 transition-colors">
          <Info size={16} />
        </button>
      </div>

      <div className="flex-1 min-h-[300px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 border-2 border-[#6c5ce7] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="rgba(255,255,255,0.05)" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 10]} 
                tick={false} 
                axisLine={false}
              />
              <Radar
                name="Điểm số"
                dataKey="score"
                stroke="#6c5ce7"
                fill="#6c5ce7"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <p className="text-slate-500 text-sm">Chưa có dữ liệu bài thi để hiển thị biểu đồ.</p>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] text-slate-500 leading-relaxed italic">
        * Biểu đồ thể hiện năng lực của bạn dựa trên điểm số trung bình của các bài thi gần nhất.
      </div>
    </motion.div>
  );
}
