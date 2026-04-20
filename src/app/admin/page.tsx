"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  getCountFromServer,
  where,
  Timestamp,
  doc,
  getDoc,
  getDocs
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { FirestoreUserData } from "@/types/user";
import { MaterialData } from "@/types/material";
import { QuizResultData } from "@/types/quiz";
import { 
  BookOpen, 
  Database, 
  Users, 
  Activity,
  Plus,
  ArrowUpRight,
  TrendingUp,
  FileText,
  UserPlus,
  ShieldAlert,
  Loader2,
  Inbox
} from "lucide-react";

interface RecentActivity {
  id: string;
  type: "quiz" | "user" | "material";
  user: string;
  target?: string;
  createdAt: Timestamp | null;
  score?: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    subjects: 0,
    questions: 0,
    students: 0,
    materials: 0
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userData, setUserData] = useState<FirestoreUserData | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data() as FirestoreUserData | undefined;
        
        if (userData?.role === "admin") {
          setIsAdmin(true);
          setUserData(userData);
        } else {
          setIsAdmin(false);
          setIsStatsLoading(false);
          setIsActivitiesLoading(false);
        }
      } catch (error) {
        console.error("Error verifying admin role:", error);
        setIsAdmin(false);
        setIsStatsLoading(false);
        setIsActivitiesLoading(false);
      }
    });

    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (isAdmin !== true) return;

    // 1. Fetch Summary Stats
    async function fetchCounts() {
      try {
        const [subCount, quizzesSnap, userCount, materialsCount] = await Promise.all([
          getCountFromServer(collection(db, "subjects")),
          getDocs(collection(db, "quizzes")),
          getCountFromServer(query(collection(db, "users"), where("role", "==", "student"))),
          getCountFromServer(collection(db, "materials"))
        ]);

        let totalQuestions = 0;
        quizzesSnap.forEach(doc => {
          const data = doc.data();
          totalQuestions += (Array.isArray(data.questions) ? data.questions.length : 0);
        });

        setStats({
          subjects: subCount.data().count,
          questions: totalQuestions,
          students: userCount.data().count,
          materials: materialsCount.data().count
        });
      } catch (error) {
        console.error("Error fetching counts:", error);
      } finally {
        setIsStatsLoading(false);
      }
    }

    fetchCounts();

    // 2. Fetch Unified Activities (Real-time)
    const qMaterials = query(collection(db, "materials"), orderBy("createdAt", "desc"), limit(5));
    const qUsers = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5));
    const qResults = query(collection(db, "results"), orderBy("createdAt", "desc"), limit(5));

    let feedMaterials: RecentActivity[] = [];
    let feedUsers: RecentActivity[] = [];
    let feedResults: RecentActivity[] = [];

    const updateMergedFeed = () => {
      setActivities(() => {
        const merged = [...feedMaterials, ...feedUsers, ...feedResults]
          .filter(a => a.createdAt)
          .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
          .slice(0, 8);
        return merged;
      });
      setIsActivitiesLoading(false);
    };

    const unsubMaterials = onSnapshot(qMaterials, (snapshot) => {
      feedMaterials = snapshot.docs.map(snap => {
        const data = snap.data() as MaterialData;
        return {
          id: snap.id,
          type: "material",
          user: "Hệ thống", 
          target: data.title,
          createdAt: data.createdAt
        };
      });
      updateMergedFeed();
    });

    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      feedUsers = snapshot.docs.map(snap => {
        const data = snap.data() as FirestoreUserData;
        return {
          id: snap.id,
          type: "user",
          user: data.name || data.email?.split('@')[0] || "Thành viên mới",
          createdAt: data.createdAt
        };
      });
      updateMergedFeed();
    });

    const unsubResults = onSnapshot(qResults, (snapshot) => {
      feedResults = snapshot.docs.map(snap => {
        const data = snap.data() as QuizResultData;
        return {
          id: snap.id,
          type: "quiz",
          user: data.userName || data.userEmail?.split('@')[0] || "Học viên",
          target: data.subjectName || "Bài thi",
          score: data.score,
          createdAt: data.createdAt
        };
      });
      updateMergedFeed();
    });

    return () => {
      unsubMaterials();
      unsubUsers();
      unsubResults();
    };
  }, [isAdmin]);

  if (isAdmin === false) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white">Truy cập bị từ chối</h2>
        <p className="text-slate-400 max-w-sm">Tài khoản này không có quyền quản trị.</p>
        <button onClick={() => router.push("/login")} className="rounded-xl bg-white/5 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-all">Quay lại Đăng nhập</button>
      </div>
    );
  }

  const statCards = [
    { label: "Tổng môn học", value: stats.subjects, icon: BookOpen, color: "from-[#6c5ce7] to-[#a29bfe]" },
    { label: "Ngân hàng câu hỏi", value: stats.questions.toLocaleString(), icon: Database, color: "from-[#00cec9] to-[#81ecec]" },
    { label: "Tài liệu thư viện", value: stats.materials, icon: FileText, color: "from-amber-500 to-orange-400" },
    { label: "Tổng học viên", value: stats.students, icon: Users, color: "from-blue-500 to-indigo-400" },
  ];

  const formatRelativeTime = (timestamp: Timestamp | null) => {
    if (!timestamp) return "Đang cập nhật...";
    const now = new Date();
    const date = timestamp.toDate();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "Vừa xong";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between font-outfit">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Chào mừng trở lại, <span className="bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] bg-clip-text text-transparent">Admin</span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Hệ thống đang được vận hành ổn định và chính xác.</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-all border border-white/5">
            <FileText size={18} />
            <span>Xuất báo cáo</span>
          </button>
          <button onClick={() => router.push('/admin/subjects')} className="flex items-center gap-2 rounded-xl bg-[#6c5ce7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#5b4bc4] transition-all shadow-lg shadow-[#6c5ce7]/20">
            <Plus size={18} />
            <span>Thêm môn học</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <div 
            key={stat.label}
            className="group relative overflow-hidden rounded-2xl bg-[#10101f] p-6 border border-white/5 hover:border-[#6c5ce7]/30 transition-all duration-500 shadow-xl"
            style={{ animation: "fadeInUp 0.6s ease-out both", animationDelay: `${i * 100}ms` }}
          >
            {isStatsLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-10 w-10 bg-white/5 rounded-xl" />
                <div className="h-8 w-24 bg-white/5 rounded-lg" />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div className={`rounded-xl bg-gradient-to-br ${stat.color} p-3 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                    <stat.icon size={22} className="text-white" />
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <h3 className="mt-1 text-3xl font-black text-white">{stat.value}</h3>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-3xl bg-[#10101f] border border-white/5 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.01]">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity size={20} className="text-[#6c5ce7]" />
              <span>Hoạt động hệ thống</span>
            </h3>
            <span className="text-[10px] font-black text-[#00cec9] bg-[#00cec9]/10 px-2 py-1 rounded-full uppercase tracking-widest">Thời gian thực</span>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {isActivitiesLoading ? (
                [1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                     <div className="h-12 w-12 rounded-2xl bg-white/5" />
                     <div className="space-y-2 flex-1">
                        <div className="h-4 bg-white/5 rounded-md w-3/4" />
                        <div className="h-3 bg-white/5 rounded-md w-1/2" />
                     </div>
                  </div>
                ))
              ) : activities.length > 0 ? (
                activities.map((item) => (
                  <div key={item.id} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-lg font-black shadow-lg transition-transform group-hover:scale-105 border border-white/5 ${
                        item.type === "user" ? "bg-blue-500/10 text-blue-400" : 
                        item.type === "material" ? "bg-amber-500/10 text-amber-400" : 
                        "bg-emerald-500/10 text-emerald-400"
                      }`}>
                        {item.type === "user" ? <UserPlus size={22} /> : 
                         item.type === "material" ? <FileText size={22} /> : 
                         <Activity size={22} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white leading-snug">
                          <span className="capitalize">{item.user}</span> 
                          {item.type === "quiz" ? (
                            <>
                              <span className="text-slate-500 font-medium"> hoàn thành </span> 
                              <span className="text-[#6c5ce7]">{item.target}</span>
                              <span className="ml-2 text-[10px] font-black bg-[#6c5ce7]/20 text-[#6c5ce7] px-1.5 py-0.5 rounded italic">Point: {item.score}</span>
                            </>
                          ) : item.type === "material" ? (
                            <>
                              <span className="text-slate-500 font-medium"> đã thêm tài liệu </span>
                              <span className="text-amber-400">{item.target}</span>
                            </>
                          ) : (
                            <span className="text-[#00cec9] font-medium"> vừa gia nhập hệ thống</span>
                          )}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{formatRelativeTime(item.createdAt)}</p>
                      </div>
                    </div>
                    <ArrowUpRight size={16} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-600">
                  <Inbox size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-bold italic tracking-wide uppercase">Chưa có hoạt động nào</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Tips */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] p-6 text-white shadow-xl shadow-[#6c5ce7]/20 relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="font-black text-xl tracking-tight">Khu vực Quản trị</h3>
              <p className="text-sm text-white/90 mt-3 font-medium leading-relaxed">
                Quản lý quyền hạn học viên và theo dõi kết quả thi trực tiếp tại đây.
              </p>
              <button onClick={() => router.push('/admin/users')} className="mt-8 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#6c5ce7] hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
                Quản lý người dùng
              </button>
            </div>
            <ShieldAlert className="absolute -right-8 -bottom-8 h-40 w-40 text-black/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
          </div>

          <div className="rounded-3xl bg-[#10101f] border border-white/5 p-6 shadow-xl">
             <h3 className="font-bold text-white mb-6 flex items-center gap-2 tracking-tight">
               <TrendingUp size={18} className="text-[#00cec9]" />
               <span>Hướng dẫn nhanh</span>
             </h3>
             <ul className="space-y-4">
               {[
                 "Nhấn Ctrl + K để tìm kiếm nhanh",
                 "Click vào tên môn học để sửa",
                 "Dữ liệu được cập nhật Real-time"
               ].map((tip, i) => (
                 <li key={i} className="flex gap-3 text-sm text-slate-400 font-medium">
                   <div className="h-5 w-5 rounded-lg bg-white/5 flex items-center justify-center text-[10px] text-[#6c5ce7] font-black">{i+1}</div>
                   {tip}
                 </li>
               ))}
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

