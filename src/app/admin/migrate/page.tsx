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
      console.log("Migration started...");
      // 1. Fetch all questions
      setProgress("Đang lấy danh sách câu hỏi từ 'questions' (Read request)...");
      const questionsRef = collection(db, "questions");
      const snapshot = await getDocs(questionsRef);
      
      const allQuestions: Question[] = [];
      snapshot.forEach(doc => {
        allQuestions.push({ id: doc.id, ...doc.data() } as Question);
      });

      console.log(`Fetched ${allQuestions.length} questions.`);

      if (allQuestions.length === 0) {
        toast.error("Không có câu hỏi nào để migrate!");
        setIsMigrating(false);
        setProgress("Không tìm thấy dữ liệu trong collection 'questions'.");
        return;
      }

      setProgress(`Đã tải ${allQuestions.length} câu hỏi. Đang phân loại theo môn học...`);

      // 2. Group by subjectId
      const groupedBySubject: Record<string, Question[]> = {};
      allQuestions.forEach(q => {
        if (!q.subjectId) {
          console.warn(`Question ${q.id} missing subjectId`);
          return;
        }
        if (!groupedBySubject[q.subjectId]) {
          groupedBySubject[q.subjectId] = [];
        }
        groupedBySubject[q.subjectId].push(q);
      });

      // 3. Write to 'quizzes' collection
      let subjectCount = 0;
      const subjectIds = Object.keys(groupedBySubject);
      for (const subjectId of subjectIds) {
        subjectCount++;
        setProgress(`[Bước 1/2] Đang ghi môn học ${subjectCount}/${subjectIds.length} (ID: ${subjectId})...`);
        
        try {
          await setDoc(doc(db, "quizzes", subjectId), {
            questions: groupedBySubject[subjectId],
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (setErr: any) {
          console.error(`Error writing subject ${subjectId}:`, setErr);
          throw new Error(`Lỗi khi ghi dữ liệu vào 'quizzes/${subjectId}': ${setErr.message}`);
        }
      }

      // 4. Delete old queries (using batching)
      let deletedCount = 0;
      let batch = writeBatch(db);
      setProgress(`[Bước 2/2] Bắt đầu xóa ${allQuestions.length} câu hỏi cũ...`);
      
      for (let i = 0; i < allQuestions.length; i++) {
        batch.delete(doc(db, "questions", allQuestions[i].id));
        deletedCount++;
        
        if (deletedCount % 400 === 0 || i === allQuestions.length - 1) {
          setProgress(`[Bước 2/2] Đang xóa câu hỏi cũ (${deletedCount}/${allQuestions.length})...`);
          try {
            await batch.commit();
            console.log(`Committed batch delete up to ${deletedCount}`);
            batch = writeBatch(db);
          } catch (delErr: any) {
            console.error("Batch delete error:", delErr);
            throw new Error(`Lỗi khi xóa dữ liệu cũ (Batch): ${delErr.message}`);
          }
        }
      }

      setProgress("✅ Hoàn tất migration thành công!");
      toast.success("Đã cấu trúc lại dữ liệu thành công!");
    } catch (error: any) {
      console.error("Full Migration Error Trace:", error);
      const msg = error.code === 'permission-denied' 
        ? "Lỗi quyền truy cập (Permission Denied). Vui lòng kiểm tra Firebase Rules." 
        : error.message;
      toast.error("Lỗi: " + msg);
      setProgress("❌ Lỗi: " + msg);
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
