"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen, GraduationCap } from "lucide-react";

// Components
import HeroBanner from "@/components/dashboard/HeroBanner";
import SubjectGrid from "@/components/dashboard/SubjectGrid";
import MaterialGrid from "@/components/dashboard/MaterialGrid";

interface Subject {
  id: string;
  name: string;
  description?: string;
  avgScore?: number;
}

    // Result and other interfaces removed because we no longer fetch history

export default function DashboardPage() {
  const [user, setUser] = useState<unknown>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'quiz' | 'library'>('quiz');
  const [selectedSubject, setSelectedSubject] = useState<{id: string, name: string} | null>(null);
  const router = useRouter();

  // Auth check
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

  // Fetch Subjects and User Results
  useEffect(() => {
    if (!user) return;

    // Fetch Subjects
    const qSub = query(collection(db, "subjects"), orderBy("name", "asc"));
    const unsubSub = onSnapshot(qSub, (snapshot) => {
      const subjectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as unknown as Subject[];
      setSubjects(subjectsData);
      setSubjectsLoading(false);
    }, (error) => {
      console.error("Error fetching subjects:", error);
      setSubjectsLoading(false);
    });

    return () => {
      unsubSub();
    };
  }, [user]);

  const handleSubjectSelect = (id: string, name: string) => {
    if (viewMode === 'quiz') {
      router.push(`/quiz/${id}`);
    } else {
      setSelectedSubject({ id, name });
    }
  };



  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07070a]">
        <Loader2 className="h-10 w-10 animate-spin text-[#6c5ce7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-[#f0f0fd] font-manrope selection:bg-[#6c5ce7]/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#6c5ce7]/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#00cec9]/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 md:px-10 lg:py-12 space-y-10">
        {/* TOP: Hero Banner */}
        <HeroBanner userName={(user as { email?: string })?.email?.split('@')[0] || "Học viên"} streak={0} />

        {/* MAIN CONTENT: Subjects or Materials */}
        <div className="space-y-10 max-w-5xl mx-auto">
          
          {/* Mode Tabs */}
          <div className="flex p-1.5 bg-white/5 border border-white/5 rounded-2xl w-fit mx-auto sm:mx-0">
             <button 
                onClick={() => { setViewMode('quiz'); setSelectedSubject(null); }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  viewMode === 'quiz' 
                    ? "bg-[#6c5ce7] text-white shadow-lg shadow-[#6c5ce7]/20" 
                    : "text-slate-400 hover:text-white"
                }`}
             >
                <GraduationCap size={18} />
                <span>Ôn luyện</span>
             </button>
             <button 
                onClick={() => setViewMode('library')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  viewMode === 'library' 
                    ? "bg-[#00cec9] text-white shadow-lg shadow-[#00cec9]/20" 
                    : "text-slate-400 hover:text-white"
                }`}
             >
                <BookOpen size={18} />
                <span>Thư viện tài liệu</span>
             </button>
          </div>

          {selectedSubject && viewMode === 'library' ? (
            <MaterialGrid 
              subjectId={selectedSubject.id} 
              subjectName={selectedSubject.name} 
              onBack={() => setSelectedSubject(null)} 
            />
          ) : (
            <section className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    {viewMode === 'quiz' ? "Cửa hàng môn học" : "Thư viện chuyên đề"}
                  </h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                    {viewMode === 'quiz' ? "Chọn thử thách tiếp theo" : "Khám phá kiến thức mới"}
                  </p>
                </div>
                <div className="h-px flex-1 mx-8 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              
              <SubjectGrid 
                subjects={subjects} 
                loading={subjectsLoading} 
                onSelect={handleSubjectSelect}
              />
            </section>
          )}
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        .font-manrope { font-family: 'Manrope', sans-serif; }
      `}</style>
    </div>
  );
}

