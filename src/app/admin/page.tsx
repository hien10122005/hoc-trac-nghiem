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
  getDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
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
  ShieldAlert
} from "lucide-react";

// Định nghĩa Interface để tránh lỗi TypeScript/Lint trên GitHub
interface FirestoreResultData {
  userEmail?: string;
  subjectName?: string;
  createdAt: Timestamp;
}

interface FirestoreUserData {
  name?: string;
  email?: string;
  role?: string;
  createdAt: Timestamp;
}

interface RecentActivity {
  id: string;
  type: "quiz" | "user";
  user: string;
  target?: string;
  createdAt: Timestamp;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    subjects: 0,
    questions: 0,
    students: 0,
    results: 0
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      // Kiểm tra quyền Admin thực tế từ Firestore
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data() as FirestoreUserData | undefined;
        
        if (userData?.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error verifying admin role:", error);
        setIsAdmin(false);
        setIsLoading(false);
      }
    });

    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (isAdmin !== true) return;

    async function fetchCounts() {
      try {
        const [subCount, qCount, userCount, resCount] = await Promise.all([
          getCountFromServer(collection(db, "subjects")),
          getCountFromServer(collection(db, "questions")),
          getCountFromServer(query(collection(db, "users"), where("role", "==", "student"))),
          getCountFromServer(collection(db, "results"))
        ]);

        setStats({
          subjects: subCount.data().count,
          questions: qCount.data().count,
          students: userCount.data().count,
          results: resCount.data().count
        });
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    }

    fetchCounts();

    // Fetch Recent Activities (Real-time)
    const qResults = query(collection(db, "results"), orderBy("createdAt", "desc"), limit(5));
    const qUsers = query(collection(db, "users"), where("role", "==", "student"), orderBy("createdAt", "desc"), limit(5));

    let quizActivities: RecentActivity[] = [];
    let userActivities: RecentActivity[] = [];

    const updateMergedActivities = () => {
      setActivities(() => {
        const merged = [...quizActivities, ...userActivities]
          .filter(a => a.createdAt)
          .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
          .slice(0, 5);
        return merged;
      });
      setIsLoading(false);
    };

    const unsubResults = onSnapshot(qResults, (snapshot) => {
      quizActivities = snapshot.docs.map(snap => {
        const data = snap.data() as FirestoreResultData;
        return {
          id: snap.id,
          type: "quiz" as const,
          user: data.userEmail?.split('@')[0] || "Học viên",
          target: data.subjectName,
          createdAt: data.createdAt
        };
      });
      updateMergedActivities();
    });

    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      userActivities = snapshot.docs.map(snap => {
        const data = snap.data() as FirestoreUserData;
        return {
          id: snap.id,
          type: "user" as const,
          user: data.name || data.email?.split('@')[0] || "Học viên mới",
          createdAt: data.createdAt
        };
      });
      updateMergedActivities();
    });

    return () => {
      unsubResults();
      unsubUsers();
    };
  }, [isAdmin]);

  // UI cảnh báo nếu không phải Admin
  if (isAdmin === false) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white">Truy cập bị từ chối</h2>
        <p className="text-slate-400 max-w-sm">
          Tài khoản của bạn không có quyền quản trị. Vui lòng liên hệ quản trị viên hệ thống hoặc đăng nhập bằng tài khoản khác.
        </p>
        <button 
          onClick={() => router.push("/login")}
          className="rounded-xl bg-white/5 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-all"
        >
          Quay lại Đăng nhập
        </button>
      </div>
    );
  }

  const statCards = [
    { 
      label: "Tổng môn học", 
      value: stats.subjects, 
      icon: BookOpen, 
      color: "from-blue-500 to-cyan-400",
      trend: "Hoạt động" 
    },
    { 
      label: "Ngân hàng câu hỏi", 
      value: stats.questions.toLocaleString(), 
      icon: Database, 
      color: "from-purple-500 to-pink-500",
      trend: "Đang lưu trữ" 
    },
    { 
      label: "Tổng học viên", 
      value: stats.students, 
      icon: Users, 
      color: "from-emerald-500 to-teal-400",
      trend: "Thành viên" 
    },
    { 
      label: "Tổng lượt thi", 
      value: stats.results.toLocaleString(), 
      icon: Activity, 
      color: "from-orange-500 to-yellow-400",
      trend: "Lượt làm bài" 
    },
  ];

  const formatRelativeTime = (timestamp: Timestamp) => {
    if (!timestamp) return "...";
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
      {/* Header Section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Chào mừng trở lại, <span className="bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] bg-clip-text text-transparent">Admin</span>
          </h1>
          <p className="text-slate-400 mt-1">Hôm nay hệ thống của bạn đang hoạt động rất tốt.</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-all border border-white/5">
            <FileText size={18} />
            <span>Xuất báo cáo</span>
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-[#6c5ce7] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#5b4bc4] transition-all shadow-lg shadow-[#6c5ce7]/20">
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
            style={{ 
              animation: "fadeInUp 0.6s ease-out both",
              animationDelay: `${i * 100}ms` 
            }}
          >
            {isLoading ? (
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
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#00cec9] bg-[#00cec9]/10 px-2 py-1 rounded-full uppercase tracking-wider">
                    <TrendingUp size={10} />
                    <span>Live</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <h3 className="mt-1 text-3xl font-bold text-white">{stat.value}</h3>
                  <p className="mt-2 text-xs text-slate-400">
                    <span className="text-[#00cec9]">{stat.trend}</span>
                  </p>
                </div>
              </>
            )}
            <div className={`absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-gradient-to-br ${stat.color} opacity-[0.03] blur-2xl group-hover:opacity-10 transition-opacity`} />
          </div>
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity List */}
        <div className="lg:col-span-2 rounded-2xl bg-[#10101f] border border-white/5 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h3 className="text-lg font-semibold text-white">Hoạt động gần đây</h3>
            <button className="text-xs font-medium text-[#6c5ce7] hover:underline flex items-center gap-1">
              Xem tất cả <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {isLoading ? (
                [1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                     <div className="h-10 w-10 rounded-full bg-white/5" />
                     <div className="space-y-2 flex-1">
                        <div className="h-4 bg-white/5 rounded-md w-3/4" />
                        <div className="h-3 bg-white/5 rounded-md w-full" />
                     </div>
                  </div>
                ))
              ) : activities.length > 0 ? (
                activities.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold transition-colors ${
                        item.type === "user" ? "text-emerald-400 border-emerald-500/30" : "text-slate-400 group-hover:border-[#6c5ce7]/50"
                      }`}>
                        {item.type === "user" ? <UserPlus size={16} /> : item.user.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          <span className="capitalize">{item.user}</span> 
                          {item.type === "quiz" ? (
                            <>
                              <span className="text-slate-500 font-normal"> vừa hoàn thành bài thi </span> 
                              <span className="text-[#6c5ce7]">{item.target}</span>
                            </>
                          ) : (
                            <span className="text-emerald-400 font-normal"> vừa gia nhập hệ thống</span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">{formatRelativeTime(item.createdAt)}</p>
                      </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/5 rounded-lg transition-all">
                      <ArrowUpRight size={14} className="text-slate-500" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-500 py-4 italic">Chưa có hoạt động nào được ghi nhận.</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Tips/Info */}
        <div className="space-y-8">
          <div className="rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] p-6 text-white shadow-xl shadow-[#6c5ce7]/20 relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="font-bold text-lg">Mẹo quản trị</h3>
              <p className="text-sm text-white/80 mt-2 leading-relaxed">
                Bạn có thể nhấn tổ hợp phím <code className="bg-black/20 px-1 rounded">Ctrl + K</code> để mở nhanh thanh tìm kiếm toàn hệ thống.
              </p>
              <button className="mt-6 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#6c5ce7] opacity-90 hover:opacity-100 transition-opacity">
                Khám phá ngay
              </button>
            </div>
            <Activity className="absolute -right-8 -bottom-8 h-40 w-40 text-black/5 rotate-12 group-hover:scale-110 transition-transform duration-500" />
          </div>

          <div className="rounded-2xl bg-[#10101f] border border-white/5 p-6 shadow-xl">
             <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
               <TrendingUp size={18} className="text-[#00cec9]" />
               <span>Trạng thái máy chủ</span>
             </h3>
             <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Database (Firestore)</span>
                    <span className="text-emerald-400 font-medium">99.9%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[99.9%] bg-emerald-400 rounded-full" />
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Lưu trữ (Storage)</span>
                    <span className="text-[#6c5ce7] font-medium">75%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[75%] bg-[#6c5ce7] rounded-full" />
                  </div>
               </div>
               <div className="pt-2">
                 <p className="text-[10px] text-slate-500 text-center italic">Cập nhật tự động sau mỗi 30s</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

