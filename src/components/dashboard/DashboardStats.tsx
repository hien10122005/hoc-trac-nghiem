import { motion } from "framer-motion";
import { Zap, Target, Award, Flame } from "lucide-react";
import { useUserStats } from "@/hooks/useUserStats";

export default function DashboardStats() {
  const { totalXP, avgScore, testsCompleted, streak, loading } = useUserStats();

  const stats = [
    { 
      label: "Tổng điểm (XP)", 
      value: totalXP.toLocaleString(), 
      icon: Zap, 
      color: "text-[#6c5ce7]", 
      bg: "bg-[#6c5ce7]/10" 
    },
    { 
      label: "Điểm TB", 
      value: `${avgScore}/10`, 
      icon: Target, 
      color: "text-[#00cec9]", 
      bg: "bg-[#00cec9]/10" 
    },
    { 
      label: "Bà thi đã xong", 
      value: testsCompleted, 
      icon: Award, 
      color: "text-[#fdcb6e]", 
      bg: "bg-[#fdcb6e]/10" 
    },
    { 
      label: "Chuỗi ngày học", 
      value: `${streak} ngày`, 
      icon: Flame, 
      color: "text-[#ff7675]", 
      bg: "bg-[#ff7675]/10" 
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto px-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="group p-5 rounded-[2rem] bg-white/[0.03] border border-white/5 backdrop-blur-xl hover:border-white/10 hover:bg-white/[0.05] transition-all relative overflow-hidden"
        >
          {/* Subtle Glow */}
          <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-10 blur-xl ${stat.bg}`} />
          
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white tracking-tight">{stat.value}</span>
            <div className="h-1 w-8 bg-[#6c5ce7]/30 rounded-full mt-2 group-hover:w-16 transition-all" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
