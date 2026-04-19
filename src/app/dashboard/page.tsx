"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocs,
  where,
  Timestamp
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Components
import HeroBanner from "@/components/dashboard/HeroBanner";
import AIReview from "@/components/dashboard/AIReview";
import SubjectGrid from "@/components/dashboard/SubjectGrid";

interface Subject {
  id: string;
  name: string;
  description?: string;
  avgScore?: number;
}

interface IncorrectQuestion {
  content: string;
  options: string[];
  correctAnswer: number;
  userAnswer: number | null;
  explanation: string;
}

interface Result {
  userId: string;
  userEmail: string;
  subjectId: string;
  subjectName: string;
  score: number;
  createdAt: Timestamp;
  incorrectQuestions?: IncorrectQuestion[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<unknown>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(true);
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

    // Fetch User Results for Statistics/Streak
    const qRes = query(
      collection(db, "results"), 
      where("userId", "==", (user as { uid: string }).uid),
      orderBy("createdAt", "desc")
    );
    const unsubRes = onSnapshot(qRes, (snapshot) => {
      const resultsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as unknown as Result[];
      setResults(resultsData);
      setResultsLoading(false);
    }, (error) => {
      console.error("Error fetching results:", error);
      setResultsLoading(false);
    });

    return () => {
      unsubSub();
      unsubRes();
    };
  }, [user]);

  // Calculate Streak
  const streakCount = (() => {
    if (results.length === 0) return 0;
    
    const dates = results.map(r => {
      const d = r.createdAt.toDate();
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    });
    
    // Unique dates sorted descending
    const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b - a);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Check if last activity was today or yesterday
    if (uniqueDates[0] < today - oneDayMs) return 0;

    let streak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      if (uniqueDates[i] - uniqueDates[i+1] === oneDayMs) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  })();



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
        <HeroBanner userName={(user as { email?: string })?.email?.split('@')[0] || "Học viên"} streak={streakCount} />

        {/* MAIN CONTENT: AI Review & Subjects */}
        <div className="space-y-10 max-w-5xl mx-auto">
          {/* AI Smart Review */}
          <AIReview results={results} />
          
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
              subjects={subjects.map(s => {
                const subResults = results.filter(r => r.subjectId === s.id);
                const avg = subResults.length > 0 
                  ? subResults.reduce((acc, r) => acc + r.score, 0) / subResults.length 
                  : undefined;
                return {
                  ...s,
                  avgScore: avg !== undefined ? Number(avg.toFixed(1)) : undefined
                };
              })} 
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

