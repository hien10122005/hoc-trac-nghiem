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

  // Fetch Subjects
  useEffect(() => {
    async function fetchSubjects() {
      if (!user) return;
      try {
        const qSub = query(collection(db, "subjects"), orderBy("name", "asc"));
        const snapshot = await getCachedDocs(qSub);
        const subjectsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as unknown as Subject[];
        setSubjects(subjectsData);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setSubjectsLoading(false);
      }
    }
    fetchSubjects();
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
    <div className="space-y-10">
      {/* TOP: Hero Banner */}
      <HeroBanner userName={(user as any)?.email?.split('@')[0] || "Học viên"} />

      {/* Mode Tabs */}
      <div className="flex p-1.5 bg-white/5 border border-white/5 rounded-2xl w-fit mx-auto">
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
        <div className="max-w-6xl mx-auto">
          <MaterialGrid 
            subjectId={selectedSubject.id} 
            subjectName={selectedSubject.name} 
            onBack={() => setSelectedSubject(null)} 
          />
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {viewMode === 'quiz' ? "Cửa hàng môn học" : "Thư viện chuyên đề"}
              </h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-[#00cec9]">
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
        </div>
      )}
    </div>
  );
}

