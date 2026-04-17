"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  BookOpen, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  X, 
  Loader2,
  Book,
  Code,
  Globe,
  Atom,
  Calculator,
  Music,
  Palette,
  Microscope,
  Dna,
  Layers,
  Cpu,
  Laptop
} from "lucide-react";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Interface cho Môn học
interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  slug: string;
  createdAt: any;
}

// Danh sách Icon Lucide hỗ trợ
const AVAILABLE_ICONS = [
  { name: "Book", icon: Book },
  { name: "Code", icon: Code },
  { name: "Globe", icon: Globe },
  { name: "Atom", icon: Atom },
  { name: "Calculator", icon: Calculator },
  { name: "Music", icon: Music },
  { name: "Palette", icon: Palette },
  { name: "Microscope", icon: Microscope },
  { name: "Dna", icon: Dna },
  { name: "Layers", icon: Layers },
  { name: "Cpu", icon: Cpu },
  { name: "Laptop", icon: Laptop },
];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Book");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch subjects real-time
  useEffect(() => {
    const q = query(collection(db, "subjects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subjectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subject[];
      setSubjects(subjectsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle Add Subject
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      await addDoc(collection(db, "subjects"), {
        name,
        description,
        icon: selectedIcon,
        slug,
        createdAt: serverTimestamp(),
      });
      
      // Reset & Close
      setName("");
      setDescription("");
      setSelectedIcon("Book");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding subject:", error);
      alert("Đã có lỗi xảy ra khi thêm môn học.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Subject
  const handleDeleteSubject = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa môn học "${name}"? Thao tác này không thể hoàn tác.`)) {
      try {
        await deleteDoc(doc(db, "subjects", id));
      } catch (error) {
        console.error("Error deleting subject:", error);
      }
    }
  };

  // Helper to render icon component
  const renderIcon = (iconName: string, size = 24, className = "") => {
    const IconComponent = AVAILABLE_ICONS.find(i => i.name === iconName)?.icon || BookOpen;
    return <IconComponent size={size} className={className} />;
  };

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header section with Stats overlap look */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Quản lý <span className="bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] bg-clip-text text-transparent">Môn học</span>
          </h1>
          <p className="text-slate-400 mt-1">Tạo và quản lý các danh mục môn học trong hệ thống ôn luyện.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#5b4bc4] px-5 py-3 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#6c5ce7]/30"
        >
          <div className="bg-white/20 rounded-lg p-1 group-hover:bg-white/30 transition-colors">
            <Plus size={18} />
          </div>
          <span>Tạo môn học mới</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Tìm kiếm môn học theo tên hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-white/5 bg-[#10101f] py-3.5 pl-12 pr-4 text-sm text-white outline-none focus:border-[#6c5ce7]/50 focus:ring-4 focus:ring-[#6c5ce7]/5 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5 text-slate-400 text-sm">
           <span className="font-semibold text-white">{filteredSubjects.length}</span> môn học
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#6c5ce7]" />
        </div>
      ) : filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSubjects.map((subject) => (
            <div 
              key={subject.id}
              className="group relative flex flex-col rounded-2xl bg-[#10101f] border border-white/5 hover:border-[#6c5ce7]/30 transition-all duration-500 overflow-hidden shadow-xl hover:-translate-y-1"
            >
              {/* Card Accent Glow */}
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] opacity-[0.03] blur-3xl group-hover:opacity-[0.1] transition-opacity duration-700" />
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="rounded-2xl bg-gradient-to-br from-[#6c5ce7]/20 to-[#00cec9]/20 p-4 border border-white/5 shadow-inner">
                    {renderIcon(subject.icon, 28, "text-[#ACA3FF]")}
                  </div>
                  <div className="relative">
                    <button className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white group-hover:text-[#ACA3FF] transition-colors line-clamp-1">
                    {subject.name}
                  </h3>
                  <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed min-h-[40px]">
                    {subject.description || "Chưa có mô tả cho môn học này."}
                  </p>
                </div>
              </div>

              <div className="mt-auto p-4 border-t border-white/5 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#6c5ce7] bg-[#6c5ce7]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                   Questions: 0
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDeleteSubject(subject.id, subject.name)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button className="p-2 text-slate-500 hover:text-[#00cec9] hover:bg-[#00cec9]/10 rounded-lg transition-all">
                    <Edit3 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-96 rounded-2xl border-2 border-dashed border-white/5 bg-[#10101f]/50">
          <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <BookOpen size={40} className="text-slate-600" />
          </div>
          <h3 className="text-xl font-semibold text-white">Chưa có môn học nào</h3>
          <p className="text-slate-500 mt-2 text-center max-w-sm px-6">
            Bắt đầu xây dựng hệ thống của bạn bằng cách thêm môn học đầu tiên.
          </p>
          <button 
             onClick={() => setIsModalOpen(true)}
             className="mt-8 flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-all"
          >
            <Plus size={18} />
            <span>Thêm môn học đầu tiên</span>
          </button>
        </div>
      )}

      {/* Add Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a14]/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div 
            className="w-full max-w-lg rounded-3xl bg-[#10101f] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 duration-300"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white">Thêm môn học mới</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-2 hover:bg-white/5 text-slate-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Tên môn học <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ví dụ: Toán cao cấp A1, Tiếng Anh B1..."
                    className="w-full rounded-xl border border-white/5 bg-[#0a0a14] py-3.5 px-4 text-sm text-white outline-none focus:border-[#6c5ce7]/50 focus:bg-black transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Mô tả (Không bắt buộc)</label>
                  <textarea 
                    rows={3}
                    placeholder="Giới thiệu ngắn gọn về môn học..."
                    className="w-full rounded-xl border border-white/5 bg-[#0a0a14] py-3.5 px-4 text-sm text-white outline-none focus:border-[#6c5ce7]/50 focus:bg-black transition-all resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4 px-1 text-center">Chọn biểu tượng hiển thị</label>
                  <div className="grid grid-cols-6 gap-3">
                    {AVAILABLE_ICONS.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setSelectedIcon(item.name)}
                        className={`flex h-12 w-full items-center justify-center rounded-xl border transition-all ${
                          selectedIcon === item.name 
                            ? "border-[#6c5ce7] bg-[#6c5ce7]/10 text-[#6c5ce7] shadow-[0_0_15px_rgba(108,92,231,0.2)]" 
                            : "border-white/5 bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300"
                        }`}
                      >
                        <item.icon size={20} />
                      </button>
                    ))}
                  </div>
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
                  className="flex-[2] rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#5b4bc4] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#6c5ce7]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  <span>{isSubmitting ? "Đang xử lý..." : "Xác nhận thêm môn"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
