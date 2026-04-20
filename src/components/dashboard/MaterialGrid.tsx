"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Play,
  PlayCircle,
  BookOpen,
  FileIcon,
  DownloadCloud,
  ExternalLink,
  Loader2,
  AlertCircle
} from "lucide-react";
import VideoPlayerModal from "./VideoPlayerModal";
import MaterialContentModal from "./MaterialContentModal";

interface Material {
  id: string;
  title: string;
  description: string;
  url: string;
  subjectId: string;
  type: string;
  content?: string;
}

type MaterialCategory = 'all' | 'video' | 'document' | 'reading';

interface MaterialGridProps {
  subjectId: string | null;
  subjectName: string | null;
  onBack: () => void;
}

export default function MaterialGrid({ subjectId, subjectName, onBack }: MaterialGridProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Material | null>(null);
  const [selectedReading, setSelectedReading] = useState<Material | null>(null);
  const [activeTab, setActiveTab] = useState<MaterialCategory>('all');

  useEffect(() => {
    if (!subjectId) return;

    const q = query(collection(db, "materials"), where("subjectId", "==", subjectId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMaterials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Material)));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [subjectId]);

  const filteredMaterials = materials.filter(m => {
    if (activeTab === 'all') return true;
    if (activeTab === 'video') return m.type === 'youtube';
    if (activeTab === 'document') return ['pdf', 'docx', 'link'].includes(m.type);
    if (activeTab === 'reading') return m.type === 'reading';
    return true;
  });

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'youtube': return <PlayCircle size={24} className="text-red-500" />;
      case 'reading': return <BookOpen size={24} className="text-emerald-500" />;
      case 'pdf': return <FileIcon size={24} className="text-blue-500" />;
      default: return <ExternalLink size={24} className="text-slate-400" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'youtube': return "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white";
      case 'reading': return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white";
      default: return "bg-white/5 text-slate-300 border-white/5 hover:bg-[#00cec9]/20 hover:text-white hover:border-[#00cec9]/30";
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6c5ce7]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-bold text-[#6c5ce7] hover:text-[#aca3ff] transition-colors flex items-center gap-1 mb-1"
          >
            ← QUAY LẠI DANH SÁCH
          </button>
          <h2 className="text-2xl font-bold text-white">Tài liệu: {subjectName}</h2>
        </div>

        {/* Category Tabs */}
        <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl shrink-0">
          {[
            { id: 'all', label: 'Tất cả', icon: PlayCircle },
            { id: 'video', label: 'Videos', icon: Play },
            { id: 'reading', label: 'Bài đọc', icon: BookOpen },
            { id: 'document', label: 'Tải về', icon: FileIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MaterialCategory)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                  ? "bg-white/10 text-white shadow-lg"
                  : "text-slate-500 hover:text-slate-300"
                }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredMaterials.map((m) => (
            <div
              key={m.id}
              className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-[#10101f] to-[#16162d] border border-white/5 p-6 hover:border-[#6c5ce7]/30 transition-all duration-300"
            >
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all shadow-inner">
                  {getMaterialIcon(m.type)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#aca3ff] transition-colors">{m.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-1">{m.description || "Tài liệu học tập hỗ trợ môn học."}</p>
                </div>
              </div>

              <div className="w-full sm:w-auto">
                {m.type === 'youtube' ? (
                  <button
                    onClick={() => setSelectedVideo(m)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all text-sm font-bold w-full justify-center border ${getActionColor(m.type)}`}
                  >
                    <Play size={18} fill="currentColor" />
                    <span>Xem Video</span>
                  </button>
                ) : m.type === 'reading' ? (
                  <button
                    onClick={() => setSelectedReading(m)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all text-sm font-bold w-full justify-center border ${getActionColor(m.type)}`}
                  >
                    <BookOpen size={18} />
                    <span>Đọc bài học</span>
                  </button>
                ) : (
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-slate-300 hover:bg-[#00cec9]/20 hover:text-white hover:border-[#00cec9]/30 transition-all text-sm font-bold w-full justify-center"
                  >
                    <DownloadCloud size={18} />
                    <span>Tải tài liệu</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 rounded-[2rem] border-2 border-dashed border-white/5 bg-[#10101f]/50">
          <AlertCircle size={32} className="text-slate-700 mb-4" />
          <h3 className="text-lg font-medium text-white">Trống trải quá...</h3>
          <p className="text-slate-500 mt-1 text-sm text-center">Chưa có {activeTab === 'all' ? 'tài liệu' : activeTab} nào trong danh mục này.</p>
        </div>
      )}

      {/* Modals */}
      <VideoPlayerModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        videoUrl={selectedVideo?.url || ""}
        videoTitle={selectedVideo?.title || ""}
      />

      <MaterialContentModal
        isOpen={!!selectedReading}
        onClose={() => setSelectedReading(null)}
        title={selectedReading?.title || ""}
        content={selectedReading?.content || ""}
        materialId={selectedReading?.id || ""}
      />
    </div>
  );
}
