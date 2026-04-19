"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Video, ExternalLink } from "lucide-react";
import { getYoutubeId } from "@/lib/youtube";

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  videoTitle: string;
}

export default function VideoPlayerModal({ isOpen, onClose, videoUrl, videoTitle }: VideoPlayerModalProps) {
  const videoId = getYoutubeId(videoUrl);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0a0a14]/90 backdrop-blur-xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl aspect-video rounded-3xl bg-[#10101f] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner">
                  <Video size={22} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-lg font-bold text-white line-clamp-1">{videoTitle}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Video Lesson • YouTube Player</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                 <a 
                   href={videoUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all hidden sm:flex"
                   title="Open on YouTube"
                 >
                   <ExternalLink size={20} />
                 </a>
                 <button 
                  onClick={onClose}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Video Content */}
            <div className="flex-1 bg-black relative flex items-center justify-center">
              {videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                  title={videoTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              ) : (
                <div className="text-center p-10">
                   <div className="h-16 w-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4 animate-pulse">
                      <Video size={32} />
                   </div>
                   <h4 className="text-lg font-bold text-white mb-2">Không thể phát video này</h4>
                   <p className="text-slate-500 text-sm max-w-xs">Đường dẫn YouTube không hợp lệ hoặc đã bị xóa.</p>
                </div>
              )}
            </div>
            
            {/* Footer / Info */}
            <div className="p-3 bg-white/[0.01] flex items-center justify-center">
                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    <span>Mẹo: Nhấn ESC để thoát chế độ xem video</span>
                 </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
