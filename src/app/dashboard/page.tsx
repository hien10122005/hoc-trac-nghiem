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
import { Loader2 } from "lucide-react";

// Components
import HeroBanner from "@/components/dashboard/HeroBanner";
import SubjectGrid from "@/components/dashboard/SubjectGrid";

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
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
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

        {/* MAIN CONTENT: Subjects */}
        <div className="space-y-10 max-w-5xl mx-auto">
          
          {/* Subjects Grid */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-white">Cửa hàng môn học</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Chọn thử thách tiếp theo</p>
              </div>
              <div className="h-px flex-1 mx-8 bg-gradient-to-r from-white/10 to-transparent" />
            </div>
            
            <SubjectGrid 
              subjects={subjects} 
              loading={subjectsLoading} 
            />
          </section>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        .font-manrope { font-family: 'Manrope', sans-serif; }
      `}</style>
    </div>
  );
}

