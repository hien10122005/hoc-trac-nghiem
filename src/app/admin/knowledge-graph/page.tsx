"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Connection,
  Edge,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  getDocs,
  where
} from "firebase/firestore";
import { MaterialData } from "@/types/material";
import { KnowledgeMap, KnowledgeNode } from "@/types/knowledgeGraph";
import { 
  Brain, 
  Save, 
  Loader2, 
  RefreshCw, 
  Database, 
  ChevronRight, 
  Layers,
  MousePointer2,
  GitBranch
} from "lucide-react";
import toast from "react-hot-toast";

interface Subject {
  id: string;
  name: string;
}

export default function KnowledgeGraphAdmin() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load subjects
  useEffect(() => {
    const q = query(collection(db, "subjects"), orderBy("name", "asc"));
    return onSnapshot(q, (snapshot) => {
      setSubjects(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    });
  }, []);

  // Fetch data when subject selected
  useEffect(() => {
    if (!selectedSubject) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Fetch ALL materials for this subject
        const qMat = query(collection(db, "materials"), where("subjectId", "==", selectedSubject));
        const matSnap = await getDocs(qMat);
        const mats = matSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaterialData));
        setMaterials(mats);

        // 2. Fetch existing map
        const mapDoc = await getDoc(doc(db, "knowledge_maps", selectedSubject));
        
        if (mapDoc.exists()) {
          const mapData = mapDoc.data() as KnowledgeMap;
          setNodes(mapData.nodes.map(n => ({
            id: n.id,
            position: n.position || { x: Math.random() * 400, y: Math.random() * 400 },
            data: { label: n.label, type: n.type, status: n.status || 'unlocked' },
            style: getNodeStyle(n.status || 'unlocked')
          })) as any);
          setEdges(mapData.edges.map(e => ({
            ...e,
            animated: true,
            style: { stroke: '#6c5ce7', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#6c5ce7' }
          })) as any);
        } else {
          // Default nodes if no map exists
          const defaultNodes = mats.map((m, index) => ({
            id: m.id,
            position: { x: 100, y: index * 100 },
            data: { label: m.title, type: m.type, status: 'unlocked' },
            style: getNodeStyle('unlocked')
          }));
          setNodes(defaultNodes as any);
          setEdges([]);
        }
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải dữ liệu môn học.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedSubject, setNodes, setEdges]);

  const getNodeStyle = (status: string) => ({
    background: status === 'completed' ? 'rgba(0, 206, 201, 0.1)' : 'rgba(108, 92, 231, 0.05)',
    color: status === 'completed' ? '#00cec9' : '#fff',
    border: `1px solid ${status === 'completed' ? '#00cec9' : '#6c5ce7'}`,
    borderRadius: '12px',
    padding: '10px',
    fontSize: '12px',
    fontWeight: '700',
    width: 180,
    textAlign: 'center',
    backdropFilter: 'blur(10px)'
  });

  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: '#6c5ce7', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6c5ce7' }
    }, eds));
  }, [setEdges]);

  const handleAutoConnect = async () => {
    if (!selectedSubject || materials.length === 0) {
      toast.error("Vui lòng chọn môn học có tài liệu.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const subjectName = subjects.find(s => s.id === selectedSubject)?.name;
      const res = await fetch("/api/ai/generate-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectName, materials })
      });
      
      const data = await res.json();
      if (data.edges) {
        const aiEdges = data.edges.map((e: any, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          source: e.source,
          target: e.target,
          label: e.label,
          animated: true,
          style: { stroke: '#6c5ce7', strokeWidth: 2 },
          labelStyle: { fill: '#94a3b8', fontSize: 9, fontWeight: 600 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6c5ce7' }
        }));
        setEdges(aiEdges);
        toast.success(`AI đã tìm thấy ${aiEdges.length} liên kết logic!`);
      } else {
        throw new Error(data.error || "Không có kết quả");
      }
    } catch (err: any) {
      toast.error(`AI Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedSubject) return;
    setLoading(true);
    try {
      const mapData = {
        subjectId: selectedSubject,
        nodes: nodes.map(n => ({
          id: n.id,
          label: (n.data as any).label,
          type: (n.data as any).type,
          status: (n.data as any).status || 'unlocked',
          position: n.position
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label || ""
        })),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, "knowledge_maps", selectedSubject), mapData);
      toast.success("Đã cập nhật hệ thống sơ đồ tri thức!");
    } catch (err) {
      toast.error("Lỗi khi lưu dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">
            AI <span className="bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] bg-clip-text text-transparent">Graph Creator</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Xây dựng mạng lưới tri thức tự động bằng trí tuệ nhân tạo.</p>
        </div>

        <div className="flex items-center gap-3">
           <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-[#10101f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#6c5ce7] transition-all min-w-[200px]"
           >
              <option value="">Chọn môn học...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
           </select>

           <button 
              onClick={handleAutoConnect}
              disabled={!selectedSubject || isGenerating || loading}
              className="flex items-center gap-2 bg-white/5 hover:bg-[#6c5ce7]/20 border border-white/10 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
           >
              {isGenerating ? <RefreshCw size={18} className="animate-spin text-[#6c5ce7]" /> : <Brain size={18} className="text-[#6c5ce7]" />}
              <span>AI Auto-Connect</span>
           </button>

           <button 
              onClick={handleSave}
              disabled={!selectedSubject || loading}
              className="flex items-center gap-2 bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] px-6 py-2.5 rounded-xl text-sm font-black text-white shadow-lg shadow-[#6c5ce7]/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
           >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>Lưu sơ đồ</span>
           </button>
        </div>
      </div>

      <div className="flex-1 rounded-3xl border border-white/5 bg-[#05050f] overflow-hidden relative shadow-inner">
        {selectedSubject ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            colorMode="dark"
          >
            <Background color="#1a1a2e" gap={20} />
            <Controls className="!bg-[#10101f] !border-white/10 !fill-white" />
            <MiniMap 
                nodeColor="#6c5ce7" 
                maskColor="rgba(0,0,0,0.7)" 
                className="!bg-[#10101f] !border-white/10"
            />
            
            <Panel position="top-right" className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/5 m-4">
               <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                 <MousePointer2 size={10} /> Thao tác Admin
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] text-slate-400">• Kéo node để sắp xếp vị trí bài học.</p>
                 <p className="text-[10px] text-slate-400">• Quay vòng tròn ở các node để nối link mới.</p>
                 <p className="text-[10px] text-slate-400">• Click vào cạnh để xóa hoặc đổi label.</p>
               </div>
            </Panel>
          </ReactFlow>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center opacity-40">
             <GitBranch size={48} className="text-slate-600 mb-4" />
             <p className="text-slate-500 font-medium">Chọn một môn học phía trên để bắt đầu vẽ đồ thị.</p>
          </div>
        )}
      </div>
    </div>
  );
}
