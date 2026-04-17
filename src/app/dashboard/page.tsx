"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocs 
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { 
  LogOut, 
  BookOpen, 
  GraduationCap, 
  Clock, 
  ArrowRight, 
  Layout, 
  User as UserIcon,
  Loader2,
  Trophy,
  History
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch real subjects
  useEffect(() => {
    const q = query(collection(db, "subjects"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subjectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subject[];
      setSubjects(subjectsData);
      setSubjectsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0e17]">
        <Loader2 className="h-10 w-10 animate-spin text-[#6c5ce7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0e17] text-[#f0f0fd] font-manrope selection:bg-[#6c5ce7]/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#6c5ce7]/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#00cec9]/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 md:px-10 lg:py-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#6c5ce7] font-bold tracking-widest uppercase text-xs">
              <Layout size={14} />
              <span>Học tập & Rèn luyện</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
              Chào mừng bạn, <span className="bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] bg-clip-text text-transparent">{user?.email?.split('@')[0]}</span>
            </h1>
            <p className="text-slate-500 font-medium">Hôm nay bạn muốn thử thách bản thân với môn học nào?</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end mr-2">
              <span className="text-sm font-bold text-white uppercase tracking-tighter">{user?.email}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded mt-1">Học viên</span>
            </div>
            <button
              onClick={handleSignOut}
              className="group p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 transition-all shadow-xl backdrop-blur-md"
              title="Đăng xuất"
            >
              <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </header>

        {/* Quick Stats Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
           <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-5 backdrop-blur-sm group hover:bg-white/[0.04] transition-all">
              <div className="h-14 w-14 rounded-2xl bg-[#6c5ce7]/10 flex items-center justify-center text-[#6c5ce7]">
                <BookOpen size={28} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Môn học</p>
                <p className="text-2xl font-bold text-white">{subjects.length}</p>
              </div>
           </div>
           <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-5 backdrop-blur-sm group hover:bg-white/[0.04] transition-all">
              <div className="h-14 w-14 rounded-2xl bg-[#00cec9]/10 flex items-center justify-center text-[#00cec9]">
                <Trophy size={28} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Điểm cao nhất</p>
                <p className="text-2xl font-bold text-white">--</p>
              </div>
           </div>
           <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-5 backdrop-blur-sm group hover:bg-white/[0.04] transition-all">
              <div className="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <History size={28} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bài thi đã làm</p>
                <p className="text-2xl font-bold text-white">--</p>
              </div>
           </div>
        </div>

        {/* Subjects Grid */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Danh sách môn học</h2>
            <div className="h-[2px] flex-1 mx-8 bg-gradient-to-r from-white/5 to-transparent" />
          </div>

          {subjectsLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
            </div>
          ) : subjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {subjects.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/quiz/${item.id}`)}
                  className="group relative flex flex-col p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-[#6c5ce7]/30 transition-all cursor-pointer overflow-hidden shadow-2xl backdrop-blur-md"
                >
                  {/* Hover Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#6c5ce7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] p-0.5 mb-6 group-hover:scale-110 transition-transform duration-500">
                      <div className="h-full w-full rounded-[0.9rem] bg-[#0c0e17] flex items-center justify-center">
                        <GraduationCap className="text-[#aca3ff]" size={32} />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-[#6c5ce7] transition-colors">{item.name}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-2">
                      {item.description || "Tham gia bài thi trắc nghiệm để củng cố kiến thức và đánh giá năng lực của bạn."}
                    </p>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-[#6c5ce7]" />
                          <span>20 Phút</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 rounded-full bg-[#6c5ce7] px-5 py-2.5 text-xs font-bold text-white transition-all group-hover:shadow-[0_0_20px_rgba(108,92,231,0.4)]">
                        <span>Vào thi</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 rounded-[2.5rem] bg-white/[0.02] border-2 border-dashed border-white/5">
              <p className="text-slate-500">Chưa có môn học nào khả dụng. Vui lòng quay lại sau.</p>
            </div>
          )}
        </section>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        .font-manrope { font-family: 'Manrope', sans-serif; }
      `}</style>
    </div>
  );
}
