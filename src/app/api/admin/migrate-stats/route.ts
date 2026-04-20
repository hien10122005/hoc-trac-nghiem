import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { QuizResultData } from "@/types/quiz";
import { FirestoreUserData, SubjectStats } from "@/types/user";

/**
 * API Chạy Migration: Đồng bộ hóa dữ liệu cũ sang user_stats
 * Truy cập: /api/admin/migrate-stats?key=QIU_ADMIN_FAST_SYNC
 * Lưu ý: Để bảo mật, API này giờ đây yêu cầu phương thức POST và CRON_SECRET
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { secret: string; targetCollection?: string };
    const { secret, targetCollection } = body;

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Lấy tất cả results từ Firestore
    const resultsSnap = await getDocs(collection(db, targetCollection || "results"));
    const results = resultsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as unknown as QuizResultData[];

    if (results.length === 0) {
      return NextResponse.json({ message: "Không có dữ liệu results để migrate." });
    }

    // 2. NhAm dA liAu theo userId AS tAnh toAn
    type MigrationStatsMap = Record<string, { 
      totalExams: number; 
      totalCorrect: number; 
      totalQuestions: number; 
      totalScoreSum: number; 
      bestScore: number; 
      subjectStats: Record<string, SubjectStats> 
    }>;
    const userStatsMap: MigrationStatsMap = {};

    results.forEach((r) => {
      const uid = r.userId as string;
      if (!uid) return;

      if (!userStatsMap[uid]) {
        userStatsMap[uid] = {
          totalExams: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          totalScoreSum: 0,
          bestScore: 0,
          subjectStats: {} as Record<string, SubjectStats>
        };
      }

      const stats = userStatsMap[uid];
      stats.totalExams = (stats.totalExams || 0) + 1;
      stats.totalQuestions = (stats.totalQuestions || 0) + (r.totalQuestions || 0);
      stats.totalScoreSum = (stats.totalScoreSum || 0) + (r.score || 0);
      stats.totalCorrect = (stats.totalCorrect || 0) + (r.correctCount || 0);
      
      if ((r.score || 0) > stats.bestScore) {
        stats.bestScore = r.score;
      }

      // Thống kê theo từng môn học
      const sid = r.subjectId;
      if (sid) {
        if (!stats.subjectStats[sid]) {
          stats.subjectStats[sid] = {
            name: r.subjectName || "Môn học không tên",
            totalExams: 0,
            totalCorrect: 0,
            totalQuestions: 0,
            totalScoreSum: 0,
            bestScore: 0
          };
        }
        const s = stats.subjectStats[sid];
        s.totalExams += 1;
        s.totalCorrect += r.correctCount || 0;
        s.totalQuestions += r.totalQuestions || 0;
        s.totalScoreSum += r.score || 0;
      }
    });

    // 3. Ghi dữ liệu đã tổng hợp vào collection user_stats
    const promises = Object.entries(userStatsMap).map(([uid, stats]) => {
      return setDoc(doc(db, "user_stats", uid), {
        ...stats,
        lastUpdated: serverTimestamp(),
        migrationNote: "Dữ liệu được đồng bộ từ script migration v1"
      }, { merge: true });
    });

    await Promise.all(promises);

    return NextResponse.json({ 
      success: true, 
      message: `Đã hoàn thành migrate cho ${Object.keys(userStatsMap).length} người dùng.`,
      summary: {
        totalResultsProcessed: results.length,
        totalUsersImpacted: Object.keys(userStatsMap).length
      }
    });

  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error("Migration Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Unknown error"
    }, { status: 500 });
  }
}
