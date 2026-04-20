"use client";

import { useEffect, useState, useMemo } from "react";
import { auth, db, getCachedDocs } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { QuizResultData } from "@/types/quiz";
import { SubjectStats } from "@/types/user";
import {
  BarChart3,
  TrendingUp,
  Target,
  Award,
  Clock,
  BookOpen,
  Flame,
  Loader2,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
} from "recharts";

interface AggregatedStats {
  totalExams: number;
  totalScoreSum: number;
  bestScore: number;
  totalCorrect: number;
  totalQuestions: number;
  streak: number;
  subjectStats: Record<string, SubjectStats>;
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

// ─── Custom Tooltip ─────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0c0e17]/95 backdrop-blur-md px-4 py-3 shadow-xl">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        {payload.map((entry, i: number) => (
          <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
            {entry.name.includes("Điểm") || entry.name.includes("Trung bình") ? "/10" : ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [results, setResults] = useState<QuizResultData[]>([]);
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ─── Fetch Data ─────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 1. Fetch Aggregated Stats (1 Read)
          const statsDoc = await getDoc(doc(db, "user_stats", user.uid));
          if (statsDoc.exists()) {
            setAggregatedStats(statsDoc.data() as AggregatedStats);
          } else {
            setAggregatedStats({
              totalExams: 0,
              totalScoreSum: 0,
              bestScore: 0,
              totalCorrect: 0,
              totalQuestions: 0,
              streak: 0,
              subjectStats: {}
            });
          }

          // 2. Fetch Recent Results (limit 20) instead of all to save READs
          // Note: If no composite index exists for [userId + createdAt], 
          // we fallback to fetching without orderBy and sort client-side.
          let q;
          q = query(
            collection(db, "results"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(20)
          );
          
          let snapshot;
          try {
            snapshot = await getCachedDocs(q);
          } catch (e) {
            console.warn("Index not found, fetching without order/limit fallback:", e);
            const fallbackQ = query(
              collection(db, "results"),
              where("userId", "==", user.uid)
            );
            snapshot = await getCachedDocs(fallbackQ);
          }

          let data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as QuizResultData[];

          // Sort client-side anyway to ensure order and limit
          data.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() ? a.createdAt.toDate().getTime() : 0;
            const dateB = b.createdAt?.toDate?.() ? b.createdAt.toDate().getTime() : 0;
            return dateB - dateA;
          });

          // Apply limit client-side if fallback was used
          data = data.slice(0, 20);
            const dateB = b.createdAt?.toDate?.() ? b.createdAt.toDate().getTime() : 0;
            return dateA - dateB;
          });

          // Limit to 20 if we fetched everything
          if (data.length > 20) data = data.slice(-20);

          setResults(data);
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Error";
          console.error("Analytics Error:", errorMessage);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ─── Derived Data ───────────────────────────────────
  const subjects = useMemo(() => {
    const set = new Set(results.map((r) => r.subjectName).filter((s): s is string => !!s));
    return Array.from(set);
  }, [results]);

  const filteredResults = useMemo(() => {
    if (selectedSubject === "all") return results;
    return results.filter((r) => r.subjectName === selectedSubject);
  }, [results, selectedSubject]);

  // ─── Stats Cards Data ──────────────────────────────
  const stats = useMemo(() => {
    if (!aggregatedStats) return null;

    // Use Aggregated Stats for "all" mode
    if (selectedSubject === "all") {
       const { totalExams, totalScoreSum, bestScore, totalCorrect, totalQuestions } = aggregatedStats;
       const avgScore = totalExams > 0 ? totalScoreSum / totalExams : 0;
       const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
       
       return {
         totalExams,
         avgScore: avgScore.toFixed(1),
         bestScore,
         accuracy,
         streak: aggregatedStats.streak || 0,
         trend: "N/A",
         trendUp: true,
       };
    } else {
       // Per subject stats from the nested object
       const sub = Object.values(aggregatedStats.subjectStats || {}).find((s) => s.name === selectedSubject);
       if (!sub) return {
         totalExams: 0,
         avgScore: "0.0",
         bestScore: 0,
         accuracy: 0,
         streak: 0,
         trend: "N/A",
         trendUp: true,
       };
       
       const avgScore = sub.totalExams > 0 ? sub.totalScoreSum / sub.totalExams : 0;
       const accuracy = sub.totalQuestions > 0 ? Math.round((sub.totalCorrect / sub.totalQuestions) * 100) : 0;

       return {
         totalExams: sub.totalExams,
         avgScore: avgScore.toFixed(1),
         bestScore: "—", // Best score per subject not yet implemented in aggregation
         accuracy,
         streak: 0,
         trend: "N/A",
         trendUp: true,
       };
    }
  }, [aggregatedStats, filteredResults, selectedSubject]);

  // ─── Progress Over Time (Line Chart) ───────────────
  const progressData = useMemo(() => {
    return filteredResults.map((r, i) => ({
      name: `Lần ${i + 1}`,
      "Điểm": r.score,
      "Số câu đúng": r.correctCount,
      date: r.createdAt?.toDate?.()
        ? r.createdAt.toDate().toLocaleDateString("vi-VN")
        : `#${i + 1}`,
    }));
  }, [filteredResults]);

  // ─── Subject Performance (Radar Chart) ─────────────
  const radarData = useMemo(() => {
    if (!aggregatedStats || !aggregatedStats.subjectStats) return [];
    
    return Object.entries(aggregatedStats.subjectStats).map(([id, data]) => {
      const name = data.name || "Môn học";
      const avg = data.totalExams > 0 ? data.totalScoreSum / data.totalExams : 0;
      return {
        subject: name.length > 15 ? name.substring(0, 15) + "..." : name,
        fullName: name,
        "Trung bình": parseFloat(avg.toFixed(1)),
      };
    });
  }, [aggregatedStats]);

  // ─── Score Distribution (Bar Chart) ────────────────
  const distributionData = useMemo(() => {
    const buckets: Record<string, number> = {
      "0-2": 0, "3-4": 0, "5-6": 0, "7-8": 0, "9-10": 0,
    };
    filteredResults.forEach((r) => {
      if (r.score <= 2) buckets["0-2"]++;
      else if (r.score <= 4) buckets["3-4"]++;
      else if (r.score <= 6) buckets["5-6"]++;
      else if (r.score <= 8) buckets["7-8"]++;
      else buckets["9-10"]++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, "Số lần": count }));
  }, [filteredResults]);

  const barColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#6c5ce7"];

  // ─── Loading State ─────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="animate-spin text-[#6c5ce7]" size={40} />
      </div>
    );
  }

  // ─── Empty State ───────────────────────────────────
  if (results.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-40 space-y-6">
        <div className="mx-auto h-24 w-24 rounded-3xl bg-[#6c5ce7]/10 flex items-center justify-center">
          <BarChart3 size={48} className="text-[#6c5ce7]" />
        </div>
        <h2 className="text-2xl font-bold text-white">Chưa có dữ liệu phân tích</h2>
        <p className="text-slate-400">
          Hoàn thành ít nhất 1 bài thi để bắt đầu theo dõi tiến bộ của bạn.
        </p>
      </div>
    );
  }

  // ─── Main Render ───────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="text-[#6c5ce7]" size={32} />
            Phân tích tiến bộ
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Theo dõi hành trình học tập qua {results.length} bài thi
          </p>
        </div>

        {/* Subject Filter */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm font-bold text-white hover:bg-white/[0.06] transition-colors"
          >
            <BookOpen size={16} className="text-[#6c5ce7]" />
            {selectedSubject === "all" ? "Tất cả môn" : selectedSubject}
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-white/10 bg-[#0c0e17]/95 backdrop-blur-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={() => { setSelectedSubject("all"); setDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${selectedSubject === "all" ? "text-[#6c5ce7] font-bold" : "text-slate-300"}`}
              >
                Tất cả môn học
              </button>
              {subjects.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSelectedSubject(s); setDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors truncate ${selectedSubject === s ? "text-[#6c5ce7] font-bold" : "text-slate-300"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Tổng bài thi", value: stats.totalExams, icon: BookOpen, color: "text-[#6c5ce7]", bg: "bg-[#6c5ce7]/10" },
            { label: "Điểm TB", value: stats.avgScore, icon: Target, color: "text-[#00cec9]", bg: "bg-[#00cec9]/10" },
            { label: "Điểm cao nhất", value: stats.bestScore, icon: Award, color: "text-amber-400", bg: "bg-amber-400/10" },
            { label: "Tỉ lệ đúng", value: `${stats.accuracy}%`, icon: TrendingUp, color: "text-green-400", bg: "bg-green-400/10" },
            { label: "Chuỗi pass", value: `${stats.streak} 🔥`, icon: Flame, color: "text-orange-400", bg: "bg-orange-400/10" },
            {
              label: "Xu hướng",
              value: `${stats.trendUp ? "+" : ""}${stats.trend}`,
              icon: TrendingUp,
              color: stats.trendUp ? "text-green-400" : "text-red-400",
              bg: stats.trendUp ? "bg-green-400/10" : "bg-red-400/10",
            },
          ].map((card, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3 hover:bg-white/[0.04] transition-colors group"
            >
              <div className={`p-2 rounded-xl ${card.bg} w-fit ${card.color} group-hover:scale-110 transition-transform`}>
                <card.icon size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{card.value}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{card.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row 1: Progress + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart - Progress Over Time */}
        <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Biểu đồ tiến bộ</h3>
              <p className="text-xs text-slate-500">Điểm số qua từng lần thi</p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#6c5ce7]/10 text-[#6c5ce7] text-xs font-bold">
              {filteredResults.length} bài
            </div>
          </div>
          
          {progressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Điểm"
                  stroke="#6c5ce7"
                  strokeWidth={2.5}
                  fill="url(#scoreGradient)"
                  dot={{ r: 4, fill: "#6c5ce7", strokeWidth: 2, stroke: "#0c0e17" }}
                  activeDot={{ r: 6, stroke: "#6c5ce7", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-500 text-sm">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Bar Chart - Score Distribution */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white">Phân bố điểm</h3>
            <p className="text-xs text-slate-500">Số lần đạt từng mức điểm</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={distributionData}>
              <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
              <XAxis dataKey="range" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Số lần" radius={[8, 8, 0, 0]}>
                {distributionData.map((_, i) => (
                  <Cell key={i} fill={barColors[i]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Radar */}
      {radarData.length >= 2 && (
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white">Năng lực theo môn</h3>
            <p className="text-xs text-slate-500">Điểm trung bình mỗi môn học</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: "#4a5568", fontSize: 10 }} />
              <Radar
                name="Trung bình"
                dataKey="Trung bình"
                stroke="#6c5ce7"
                fill="#6c5ce7"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Results Table */}
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white">Lịch sử bài thi gần đây</h3>
          <p className="text-xs text-slate-500">10 bài thi gần nhất</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-3 font-bold">#</th>
                <th className="text-left py-3 px-3 font-bold">Môn học</th>
                <th className="text-center py-3 px-3 font-bold">Điểm</th>
                <th className="text-center py-3 px-3 font-bold">Đúng</th>
                <th className="text-center py-3 px-3 font-bold">Tỉ lệ</th>
                <th className="text-right py-3 px-3 font-bold">Ngày</th>
              </tr>
            </thead>
            <tbody>
              {[...filteredResults].reverse().slice(0, 10).map((r, i) => {
                const pct = r.totalQuestions > 0 ? Math.round((r.correctCount / r.totalQuestions) * 100) : 0;
                const scoreColor =
                  r.score >= 8 ? "text-green-400" :
                  r.score >= 5 ? "text-amber-400" : "text-red-400";
                const dateStr = r.createdAt?.toDate?.()
                  ? r.createdAt.toDate().toLocaleDateString("vi-VN")
                  : "—";

                return (
                  <tr key={r.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-3 text-slate-500 font-mono">{i + 1}</td>
                    <td className="py-3.5 px-3 text-white font-medium truncate max-w-[200px]">{r.subjectName}</td>
                    <td className={`py-3.5 px-3 text-center font-bold ${scoreColor}`}>{r.score}/10</td>
                    <td className="py-3.5 px-3 text-center text-slate-300">{r.correctCount}/{r.totalQuestions}</td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                        pct >= 80 ? "bg-green-500/10 text-green-400" :
                        pct >= 50 ? "bg-amber-500/10 text-amber-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>
                        {pct}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-500 text-xs">{dateStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
