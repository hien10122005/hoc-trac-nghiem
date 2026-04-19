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
  FileText, 
  Download, 
  ExternalLink, 
  FileCode,
  AlertCircle,
  Loader2,
  Youtube,
  Play
} from "lucide-react";
import VideoPlayerModal from "./VideoPlayerModal";

interface Material {
  id: string;
  title: string;
  description: string;
  url: string;
  subjectId: string;
  type: string;
}

interface MaterialGridProps {
  subjectId: string | null;
  subjectName: string | null;
  onBack: () => void;
}

export default function MaterialGrid({ subjectId, subjectName, onBack }: MaterialGridProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Material | null>(null);

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
      </div>

      {materials.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {materials.map((m) => (
            <div 
              key={m.id}
              className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-[#10101f] border border-white/5 p-5 hover:border-[#00cec9]/30 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-[#00cec9]/10 group-hover:text-[#00cec9] transition-all">
                  {m.type === 'pdf' ? <FileText size={20} /> : m.type === 'docx' ? <FileCode size={20} /> : m.type === 'youtube' ? <Youtube size={20} className="text-red-500" /> : <ExternalLink size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-[#00cec9] transition-colors">{m.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-1">{m.description || "Tài liệu học tập hỗ trợ môn học."}</p>
                </div>
              </div>
              
              {m.type === 'youtube' ? (
                <button 
                  onClick={() => setSelectedVideo(m)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all text-sm font-bold w-full sm:w-auto justify-center"
                >
                  <Play size={16} fill="currentColor" />
                  <span>Xem Video</span>
                </button>
              ) : (
                <a 
                  href={m.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:bg-[#00cec9]/20 hover:text-white hover:border-[#00cec9]/30 transition-all text-sm font-medium w-full sm:w-auto justify-center"
                >
                  <Download size={16} />
                  <span>Mở tài liệu</span>
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-white/5 bg-[#10101f]/50">
          <AlertCircle size={32} className="text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white">Chưa có tài liệu</h3>
          <p className="text-slate-500 mt-1 text-sm">Vui lòng quay lại sau khi giáo viên bổ sung tài liệu cho môn này.</p>
        </div>
      )}
      {/* Video Player Modal */}
      <VideoPlayerModal 
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        videoUrl={selectedVideo?.url || ""}
        videoTitle={selectedVideo?.title || ""}
      />
    </div>
  );
}
