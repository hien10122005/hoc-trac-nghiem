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
import { Loader2, Info } from 'lucide-react';

interface Props {
  subjectId: string;
}

/**
 * KnowledgeGraphBase: Hiển thị sơ đồ tri thức nâng cao.
 * Phong cách: Glassmorphism & Dark Editorial.
 * Hỗ trợ tương tác: Click để học, Zoom/Pan.
 */
export default function KnowledgeGraphBase({ subjectId }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (!subjectId) return;
      setLoading(true);
      try {
        const data = await getKnowledgeMap(subjectId);
        if (data && data.nodes && data.nodes.length > 0) {
          // 1. Chuyển đổi Nodes
          const rfNodes = data.nodes.map((n: KnowledgeNode) => ({
            id: n.id,
            position: n.position || { x: 0, y: 0 },
            data: { label: n.label, status: n.status, type: n.type },
            style: getNodeStyle(n.status),
            // Custom data for better styling
            className: n.status === 'completed' ? 'node-glow-completed' : '',
          }));

          // 2. Chuyển đổi Edges
          const rfEdges = data.edges.map((e) => {
            const sourceNode = data.nodes.find(node => node.id === e.source);
            const isCompleted = sourceNode?.status === 'completed';
            const isLocked = sourceNode?.status === 'locked';

            return {
              id: e.id,
              source: e.source,
              target: e.target,
              label: e.label,
              type: 'smoothstep', // Đường nối mềm mại
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

          setNodes(rfNodes as any);
          setEdges(rfEdges as any);
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
    const base = {
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
    const status = node.data?.status;
    if (status === 'locked') return;
    
    // Điều hướng đến bài học (ID của node tương ứng với ID của Material)
    router.push(`/dashboard/library?materialId=${node.id}`);
  }, [router]);

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
        colorMode="dark"
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color="#10101f" gap={28} size={1} />
        <Controls 
           className="!bg-[#10101f]/80 !border-white/10 !fill-white !rounded-xl overflow-hidden !left-6 !bottom-6"
           showInteractive={false}
        />
        <MiniMap 
          nodeColor={(node: any) => {
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
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Chưa mở khóa</span>
           </div>
        </div>
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
