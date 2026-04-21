"use client";

import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  MarkerType,
  Node
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useRouter } from 'next/navigation';
import { getKnowledgeMap } from '@/lib/knowledge';
import { KnowledgeNode } from '@/types/knowledgeGraph';
import { Loader2, Info, X, MapPin, Zap, ChevronRight, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";

interface Props {
  subjectId: string;
  isStudentView?: boolean;
  onSelectMaterial?: (id: string) => void;
}

/**
 * KnowledgeGraphBase: Hiển thị sơ đồ tri thức nâng cao.
 * Phong cách: Glassmorphism & Dark Editorial.
 * Hỗ trợ tương tác: Click để học, Zoom/Pan.
 */
export default function KnowledgeGraphBase({ subjectId, isStudentView = false, onSelectMaterial }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<any | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!subjectId) return;
      setLoading(true);
      try {
        // 0. Fetch User Progress (Parallel)
        let completedIds = new Set<string>();
        let inProgressIds = new Set<string>();

        if (isStudentView && user) {
          // Fetch Quiz Results for this subject
          const qResults = query(
            collection(db, "quiz_results"), 
            where("userId", "==", user.uid),
            where("subjectId", "==", subjectId)
          );
          const resSnap = await getDocs(qResults);
          resSnap.docs.forEach(d => {
            const data = d.data();
            if (data.score >= 80) completedIds.add(data.topicId || data.level?.toString());
          });

          // Fetch Notes as proxy for "In Progress"
          const notesSnap = await getDocs(collection(db, "user_stats", user.uid, "notes"));
          notesSnap.docs.forEach(d => inProgressIds.add(d.id));
        }

        const data = await getKnowledgeMap(subjectId);
        if (data && data.nodes && data.nodes.length > 0) {
          // 1. Chuyển đổi Nodes
          const rfNodes: Node[] = data.nodes.map((n: KnowledgeNode) => {
            let status = n.status || 'locked';
            
            if (isStudentView) {
              if (completedIds.has(n.id)) status = 'completed';
              else if (inProgressIds.has(n.id)) status = 'unlocked'; // "Vàng"
              else status = 'locked'; // "Xám"
            }

            return {
              id: n.id,
              position: n.position || { x: 0, y: 0 },
              data: { 
                label: n.label, 
                description: n.description,
                status: status, 
                type: n.type 
              },
              style: getNodeStyle(status),
              className: status === 'completed' ? 'node-glow-completed' : '',
            };
          });

          const rfEdges: Edge[] = data.edges.map((e) => {
            const sourceNode = data.nodes.find(node => node.id === e.source);
            const isCompleted = sourceNode?.status === 'completed';
            const isLocked = sourceNode?.status === 'locked';

            return {
              id: e.id,
              source: e.source,
              target: e.target,
              label: e.label,
              type: 'smoothstep',
              animated: !isLocked,
              style: { 
                stroke: isCompleted ? '#00cec9' : isLocked ? 'rgba(255,255,255,0.05)' : '#6c5ce7', 
                strokeWidth: isCompleted ? 3 : 2,
                opacity: isLocked ? 0.3 : 1
              },
              labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 700 },
              markerEnd: { 
                type: MarkerType.ArrowClosed, 
                color: isCompleted ? '#00cec9' : isLocked ? '#1e1e2e' : '#6c5ce7' 
              }
            };
          });

          setNodes(rfNodes);
          setEdges(rfEdges);
        }
      } catch (err) {
        console.error("Lỗi khi tải sơ đồ:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subjectId, setNodes, setEdges]);

  // Hàm định nghĩa Style Glassmorphism cho từng trạng thái Node
  const getNodeStyle = (status: string) => {
    const base: React.CSSProperties = {
      borderRadius: '20px',
      padding: '16px 24px',
      fontSize: '14px',
      fontWeight: '800',
      width: 220,
      textAlign: 'center',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(16px)',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60px'
    };

    switch (status) {
      case 'completed':
        return {
          ...base,
          background: 'rgba(0, 206, 201, 0.12)',
          color: '#00cec9',
          borderColor: 'rgba(0, 206, 201, 0.4)',
          boxShadow: '0 0 30px rgba(0, 206, 201, 0.15), inset 0 0 15px rgba(0, 206, 201, 0.05)'
        };
      case 'unlocked':
        return {
          ...base,
          background: 'rgba(108, 92, 231, 0.12)',
          color: '#aca3ff',
          borderColor: 'rgba(108, 92, 231, 0.4)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)'
        };
      case 'locked':
      default:
        return {
          ...base,
          background: 'rgba(255, 255, 255, 0.02)',
          color: '#475569',
          borderColor: 'rgba(255, 255, 255, 0.05)',
          opacity: 0.5,
          cursor: 'not-allowed'
        };
    }
  };

  const onNodeClick = useCallback((_: any, node: Node) => {
    if (isStudentView) {
      setSelectedNodeDetails(node.data ? { ...node.data, id: node.id } : null);
      return;
    }

    const status = node.data?.status;
    if (status === 'locked') return;
    
    // Điều hướng đến bài học cho Admin hoặc chế độ cũ
    router.push(`/dashboard/library?materialId=${node.id}`);
  }, [isStudentView, router]);

  if (loading) {
    return (
      <div className="h-[500px] w-full flex flex-col items-center justify-center bg-[#05050f]/50 backdrop-blur-xl rounded-3xl border border-white/5 animate-pulse">
        <Loader2 className="h-10 w-10 animate-spin text-[#6c5ce7] mb-3" />
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Đang đồng bộ sơ đồ trí tuệ...</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center bg-[#05050f]/50 rounded-3xl border border-white/5 border-dashed">
        <Info className="h-8 w-8 text-slate-600 mb-2" />
        <p className="text-sm text-slate-500 font-medium italic">Chưa có sơ đồ tri thức cho môn học này.</p>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full rounded-3xl border border-white/10 bg-black/20 backdrop-blur-md overflow-hidden relative shadow-2xl">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        style={{ backgroundColor: '#10101f' }}
        minZoom={0.2}
        maxZoom={2}
        nodesDraggable={!isStudentView}
        nodesConnectable={!isStudentView}
        elementsSelectable={true}
      >
        <Background color="#1a1a2e" gap={28} size={1} />
        <Controls 
           className="!bg-[#1a1a2e]/80 !border-white/10 !fill-white !rounded-xl overflow-hidden !left-6 !bottom-6"
           showInteractive={false}
        />
        <MiniMap 
          nodeColor={(node: Node) => {
            if (node.data?.status === 'completed') return '#00cec9';
            if (node.data?.status === 'unlocked') return '#6c5ce7';
            return '#1a1a2e';
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
          className="!bg-[#0a0a14]/80 !border-white/10 !rounded-2xl !right-6 !bottom-6"
        />

        {/* Legend */}
        <div className="absolute top-6 left-6 flex flex-col gap-2 z-10 bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/5">
           <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#00cec9] shadow-[0_0_10px_rgba(0,206,201,0.5)]" />
              <span className="text-[10px] text-white font-bold uppercase tracking-wider">Đã hoàn thành</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#6c5ce7]" />
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Sẵn sàng học</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-slate-700 opacity-50" />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{isStudentView ? 'Chưa tương tác' : 'Chưa mở khóa'}</span>
           </div>
        </div>

        {/* Student Detail Sidebar */}
        <AnimatePresence>
          {selectedNodeDetails && (
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              className="absolute top-0 right-0 h-full w-full sm:w-80 md:w-96 bg-[#0a0a14]/95 backdrop-blur-2xl border-l border-white/10 z-50 p-8 shadow-2xl flex flex-col"
            >
              <button 
                onClick={() => setSelectedNodeDetails(null)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X size={20} />
              </button>

              <div className="mt-10 space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                    selectedNodeDetails.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                    selectedNodeDetails.status === 'unlocked' ? 'bg-[#6c5ce7]/10 text-[#6c5ce7]' : 'bg-slate-500/10 text-slate-500'
                  }`}>
                    {selectedNodeDetails.status === 'completed' ? <Zap size={24} /> : <BookOpen size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white leading-tight">{selectedNodeDetails.label}</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${
                      selectedNodeDetails.status === 'completed' ? 'text-emerald-500' :
                      selectedNodeDetails.status === 'unlocked' ? 'text-[#aca3ff]' : 'text-slate-500'
                    }`}>
                      {selectedNodeDetails.status === 'completed' ? 'Đã thành thạo' : 
                       selectedNodeDetails.status === 'unlocked' ? 'Đang học tập' : 'Chưa bắt đầu'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                   <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <Info size={12} />
                     Mô tả bài học
                   </h4>
                   <p className="text-sm text-slate-400 leading-relaxed">
                     {selectedNodeDetails.description || "Nội dung bài học này đang được AI cập nhật thông tin chi tiết..."}
                   </p>
                </div>

                {selectedNodeDetails.status === 'completed' && (
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
                    <Zap className="text-emerald-500" size={18} />
                    <p className="text-xs text-emerald-500/80 font-medium">Bạn đã vượt qua bài kiểm tra kiến thức của chương này với kết quả xuất sắc!</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-white/5 space-y-3">
                <button
                  onClick={() => {
                    if (onSelectMaterial) onSelectMaterial(selectedNodeDetails.id);
                    setSelectedNodeDetails(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-[#6c5ce7]/20"
                >
                  <span>Bắt đầu học ngay</span>
                  <ChevronRight size={18} />
                </button>
                <p className="text-[10px] text-center text-slate-500">Nhấn để mở tài liệu hoặc video bài giảng tương ứng.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ReactFlow>

      <style jsx global>{`
        .react-flow__edge-path {
          filter: drop-shadow(0 0 5px rgba(108, 92, 231, 0.2));
        }
        .node-glow-completed {
          animation: node-pulse 3s infinite ease-in-out;
        }
        @keyframes node-pulse {
          0% { filter: drop-shadow(0 0 5px rgba(0, 206, 201, 0.2)); }
          50% { filter: drop-shadow(0 0 15px rgba(0, 206, 201, 0.5)); }
          100% { filter: drop-shadow(0 0 5px rgba(0, 206, 201, 0.2)); }
        }
      `}</style>
    </div>
  );
}
