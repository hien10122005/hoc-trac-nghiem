"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Loader2,
  Database,
  CheckCircle2,
  ChevronDown,
  Info,
  HelpCircle,
  AlertCircle,
  FileSpreadsheet,
  Upload,
  Download
} from "lucide-react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  doc,
  serverTimestamp,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";


// Interface cho Môn học (để load dropdown)
interface Subject {
  id: string;
  name: string;
}

// Interface cho Câu hỏi
interface Question {
  id: string;
  subjectId: string;
  content: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  bloomLevel: 1 | 2 | 3 | 4;
  createdAt: unknown;
}

export default function QuestionsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [tempQuestions, setTempQuestions] = useState<Question[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [content, setContent] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [bloomLevel, setBloomLevel] = useState<1 | 2 | 3 | 4>(1);

  // Handle Download File Mẫu
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 
        CauHoi: "Thủ đô của Việt Nam là gì?", 
        DapAnA: "Hồ Chí Minh", 
        DapAnB: "Hà Nội", 
        DapAnC: "Đà Nẵng", 
        DapAnD: "Huế", 
        ViTriDapAnDung: 1, 
        GiaiThich: "Hà Nội là thủ đô của Việt Nam.",
        CapDoBloom: 1 // 1: Nhận biết, 2: Thông hiểu, 3: Vận dụng, 4: Nâng cao
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template.xlsx");
    toast.success("Đã tải xuống file mẫu!");
  };

  // Handle Upload Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedSubjectId) {
      toast.error("Vui lòng chọn môn học trước khi upload!");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Đang đọc dữ liệu file Excel...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      interface ExcelRow {
        CauHoi?: string;
        DapAnA?: string | number;
        DapAnB?: string | number;
        DapAnC?: string | number;
        DapAnD?: string | number;
        ViTriDapAnDung?: number | string;
        GiaiThich?: string;
        CapDoBloom?: number | string;
      }

      const jsonData = XLSX.utils.sheet_to_json(firstSheet) as ExcelRow[];

      if (!jsonData || jsonData.length === 0) {
        throw new Error("File trống hoặc định dạng không hợp lệ!");
      }

      const parseCorrectAnswer = (val: unknown): number => {
        if (typeof val === "string") {
          const upperVal = val.trim().toUpperCase();
          if (upperVal === "A") return 0;
          if (upperVal === "B") return 1;
          if (upperVal === "C") return 2;
          if (upperVal === "D") return 3;
        }
        
        const num = Number(val);
        // Nếu là số 1-4 thì chuyển về 0-3, nếu là 0-3 thì giữ nguyên
        if (num >= 1 && num <= 4) return num - 1;
        if (num >= 0 && num <= 3) return num;
        
        return 0; // Mặc định là A nếu không nhận dạng được
      };

      const newQuestions: Question[] = [];
      let addedCount = 0;

      jsonData.forEach((row) => {
        if (!row.CauHoi || row.DapAnA === undefined || row.DapAnB === undefined || row.DapAnC === undefined || row.DapAnD === undefined || row.ViTriDapAnDung === undefined) {
          return; // Skip missing data row
        }

        newQuestions.push({
          id: crypto.randomUUID(),
          subjectId: selectedSubjectId,
          content: String(row.CauHoi),
          options: [String(row.DapAnA), String(row.DapAnB), String(row.DapAnC), String(row.DapAnD)],
          correctAnswer: parseCorrectAnswer(row.ViTriDapAnDung),
          explanation: row.GiaiThich ? String(row.GiaiThich) : "",
          bloomLevel: (row.CapDoBloom && [1, 2, 3, 4].includes(Number(row.CapDoBloom))) ? Number(row.CapDoBloom) as 1|2|3|4 : 1,
          createdAt: new Date().toISOString(),
        });
        addedCount++;
      });

      if (addedCount === 0) {
        throw new Error("Không có câu hỏi hợp lệ nào được tìm thấy. Vui lòng kiểm tra lại cấu trúc file!");
      }

      setTempQuestions(newQuestions);
      setIsPreviewOpen(true);
      toast.success(`Đã đọc ${addedCount} câu hỏi. Vui lòng kiểm tra lại trước khi lưu!`, { id: toastId });
    } catch (error: unknown) {
      const e = error as Error;
      console.error(e);
      toast.error(e.message || "Lỗi khi upload dữ liệu!", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmSaveBulk = async () => {
    if (!selectedSubjectId || tempQuestions.length === 0) return;
    
    setIsSubmitting(true);
    const toastId = toast.loading(`Đang lưu ${tempQuestions.length} câu hỏi...`);
    
    try {
      const docRef = doc(db, "quizzes", selectedSubjectId);
      const docSnap = await getDoc(docRef);
      
      const existingQs = docSnap.exists() ? (docSnap.data().questions || []) : [];
      const updatedQs = [...existingQs, ...tempQuestions];
      
      await setDoc(docRef, { 
        questions: updatedQs, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      setQuestions(updatedQs);
      setIsPreviewOpen(false);
      setTempQuestions([]);
      toast.success(`Đã lưu thành công ${tempQuestions.length} câu hỏi!`, { id: toastId });
    } catch (error) {
      console.error("Error saving bulk questions:", error);
      toast.error("Lỗi khi lưu dữ liệu lên server!", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch subjects for dropdown
  useEffect(() => {
    const q = query(collection(db, "subjects"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subjectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })) as Subject[];
      setSubjects(subjectsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch questions for selected subject
  useEffect(() => {
    if (!selectedSubjectId) {
      if (questions.length > 0) {
        const t = setTimeout(() => setQuestions([]), 0);
        return () => clearTimeout(t);
      }
      return;
    }

    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "quizzes", selectedSubjectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setQuestions(docSnap.data().questions || []);
        } else {
          setQuestions([]);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, [selectedSubjectId]);

  const handleOpenEditModal = (q: Question) => {
    setEditingQuestionId(q.id);
    setContent(q.content);
    setOptions([...q.options]);
    setCorrectAnswer(q.correctAnswer);
    setExplanation(q.explanation || "");
    setBloomLevel(q.bloomLevel || 1);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setContent("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer(0);
    setExplanation("");
    setBloomLevel(1);
    setEditingQuestionId(null);
  };

  // Handle Submit (Add or Edit)
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !content.trim()) {
      toast.error("Vui lòng chọn môn học và nhập nội dung câu hỏi.");
      return;
    }
    if (options.some(opt => !opt.trim())) {
      toast.error("Vui lòng nhập đầy đủ 4 đáp án.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(editingQuestionId ? "Đang cập nhật câu hỏi..." : "Đang thêm câu hỏi...");
    try {
      const docRef = doc(db, "quizzes", selectedSubjectId);
      const docSnap = await getDoc(docRef);
      
      let newQuestionsList: Question[] = [];
      
      if (editingQuestionId) {
        // Edit mode
        newQuestionsList = questions.map(q => 
          q.id === editingQuestionId 
            ? { ...q, content, options, correctAnswer, explanation, bloomLevel } 
            : q
        );
      } else {
        // Add mode
        const newQuestion: Question = {
          id: crypto.randomUUID(),
          subjectId: selectedSubjectId,
          content,
          options,
          correctAnswer,
          explanation,
          bloomLevel,
          createdAt: new Date().toISOString(),
        };
        
        if (docSnap.exists()) {
          const existingQs = docSnap.data().questions || [];
          newQuestionsList = [...existingQs, newQuestion];
        } else {
          newQuestionsList = [newQuestion];
        }
      }

      await setDoc(docRef, { 
        questions: newQuestionsList, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      setQuestions(newQuestionsList);
      
      // Reset & Close
      resetForm();
      setIsModalOpen(false);
      toast.success(editingQuestionId ? "Cập nhật thành công!" : "Thêm câu hỏi thành công!", { id: toastId });
    } catch (error) {
      console.error("Error submitting question:", error);
      toast.error("Đã có lỗi xảy ra khi lưu câu hỏi.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) {
      try {
          const newQuestionsList = questions.filter(q => q.id !== id);
          if (newQuestionsList.length > 0) {
             await updateDoc(doc(db, "quizzes", selectedSubjectId), { questions: newQuestionsList, updatedAt: serverTimestamp() });
          } else {
             // If empty, just set it to empty array or delete the doc (setting to empty is fine)
             await updateDoc(doc(db, "quizzes", selectedSubjectId), { questions: [], updatedAt: serverTimestamp() });
          }
          setQuestions(newQuestionsList);
          toast.success("Đã xóa câu hỏi.");
        } catch (error) {
          console.error("Error deleting question:", error);
          toast.error("Lỗi khi xóa câu hỏi.");
        }
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Ngân hàng <span className="bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] bg-clip-text text-transparent">Câu hỏi</span>
          </h1>
          <p className="text-slate-400 mt-1">Xây dựng bộ đề trắc nghiệm thông minh cho từng môn học.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleDownloadTemplate}
            className="group flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
          >
            <Download size={16} />
            <span className="hidden md:inline">Tải file mẫu</span>
          </button>

          <input 
            type="file" 
            accept=".xlsx, .xls"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="group flex items-center justify-center gap-2 rounded-xl bg-[#00cec9]/10 border border-[#00cec9]/30 px-4 py-3 text-sm font-semibold text-[#00cec9] transition-all hover:bg-[#00cec9]/20 disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            <span className="hidden md:inline">{isUploading ? "Đang tải lên..." : "Upload Excel"}</span>
          </button>

          <button 
            onClick={() => {
              if (!selectedSubjectId) {
                toast.error("Vui lòng chọn môn học trước khi thêm câu hỏi.");
                return;
              }
              resetForm();
              setIsModalOpen(true);
            }}
            className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#5b4bc4] px-5 py-3 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#6c5ce7]/30"
          >
            <div className="bg-white/20 rounded-lg p-1 group-hover:bg-white/30 transition-colors">
              <Plus size={18} />
            </div>
            <span>Thêm câu hỏi mới</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-80">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest absolute -top-2 left-3 bg-[#0a0a14] px-1 z-10 transition-colors">Chọn môn học</label>
          <div className="relative">
            <Database className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6c5ce7]" />
            <select 
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full rounded-2xl border border-white/5 bg-[#10101f] py-4 pl-12 pr-10 text-sm text-white outline-none focus:border-[#6c5ce7]/50 focus:ring-4 focus:ring-[#6c5ce7]/5 appearance-none cursor-pointer transition-all active:scale-[0.98]"
            >
              <option value="">-- Tất cả môn học --</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>
        
        {selectedSubjectId && !loading && (
          <div className="flex items-center gap-2 px-6 py-2 bg-[#6c5ce7]/10 rounded-2xl border border-[#6c5ce7]/20 text-[#aca3ff] text-sm animate-in zoom-in duration-300">
             Đang có <span className="font-bold">{questions.length}</span> câu hỏi
          </div>
        )}
      </div>

      {/* Main Content */}
      {!selectedSubjectId ? (
        <div className="flex flex-col items-center justify-center h-[500px] rounded-3xl border-2 border-dashed border-white/5 bg-[#10101f]/30">
          <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-6 relative">
            <HelpCircle size={48} className="text-slate-600" />
            <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-[#6c5ce7] flex items-center justify-center border-4 border-[#0a0a14] animate-bounce">
              <Plus size={16} className="text-white" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white">Chưa chọn môn học</h3>
          <p className="text-slate-500 mt-2 text-center max-w-sm px-6">
            Vui lòng chọn một môn học từ danh sách phía trên để xem và quản lý ngân hàng câu hỏi tương ứng.
          </p>
        </div>
      ) : loading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#6c5ce7]" />
        </div>
      ) : questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div 
              key={q.id}
              className="group relative flex flex-col rounded-2xl bg-[#10101f] border border-white/5 hover:border-[#6c5ce7]/30 transition-all duration-300 overflow-hidden shadow-xl"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold text-[#6c5ce7] bg-[#6c5ce7]/10 px-2 py-0.5 rounded uppercase tracking-wider">Câu {questions.length - idx}</span>
                      <div className="h-1 w-1 rounded-full bg-slate-700" />
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">ID: {q.id.substring(0, 8)}</span>
                    </div>
                    <h4 className="text-lg font-bold text-white leading-relaxed">{q.content}</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleOpenEditModal(q)}
                      className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Options List */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt, i) => {
                    const isCorrect = i === q.correctAnswer;
                    return (
                      <div 
                        key={i}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                          isCorrect 
                            ? "bg-[#00cec9]/10 border-[#00cec9]/30 text-white shadow-[inset_0_0_20px_rgba(0,206,201,0.05)]" 
                            : "bg-white/[0.02] border-white/5 text-slate-400"
                        }`}
                      >
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold border ${
                          isCorrect ? "bg-[#00cec9] border-[#00cec9] text-[#0a0a14]" : "bg-black/20 border-white/10"
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-sm flex-1">{opt}</span>
                        {isCorrect && <CheckCircle2 size={16} className="text-[#00cec9] shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="mt-5 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex gap-3 group/exp">
                    <Info size={16} className="text-orange-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-orange-200/60 leading-relaxed italic">
                      <span className="font-bold text-orange-400/80 not-italic mr-1">Giải thích:</span>
                      {q.explanation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-80 rounded-2xl border-2 border-dashed border-white/5 bg-[#10101f]/50">
          <AlertCircle size={32} className="text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white">Môn học này chưa có câu hỏi</h3>
          <p className="text-slate-500 mt-1 text-sm">Bấm &quot;Thêm câu hỏi mới&quot; để bắt đầu xây dựng ngân hàng đề thi.</p>
        </div>
      )}

      {/* Add Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a14]/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div 
            className="w-full max-w-2xl rounded-3xl bg-[#10101f] border border-white/10 shadow-2xl shadow-black/80 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#6c5ce7]/20 flex items-center justify-center text-[#6c5ce7]">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {editingQuestionId ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
                  </h3>
                  <p className="text-xs text-slate-500">Môn học: <span className="text-[#6c5ce7] font-semibold">{subjects.find(s => s.id === selectedSubjectId)?.name}</span></p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="rounded-xl p-2 hover:bg-white/5 text-slate-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitQuestion} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                {/* Question Content */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Nội dung câu hỏi <span className="text-red-500">*</span></label>
                  <textarea 
                    rows={3}
                    required
                    placeholder="Nhập nội dung câu hỏi trắc nghiệm tại đây..."
                    className="w-full rounded-xl border border-white/5 bg-black/40 py-4 px-4 text-sm text-white outline-none focus:border-[#6c5ce7]/50 focus:bg-black transition-all resize-none"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
                
                {/* Bloom Level Selection */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3 px-1">Phân loại Tư duy (Bloom Level) <span className="text-[#6c5ce7] font-black">*</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { val: 1, label: "Nhận biết", color: "from-blue-500/20 to-blue-600/20", borderColor: "border-blue-500/30", icon: "🧠" },
                      { val: 2, label: "Thông hiểu", color: "from-emerald-500/20 to-emerald-600/20", borderColor: "border-emerald-500/30", icon: "📖" },
                      { val: 3, label: "Vận dụng", color: "from-orange-500/20 to-orange-600/20", borderColor: "border-orange-500/30", icon: "🛠️" },
                      { val: 4, label: "Nâng cao", color: "from-red-500/20 to-red-600/20", borderColor: "border-red-500/30", icon: "🚀" }
                    ].map((level) => (
                      <button
                        key={level.val}
                        type="button"
                        onClick={() => setBloomLevel(level.val as 1|2|3|4)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                          bloomLevel === level.val 
                            ? `bg-gradient-to-br ${level.color} ${level.borderColor} border-opacity-100 shadow-xl scale-[1.02]` 
                            : "bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <span className="text-xl">{level.icon}</span>
                        <div className="text-center">
                          <p className={`text-[10px] font-black uppercase tracking-tighter ${bloomLevel === level.val ? "text-white" : "text-slate-500"}`}>Level {level.val}</p>
                          <p className={`text-[9px] font-bold whitespace-nowrap ${bloomLevel === level.val ? "text-white/80" : "text-slate-600"}`}>{level.label}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options Section */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-4 px-1">Danh sách đáp án & Đáp án đúng <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-1 gap-4">
                    {options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-4">
                        {/* Radio for Correct Answer */}
                        <button
                          type="button"
                          onClick={() => setCorrectAnswer(i)}
                          className={`group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
                            correctAnswer === i 
                              ? "bg-[#00cec9] border-[#00cec9] text-[#0a0a14] shadow-[0_0_15px_rgba(0,206,201,0.3)]" 
                              : "border-white/5 bg-white/5 text-slate-500 hover:border-white/20"
                          }`}
                        >
                          <span className="font-bold">{String.fromCharCode(65 + i)}</span>
                        </button>
                        
                        {/* Option Input */}
                        <div className="relative flex-1">
                          <input 
                            type="text" 
                            required
                            placeholder={`Nhập đáp án ${String.fromCharCode(65 + i)}...`}
                            className={`w-full rounded-xl border py-3.5 px-4 text-sm outline-none transition-all ${
                              correctAnswer === i 
                                ? "bg-[#00cec9]/5 border-[#00cec9]/30 text-[#00cec9] focus:bg-[#00cec9]/10" 
                                : "bg-black/40 border-white/5 text-slate-300 focus:border-[#6c5ce7]/50 focus:bg-black"
                            }`}
                            value={opt}
                            onChange={(e) => handleOptionChange(i, e.target.value)}
                          />
                          {correctAnswer === i && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#00cec9] uppercase tracking-tighter">Correct</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation Section */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Giải thích đáp án (Nếu có)</label>
                  <textarea 
                    rows={2}
                    placeholder="Tại sao đáp án này đúng? (Sẽ hiển thị sau khi học viên nộp bài)..."
                    className="w-full rounded-xl border border-white/5 bg-black/40 py-4 px-4 text-sm text-slate-300 outline-none focus:border-orange-500/50 focus:bg-black transition-all resize-none italic"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl bg-white/5 border border-white/5 py-4 text-sm font-bold text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] py-4 text-sm font-bold text-white shadow-lg shadow-[#6c5ce7]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
                  <span>{isSubmitting ? "Đang lưu..." : editingQuestionId ? "Lưu thay đổi" : "Xác nhận lưu câu hỏi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal for Bulk Upload */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0a0a14]/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-5xl rounded-[2.5rem] bg-[#10101f] border border-white/10 shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#00cec9]/10 flex items-center justify-center text-[#00cec9]">
                  <FileSpreadsheet size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Kiểm tra dữ liệu chuẩn bị tải lên</h3>
                  <p className="text-sm text-slate-400 mt-1">Vui lòng rà soát lại nội dung và đáp án trước khi nhấn xác nhận lưu.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-8 custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-4">
                    <th className="pb-4 pl-6">STT</th>
                    <th className="pb-4">Nội dung câu hỏi</th>
                    <th className="pb-4">Đáp án đúng</th>
                    <th className="pb-4 pr-6 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {tempQuestions.map((q, i) => (
                    <tr key={i} className="group bg-white/5 hover:bg-white/[0.08] transition-colors rounded-2xl overflow-hidden">
                      <td className="py-5 pl-6 rounded-l-2xl">
                         <span className="h-8 w-8 rounded-lg bg-black/20 flex items-center justify-center text-xs font-bold text-slate-400 border border-white/5">
                           {i + 1}
                         </span>
                      </td>
                      <td className="py-5 pr-4 max-w-md">
                         <p className="text-sm font-bold text-white line-clamp-2 leading-relaxed">{q.content}</p>
                      </td>
                      <td className="py-5">
                         <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-md bg-[#00cec9] text-[#0a0a14] flex items-center justify-center text-[10px] font-bold">
                               {String.fromCharCode(65 + q.correctAnswer)}
                            </span>
                            <span className="text-sm text-slate-400 truncate max-w-[200px]">{q.options[q.correctAnswer]}</span>
                         </div>
                      </td>
                      <td className="py-5 pr-6 text-right rounded-r-2xl">
                         <span className="text-[10px] text-slate-500 uppercase font-bold bg-black/20 px-2 py-1 rounded">
                            {q.options.length} đáp án
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-white/[0.02] border-t border-white/5 flex gap-4 shrink-0">
               <button 
                onClick={() => setIsPreviewOpen(false)}
                className="flex-1 px-8 py-4 rounded-2xl bg-white/5 border border-white/5 text-slate-400 font-bold hover:bg-white/10 hover:text-white transition-all shadow-xl"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleConfirmSaveBulk}
                disabled={isSubmitting}
                className="flex-[2] px-8 py-4 rounded-2xl bg-gradient-to-r from-[#00cec9] to-[#6c5ce7] text-white font-bold shadow-2xl shadow-[#00cec9]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                <span>Xác nhận & Lưu {tempQuestions.length} câu hỏi lên Server</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles for custom scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(108, 92, 231, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(108, 92, 231, 0.4);
        }
      `}</style>
    </div>
  );
}
