"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Award,
  Flame,
  Target,
  Star,
  Zap,
  Trophy,
  Crown,
  BookOpen,
  Loader2,
} from "lucide-react";
interface UserStats {
  totalExams: number;
  avgScore: number;
  bestScore: number;
  accuracy: number;
  streak: number;
  subjectCount: number;
}
// ─── Badge Definitions ──────────────────────────────────
const BADGE_DEFS = [
  {
    id: "first_quiz",
    name: "Bước đầu tiên",
    desc: "Hoàn thành bài thi đầu tiên",
    icon: Star,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    check: (stats: UserStats) => stats.totalExams >= 1,
  },
  {
    id: "five_quizzes",
    name: "Siêng năng",
    desc: "Hoàn thành 5 bài thi",
    icon: BookOpen,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    check: (stats: UserStats) => stats.totalExams >= 5,
  },
  {
    id: "ten_quizzes",
    name: "Chiến binh",
    desc: "Hoàn thành 10 bài thi",
    icon: Shield,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
    check: (stats: UserStats) => stats.totalExams >= 10,
  },
  {
    id: "perfect_score",
    name: "Hoàn hảo",
    desc: "Đạt 10/10 trong một bài thi",
    icon: Crown,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
    check: (stats: UserStats) => stats.bestScore >= 10,
  },
  {
    id: "high_scorer",
    name: "Xuất sắc",
    desc: "Đạt điểm TB trên 8",
    icon: Trophy,
    color: "text-[#00cec9]",
    bg: "bg-[#00cec9]/10",
    border: "border-[#00cec9]/20",
    check: (stats: UserStats) => stats.avgScore >= 8,
  },
  {
    id: "streak_3",
    name: "Lửa đam mê",
    desc: "Đạt 3 lần pass liên tiếp (≥5đ)",
    icon: Flame,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
    check: (stats: UserStats) => stats.streak >= 3,
  },
  {
    id: "streak_5",
    name: "Không thể cản",
    desc: "Đạt 5 lần pass liên tiếp",
    icon: Zap,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
    check: (stats: UserStats) => stats.streak >= 5,
  },
  {
    id: "accuracy_80",
    name: "Thiện xạ",
    desc: "Tỉ lệ đúng tổng thể ≥ 80%",
    icon: Target,
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/20",
    check: (stats: UserStats) => stats.accuracy >= 80,
  },
  {
    id: "multi_subject",
    name: "Đa tài",
    desc: "Thi ít nhất 3 môn khác nhau",
    icon: Award,
    color: "text-[#6c5ce7]",
    bg: "bg-[#6c5ce7]/10",
    border: "border-[#6c5ce7]/20",
    check: (stats: UserStats) => stats.subjectCount >= 3,
  },
];

export default function ProfilePage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<{ name?: string; createdAt?: unknown } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        const userDoc = await getDoc(doc(db, "users", authUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Fetch results for badge calculation
        try {
          const q = query(
            collection(db, "results"),
            where("userId", "==", authUser.uid),
            orderBy("createdAt", "desc")
          );
          const snapshot = await getDocs(q);
          const results = snapshot.docs.map((d) => d.data());

          if (results.length > 0) {
            const totalExams = results.length;
            const avgScore = results.reduce((a, r) => a + (r.score || 0), 0) / totalExams;
            const bestScore = Math.max(...results.map((r) => r.score || 0));
            const totalCorrect = results.reduce((a, r) => a + (r.correctCount || 0), 0);
            const totalQ = results.reduce((a, r) => a + (r.totalQuestions || 0), 0);
            const accuracy = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
            const subjectCount = new Set(results.map((r) => r.subjectName)).size;

            // Calculate streak (sort by createdAt desc)
            const sorted = [...results].sort((a, b) => {
              const da = a.createdAt?.toDate?.() ? a.createdAt.toDate().getTime() : 0;
              const db2 = b.createdAt?.toDate?.() ? b.createdAt.toDate().getTime() : 0;
              return db2 - da;
            });
            let streak = 0;
            for (const r of sorted) {
              if ((r.score || 0) >= 5) streak++;
              else break;
            }

            setStats({ totalExams, avgScore, bestScore, accuracy, streak, subjectCount });
          } else {
            setStats({ totalExams: 0, avgScore: 0, bestScore: 0, accuracy: 0, streak: 0, subjectCount: 0 });
          }
        } catch (err) {
          console.error("Error fetching results for badges:", err);
          setStats({ totalExams: 0, avgScore: 0, bestScore: 0, accuracy: 0, streak: 0, subjectCount: 0 });
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="animate-spin text-[#6c5ce7]" size={40} />
      </div>
    );
  }

  const earnedBadges = stats ? BADGE_DEFS.filter((b) => b.check(stats)) : [];
  const lockedBadges = stats ? BADGE_DEFS.filter((b) => !b.check(stats)) : BADGE_DEFS;

  const profileStats = [
    { label: "Bài thi", value: stats?.totalExams || 0, icon: BookOpen, color: "text-[#6c5ce7]" },
    { label: "Điểm TB", value: stats?.avgScore?.toFixed(1) || "0", icon: Target, color: "text-[#00cec9]" },
    { label: "Huy hiệu", value: earnedBadges.length, icon: Award, color: "text-amber-400" },
    { label: "Ngày tham gia", value: userData?.createdAt?.toDate().toLocaleDateString('vi-VN') || "Mới đây", icon: Calendar, color: "text-green-400" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Profile Header */}
      <div className="relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <User size={120} />
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-[#6c5ce7]/20">
            {userData?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
          </div>
          
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-3xl font-bold text-white">{userData?.name || "Học viên"}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-400 text-sm">
              <div className="flex items-center gap-1.5">
                <Mail size={16} />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield size={16} />
                <span className="uppercase tracking-widest text-[10px] font-bold text-[#00cec9]">Học viên chính thức</span>
              </div>
            </div>
            {/* Mini Badge Display */}
            {earnedBadges.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-1.5 pt-2">
                {earnedBadges.slice(0, 5).map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-1.5 rounded-lg ${badge.bg} ${badge.border} border`}
                    title={badge.name}
                  >
                    <badge.icon size={14} className={badge.color} />
                  </div>
                ))}
                {earnedBadges.length > 5 && (
                  <span className="text-xs text-slate-500 self-center ml-1">+{earnedBadges.length - 5}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {profileStats.map((stat, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3 hover:bg-white/[0.04] transition-colors">
            <div className={`p-2 rounded-lg bg-white/5 w-fit ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Badges Section */}
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award size={22} className="text-amber-400" />
            Tủ huy hiệu
          </h2>
          <span className="text-xs font-bold text-slate-500">
            {earnedBadges.length}/{BADGE_DEFS.length} đã mở khóa
          </span>
        </div>

        {/* Earned Badges */}
        {earnedBadges.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className={`rounded-2xl border ${badge.border} ${badge.bg} p-5 space-y-3 group hover:scale-[1.02] transition-all`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${badge.bg} border ${badge.border}`}>
                    <badge.icon size={22} className={badge.color} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${badge.color}`}>{badge.name}</p>
                    <p className="text-[10px] text-slate-500">{badge.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Locked Badges */}
        {lockedBadges.length > 0 && (
          <>
            <div className="h-px w-full bg-white/5" />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Chưa mở khóa</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lockedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 space-y-3 opacity-40 grayscale"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <badge.icon size={22} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500">{badge.name}</p>
                      <p className="text-[10px] text-slate-600">{badge.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detailed Info */}
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <User size={20} className="text-[#6c5ce7]" />
          Thông tin chi tiết
        </h2>
        
        <div className="space-y-4">
          <div className="flex justify-between py-3 border-b border-white/5">
            <span className="text-slate-500">Mã học viên</span>
            <span className="text-white font-mono">{user?.uid.slice(0, 10)}...</span>
          </div>
          <div className="flex justify-between py-3 border-b border-white/5">
            <span className="text-slate-500">Loại tài khoản</span>
            <span className="text-white">Sinh viên</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-slate-500">Lần cuối đăng nhập</span>
            <span className="text-white">{user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('vi-VN') : "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
