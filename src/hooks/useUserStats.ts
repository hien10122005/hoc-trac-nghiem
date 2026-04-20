import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export interface UserPerformance {
  totalXP: number;
  avgScore: number;
  testsCompleted: number;
  progressPercent: number;
  streak: number;
  loading: boolean;
}

export function useUserStats() {
  const [performance, setPerformance] = useState<UserPerformance>({
    totalXP: 0,
    avgScore: 0,
    testsCompleted: 0,
    progressPercent: 0,
    streak: 0,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setPerformance(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        // 1. Fetch User Stats (Summarized)
        const statsDoc = await getDoc(doc(db, "user_stats", user.uid));
        
        // 2. Fetch Total Subjects (to calculate progress)
        const subjectsSnap = await getDocs(collection(db, "subjects"));
        const totalSubjects = subjectsSnap.size || 1;

        if (statsDoc.exists()) {
          const data = statsDoc.data();
          const subjectStats = data.subjectStats || {};
          
          let totalScore = 0;
          let totalExams = 0;
          let subjectsAttempted = Object.keys(subjectStats).length;

          Object.values(subjectStats).forEach((s: any) => {
            totalScore += s.totalScoreSum || 0;
            totalExams += s.totalExams || 0;
          });

          const avg = totalExams > 0 ? (totalScore / totalExams) : 0;
          const xp = totalScore * 10; // Simple XP formula
          
          // Progress Calculation: Attempted Subjects / Total Subjects
          const progress = Math.min(Math.round((subjectsAttempted / totalSubjects) * 100), 100);

          // 3. Simple Streak Logic (Recent results in last 7 days)
          // For now, let's just use a static mock or basic count if results exist
          // To be truly smart, we'd query 'results' and count consecutive days.
          
          setPerformance({
            totalXP: xp,
            avgScore: parseFloat(avg.toFixed(1)),
            testsCompleted: totalExams,
            progressPercent: progress || 5, // Minimum 5% to look good
            streak: subjectsAttempted > 0 ? 1 : 0, // Placeholder for real streak logic
            loading: false,
          });
        } else {
          setPerformance(prev => ({ ...prev, loading: false, progressPercent: 5 }));
        }
      } catch (err) {
        console.error("Hook useUserStats error:", err);
        setPerformance(prev => ({ ...prev, loading: false }));
      }
    });

    return () => unsubscribe();
  }, []);

  return performance;
}
