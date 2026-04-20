"use client";

import { useState, useEffect, useRef } from "react";
import * as mammoth from "mammoth";
import TurndownService from "turndown";
import { 
  Plus, 
  Search, 
  FileText, 
  Video,
  Trash2, 
  Edit3, 
  X, 
  Loader2,
  Database,
  Link as LinkIcon,
  ChevronDown,
  FileCode,
  Globe,
  Download,
  AlertCircle,
  BookOpen,
  FileText as FileIcon,
  PlayCircle
} from "lucide-react";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc,
  setDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

interface Subject {
  id: string;
  name: string;
}

interface Material {
  id: string;
  title: string;
  description: string;
  url: string;
  subjectId: string;
  type: string; // 'pdf' | 'link' | 'docx' | 'youtube' | 'reading'
  content?: string; // Markdown content for reading lessons
  createdAt: { toDate: () => Date };
}

type MaterialCategory = 'all' | 'video' | 'document' | 'reading';

export default function MaterialsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("");
  
  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("link");
  const [content, setContent] = useState(""); // Markdown content
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsingWord, setIsParsingWord] = useState(false);
  const [activeTab, setActiveTab] = useState<MaterialCategory>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch subjects and materials
  useEffect(() => {
    const qSub = query(collection(db, "subjects"), orderBy("name", "asc"));
    const unsubSub = onSnapshot(qSub, (snapshot) => {
      setSubjects(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    });

    const qMat = query(collection(db, "materials"), orderBy("createdAt", "desc"));
    const unsubMat = onSnapshot(qMat, (snapshot) => {
      setMaterials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Material)));
      setLoading(false);
    });

    return () => {
      unsubSub();
      unsubMat();
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setSubjectId("");
    setUrl("");
    setType("link");
    setContent("");
  };

  const handleOpenEdit = (m: Material) => {
    setEditingId(m.id);
    setTitle(m.title);
    setDescription(m.description);
    setSubjectId(m.subjectId);
    setUrl(m.url || "");
    setType(m.type);
    setContent(m.content || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subjectId || !url.trim()) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "materials", editingId), {
          title,
          description,
          subjectId,
          url: type === 'reading' ? "" : url,
          type,
          content: type === 'reading' ? content : "",
          updatedAt: serverTimestamp(),
        });
        toast.success("Cập nhật tài liệu thành công!");
      } else {
        await addDoc(collection(db, "materials"), {
          title,
          description,
          subjectId,
          url: type === 'reading' ? "" : url,
          type,
          content: type === 'reading' ? content : "",
          createdAt: serverTimestamp(),
        });
        toast.success("Thêm tài liệu thành công!");
      }

      // Notify system update
      await setDoc(doc(db, "system_metadata", "updates"), { 
        lastUpdated: serverTimestamp() 
      }, { merge: true });

      setIsModalOpen(false);
      resetForm();
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("Error saving material:", error);
      toast.error(`Lỗi: ${error.message || "Đã có lỗi xảy ra"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWordUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      toast.error("Vui lòng chọn file định dạng .docx!");
      return;
    }

    setIsParsingWord(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        
        // Step 1: Convert DOCX to HTML using mammoth
        const result = await mammoth.convertToHtml({ arrayBuffer });
        
        if (result.value) {
          // Step 2: Convert HTML to Markdown using Turndown
          const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced'
          });
          
          const markdownContent = turndownService.turndown(result.value);
          setContent(markdownContent);
          
          // Auto-set title if empty
          if (!title.trim()) {
            // Extract first line as title if it looks like a header
            const firstLine = markdownContent.split('\n')[0].replace(/^#+\s*/, '').trim();
            if (firstLine) setTitle(firstLine);
          }
          
          toast.success("Đã chuyển đổi file Word (via HTML) thành công!");
        } else {
          toast.error("Không tìm thấy nội dung trong file Word.");
        }
        
        // Clear value for next selection
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (e: unknown) {
        const err = e as { message?: string };
        console.error("Word conversion error:", err);
        toast.error("Lỗi khi đọc file Word: " + (err.message || "Định dạng file không hỗ trợ hoặc bị hỏng"));
      } finally {
        setIsParsingWord(false);
      }
    };

    reader.onerror = () => {
      toast.error("Lỗi khi đọc file!");
      setIsParsingWord(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) {
      try {
        await deleteDoc(doc(db, "materials", id));
        
        // Notify system update
        await setDoc(doc(db, "system_metadata", "updates"), { 
          lastUpdated: serverTimestamp() 
        }, { merge: true });

        toast.success("Đã xóa tài liệu.");
      } catch (error) {
        console.error("Error deleting material:", error);
      }
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !selectedSubjectFilter || m.subjectId === selectedSubjectFilter;
    
    let matchesTab = true;
    if (activeTab === 'video') matchesTab = m.type === 'youtube';
    else if (activeTab === 'document') matchesTab = ['pdf', 'docx', 'link'].includes(m.type);
    else if (activeTab === 'reading') matchesTab = m.type === 'reading';

    return matchesSearch && matchesSubject && matchesTab;
  });

  const getBadgeStyles = (type: string) => {
    switch (type) {
      case 'youtube': return "bg-red-500/10 text-red-500 border-red-500/20";
      case 'reading': return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case 'pdf': return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'youtube': return "Video";
      case 'reading': return "Bài đọc";
      case 'pdf': return "PDF";
      case 'docx': return "Word";
      default: return "Link";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Thư viện <span className="bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] bg-clip-text text-transparent">Tài liệu</span>
          </h1>
          <p className="text-slate-400 mt-1">Quản lý sách, tài liệu học tập và file download cho học viên.</p>
        </div>
        
        <button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] px-6 py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-[#6c5ce7]/20"
        >
          <Plus size={20} />
          <span>Thêm tài liệu</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex p-1.5 bg-white/5 border border-white/5 rounded-2xl w-fit">
        {[
          { id: 'all', label: 'Tất cả', icon: Database },
          { id: 'video', label: 'Video', icon: PlayCircle },
          { id: 'document', label: 'Tài liệu', icon: FileIcon },
          { id: 'reading', label: 'Bài đọc', icon: BookOpen },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as MaterialCategory)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-[#6c5ce7] text-white shadow-lg shadow-[#6c5ce7]/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Tìm kiếm tài liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-white/5 bg-[#10101f] py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-[#6c5ce7]/50 focus:ring-4 focus:ring-[#6c5ce7]/5 transition-all"
          />
        </div>
        <div className="relative w-full sm:w-64">
           <Database className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6c5ce7]" />
           <select 
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="w-full rounded-2xl border border-white/5 bg-[#10101f] py-4 pl-12 pr-10 text-sm text-white outline-none focus:border-[#6c5ce7]/50 appearance-none cursor-pointer"
           >
              <option value="">Tất cả môn học</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
           </select>
           <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#6c5ce7]" />
        </div>
      ) : filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredMaterials.map((m) => {
            const subjectName = subjects.find(s => s.id === m.subjectId)?.name || "Unknown";
            return (
              <div 
                key={m.id}
                className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-[#10101f] border border-white/5 p-6 hover:border-[#6c5ce7]/30 transition-all duration-300"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-[#6c5ce7]/10 group-hover:text-[#6c5ce7] transition-all">
                    {m.type === 'pdf' ? <FileText size={24} /> : m.type === 'docx' ? <FileCode size={24} /> : m.type === 'youtube' ? <Video size={24} className="text-red-500" /> : <LinkIcon size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white group-hover:text-[#aca3ff] transition-colors">{m.title}</h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getBadgeStyles(m.type)}`}>
                        {getTypeName(m.type)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">{subjectName}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-700" />
                      <p className="text-sm text-slate-400 line-clamp-1">{m.description || "Không có mô tả."}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  {m.type !== 'reading' && (
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="p-3 text-slate-400 hover:text-[#00cec9] hover:bg-[#00cec9]/10 rounded-xl transition-all flex items-center gap-2 text-sm bg-white/5">
                      <Download size={16} /> <span className="sm:hidden lg:inline">Mở tài liệu</span>
                    </a>
                  )}
                  <button onClick={() => handleOpenEdit(m)} className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="p-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-80 rounded-2xl border-2 border-dashed border-white/5 bg-[#10101f]/50">
          <AlertCircle size={32} className="text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white">Chưa có tài liệu nào</h3>
          <p className="text-slate-500 mt-1 text-sm text-center px-4">Bấm &quot;Thêm tài liệu mới&quot; để bổ sung vào thư viện.</p>
        </div>
      )}

      {/* Modal Tool */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a14]/70 backdrop-blur-md p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-[#10101f] border border-white/10 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white">{editingId ? "Cập nhật tài liệu" : "Thêm tài liệu mới"}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-2 hover:bg-white/5 text-slate-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Tiêu đề tài liệu <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ví dụ: Giáo trình Toán Cao Cấp PDF..."
                    className="w-full rounded-xl border border-white/5 bg-black/40 py-3.5 px-4 text-sm text-white outline-none focus:border-[#6c5ce7]/50 focus:bg-black transition-all"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Môn học <span className="text-red-500">*</span></label>
                    <select 
                      required
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full rounded-xl border border-white/5 bg-black/40 py-3.5 px-4 text-sm text-white outline-none focus:border-[#6c5ce7]/50 focus:bg-black transition-all"
                    >
                      <option value="">Chọn môn học</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Loại file</label>
                    <select 
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full rounded-xl border border-white/5 bg-black/40 py-3.5 px-4 text-sm text-white outline-none focus:border-[#6c5ce7]/50 focus:bg-black transition-all"
                    >
                      <option value="link">Link trang web</option>
                      <option value="youtube">Video YouTube</option>
                      <option value="reading">Bài đọc (Markdown)</option>
                      <option value="pdf">Tài liệu PDF</option>
                      <option value="docx">Văn bản Word</option>
                    </select>
                  </div>
                </div>

                {type !== 'reading' ? (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Đường dẫn tài liệu (URL) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input 
                        type="url" 
                        required
                        placeholder="https://drive.google.com/..."
                        className="w-full rounded-xl border border-white/5 bg-black/40 py-3.5 pl-11 pr-4 text-sm text-[#00cec9] outline-none focus:border-[#00cec9]/50 focus:bg-black transition-all"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 px-1 italic">Mẹo: Dán link Google Drive chia sẻ ở chế độ &quot;Bất kỳ ai có liên kết&quot;.</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Nội dung bài viết (Markdown) <span className="text-red-500">*</span></label>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isParsingWord}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-[#00cec9] uppercase tracking-tighter hover:text-white transition-colors disabled:opacity-50"
                      >
                        {isParsingWord ? <Loader2 size={12} className="animate-spin" /> : <FileCode size={12} />}
                        <span>{isParsingWord ? "Đang xử lý..." : "Nhập từ file Word (.docx)"}</span>
                      </button>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".docx"
                        onChange={handleWordUpload}
                      />
                    </div>
                    <textarea 
                      required
                      placeholder="# Tiêu đề bài viết... &#10;&#10;Nội dung bài đọc hỗ trợ Markdown tại đây..."
                      rows={10}
                      className="w-full rounded-xl border border-white/5 bg-black/40 py-3.5 px-4 text-sm text-white outline-none focus:border-[#6c5ce7]/50 focus:bg-black transition-all font-mono"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-500 mt-2 px-1 italic">Hỗ trợ định dạng tiêu đề (#), danh sách (-), in đậm (**)...</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Mô tả ngắn</label>
                  <textarea 
                    rows={2}
                    placeholder="Mô tả nội dung tài liệu này giúp gì cho học viên..."
                    className="w-full rounded-xl border border-white/5 bg-black/40 py-3.5 px-4 text-sm text-white outline-none focus:border-[#6c5ce7]/50 focus:bg-black transition-all resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl bg-white/5 border border-white/5 py-3.5 text-sm font-bold text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#6c5ce7]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
                  <span>{isSubmitting ? "Đang xử lý..." : editingId ? "Cập nhật tài liệu" : "Xác nhận thêm"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
