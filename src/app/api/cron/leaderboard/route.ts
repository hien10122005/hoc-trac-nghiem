import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, limit, query, setDoc, doc, serverTimestamp } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Verify CRON_SECRET for security
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    console.log("Cron: Starting leaderboard aggregation...");
    
    // 1. Fetch all user stats
    // Note: On Spark plan with many users, this might be expensive. 
    // But for < 50k users, it works within daily limits if run hourly.
    const q = query(collection(db, "user_stats"), orderBy("totalScoreSum", "desc"), limit(10));
    const snapshot = await getDocs(q);
    
    const leaderboard = snapshot.docs.map(doc => ({
      userId: doc.id,
      userEmail: doc.data().userEmail || "Student",
      totalScore: doc.data().totalScoreSum || 0,
    }));

    // 2. Save snapshot to a single document
    await setDoc(doc(db, "system_data", "leaderboard_snapshot"), {
      entries: leaderboard,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    console.log("Cron: Leaderboard snapshot updated successfully.");
    
    return NextResponse.json({ 
      success: true, 
      count: leaderboard.length,
      updatedAt: new Date().toISOString() 
    });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
