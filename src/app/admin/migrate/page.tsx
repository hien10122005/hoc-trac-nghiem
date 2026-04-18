"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch,
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2, AlertTriangle, CheckCircle2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

interface Question {
  id: string;
  subjectId: string;
  content: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  createdAt: any;
}

export default function MigratePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState<string>("");

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Just basic check for now, assuming if they are here they might be admin
        setIsAdmin(true); 
      } else {
        router.push("/login");
      }
    });
    return () => unsubAuth();
  }, [router]);

  const handleMigrate = async () => {
    if (!confirm("CẢNH BÁO: Hành động này sẽ chuyển toàn bộ dữ liệu từ 'questions' sang 'quizzes' và XÓA sạch dữ liệu trong collection 'questions'. Bạn đã sao lưu chưa?")) return;

    setIsMigrating(true);
    setProgress("Bắt đầu lấy dữ liệu từ 'questions'...");

    try {
      // 1. Fetch all questions
      const snapshot = await getDocs(collection(db, "questions"));
      const allQuestions: Question[] = [];
      snapshot.forEach(doc => {
        allQuestions.push({ id: doc.id, ...doc.data() } as Question);
      });

      if (allQuestions.length === 0) {
        toast.error("Không có câu hỏi nào để migrate!");
        setIsMigrating(false);
        setProgress("");
        return;
      }

      setProgress(`Đã tải ${allQuestions.length} câu hỏi. Đang phân loại theo môn học...`);

      // 2. Group by subjectId
      const groupedBySubject: Record<string, Question[]> = {};
      allQuestions.forEach(q => {
        if (!groupedBySubject[q.subjectId]) {
          groupedBySubject[q.subjectId] = [];
        }
        // Remove subjectId from inside the nested object to save space if desired, 
        // but keeping it is fine. We'll ensure it has an ID.
        groupedBySubject[q.subjectId].push(q);
      });

      // 3. Write to 'quizzes' collection
      let subjectCount = 0;
      for (const subjectId in groupedBySubject) {
        subjectCount++;
        setProgress(`Đang lưu môn học ${subjectCount}/${Object.keys(groupedBySubject).length} (ID: ${subjectId})...`);
        
        await setDoc(doc(db, "quizzes", subjectId), {
          questions: groupedBySubject[subjectId],
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // 4. Delete old queries (using batching)
      let deletedCount = 0;
      let batch = writeBatch(db);
      for (let i = 0; i < allQuestions.length; i++) {
        batch.delete(doc(db, "questions", allQuestions[i].id));
        deletedCount++;
        if (deletedCount % 500 === 0 || i === allQuestions.length - 1) {
          setProgress(`Đang xóa câu hỏi cũ (${deletedCount}/${allQuestions.length})...`);
          await batch.commit();
          batch = writeBatch(db);
        }
      }

      setProgress("✅ Hoàn tất migration thành công!");
      toast.success("Đã cấu trúc lại dữ liệu thành công!");
    } catch (error: any) {
      console.error("Migration error:", error);
      toast.error("Lỗi trong quá trình migration: " + error.message);
      setProgress("❌ Lỗi: " + error.message);
    } finally {
      setIsMigrating(false);
    }
  };

  if (!isAdmin) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8 animate-in fade-in space-y-6">
      <button 
        onClick={() => router.push("/admin")}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft size={16} /> Quay lại trang quản trị
      </button>

      <div className="rounded-3xl bg-red-500/10 border border-red-500/30 p-8 text-center space-y-4">
        <div className="mx-auto h-16 w-16 bg-red-500/20 text-red-500 flex items-center justify-center rounded-full mb-4">
          <AlertTriangle size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white">Migration Công Cụ</h1>
        <p className="text-slate-300">
          Công cụ này sẽ chuyển <strong>toàn bộ</strong> dữ liệu từ cấu trúc "1 câu hỏi = 1 Document" sang "1 Môn học = 1 Document (chứa mảng câu hỏi)".
          Dữ liệu ở collection cũ `questions` sẽ bị xóa hoàn toàn để dọn dẹp.
        </p>

        <button
          onClick={handleMigrate}
          disabled={isMigrating}
          className="mt-6 w-full max-w-sm mx-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isMigrating ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
          {isMigrating ? "Đang xử lý..." : "Khởi chạy Migration"}
        </button>
        
        {progress && (
          <div className="mt-6 p-4 rounded-xl bg-black/40 text-sm font-mono text-emerald-400 text-left">
            {progress}
          </div>
        )}
      </div>
    </div>
  );
}

// Just a dummy icon import since Database is missing above
import { Database } from "lucide-react";
