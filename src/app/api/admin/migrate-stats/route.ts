import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * API Chạy Migration: Đồng bộ hóa dữ liệu cũ sang user_stats
 * Truy cập: /api/admin/migrate-stats?key=DNC_ADMIN_FAST_SYNC
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  // Bảo mật cơ bản
  if (key !== "DNC_ADMIN_FAST_SYNC") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Lấy tất cả results từ Firestore
    const resultsSnap = await getDocs(collection(db, "results"));
    const results = resultsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

    if (results.length === 0) {
      return NextResponse.json({ message: "Không có dữ liệu results để migrate." });
    }

    // 2. Nhóm dữ liệu theo userId để tính toán
    const userStatsMap: Record<string, any> = {};

    results.forEach((r) => {
      const uid = r.userId;
      if (!uid) return;

      if (!userStatsMap[uid]) {
        userStatsMap[uid] = {
          totalExams: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          totalScoreSum: 0,
          bestScore: 0,
          subjectStats: {}
        };
      }

      const stats = userStatsMap[uid];
      stats.totalExams += 1;
      stats.totalCorrect += r.correctCount || 0;
      stats.totalQuestions += r.totalQuestions || 0;
      stats.totalScoreSum += r.score || 0;
      
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
            totalScoreSum: 0
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
      // Dùng setDoc với merge: true để giữ lại các field khác nếu có
      return setDoc(doc(db, "user_stats", uid), {
        ...stats,
        lastUpdatedAt: serverTimestamp(),
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

  } catch (error: any) {
    console.error("Migration Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
