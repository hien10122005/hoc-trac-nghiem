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
import StatsWidget from "@/components/dashboard/StatsWidget";
import AIReview from "@/components/dashboard/AIReview";
import SubjectGrid from "@/components/dashboard/SubjectGrid";
import Leaderboard from "@/components/dashboard/Leaderboard";

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

interface LeaderboardEntry {
  userId: string;
  userEmail: string;
  totalScore: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<unknown>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
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
      setDataLoading(false);
    });

    return () => {
      unsubSub();
      unsubRes();
    };
  }, [user]);

  // Fetch Global Leaderboard
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const qLevel = query(collection(db, "results"), orderBy("score", "desc"));
        const snapshot = await getDocs(qLevel);
        
        // Group by user and calculate total score
        const userScores: Record<string, { email: string, total: number }> = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (!userScores[data.userId]) {
            userScores[data.userId] = { email: data.userEmail, total: 0 };
          }
          userScores[data.userId].total += data.score;
        });

        const sorted = Object.entries(userScores)
          .map(([id, info]) => ({ userId: id, userEmail: info.email, totalScore: info.total }))
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, 5);
          
        setLeaderboardData(sorted);
      } catch (err) {
        console.error("Leaderboard fetch error", err);
      }
    }
    fetchLeaderboard();
  }, []);

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

  // Calculate Radar Data (Avg score per subject)
  const radarData = subjects.map(sub => {
    const subResults = results.filter(r => r.subjectId === sub.id);
    const avg = subResults.length > 0 
      ? subResults.reduce((acc, r) => acc + r.score, 0) / subResults.length 
      : 0;
    return {
      subject: sub.name,
      score: Number(avg.toFixed(1)),
      fullMark: 10
    };
  }).filter(d => d.score > 0 || subjects.length <= 5); // Show all if few subjects

  // Identify Weakest
  const weakestSubjectId = (() => {
    const scoredSubjects = radarData.filter(d => d.score > 0);
    if (scoredSubjects.length === 0) return undefined;
    const minScore = Math.min(...scoredSubjects.map(d => d.score));
    const weakest = scoredSubjects.find(d => d.score === minScore);
    return subjects.find(s => s.name === weakest?.subject)?.id;
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

        {/* MIDDLE: Stats & Continued Learning */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* Stats Chart */}
            <StatsWidget data={radarData} loading={dataLoading} />
            
            {/* AI Smart Review */}
            <AIReview results={results} />
            
            {/* Subjects Grid */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">Cửa hàng môn học</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Chọn thử thách tiếp theo</p>
                </div>
                <div className="h-px flex-1 mx-8 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              
              <SubjectGrid 
                subjects={subjects.map(s => ({
                  ...s,
                  avgScore: radarData.find(d => d.subject === s.name)?.score
                }))} 
                loading={dataLoading} 
                weakestSubjectId={weakestSubjectId}
              />
            </section>
          </div>

          <div className="lg:col-span-1">
            {/* Sidebar: Leaderboard */}
            <Leaderboard entries={leaderboardData} loading={dataLoading} />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        .font-manrope { font-family: 'Manrope', sans-serif; }
      `}</style>
    </div>
  );
}

