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
  Node,
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
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [rawText, setRawText] = useState("");

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
          const rfNodes: Node[] = mapData.nodes.map(n => ({
            id: n.id,
            position: n.position || { x: Math.random() * 400, y: Math.random() * 400 },
            data: { label: n.label, type: n.type, status: n.status || 'unlocked' },
            style: getNodeStyle(n.status || 'unlocked')
          }));
          const rfEdges: Edge[] = mapData.edges.map(e => ({
            ...e,
            animated: true,
            style: { stroke: '#6c5ce7', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#6c5ce7' }
          }));
          setNodes(rfNodes);
          setEdges(rfEdges);
        } else {
          // Default nodes if no map exists
          const defaultNodes: Node[] = mats.map((m, index) => ({
            id: m.id,
            position: { x: 100, y: index * 100 },
            data: { label: m.title, type: m.type, status: 'unlocked' },
            style: getNodeStyle('unlocked')
          }));
          setNodes(defaultNodes);
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

  const getNodeStyle = (status: string): React.CSSProperties => {
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
    return {
      ...base,
      background: status === 'completed' ? 'rgba(0, 206, 201, 0.1)' : 'rgba(108, 92, 231, 0.05)',
      color: status === 'completed' ? '#00cec9' : '#fff',
      borderColor: status === 'completed' ? '#00cec9' : '#6c5ce7',
      boxShadow: status === 'completed' ? '0 0 20px rgba(0, 206, 201, 0.1)' : 'none'
    };
  };

  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: '#6c5ce7', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6c5ce7' }
    }, eds));
  }, [setEdges]);

  const handleGenerateGraph = async () => {
    if (!selectedSubject) {
      toast.error("Vui lòng chọn môn học.");
      return;
    }
    if (activeTab === 'text' && !rawText.trim()) {
      toast.error("Vui lòng nhập nội dung văn bản.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const subjectName = subjects.find(s => s.id === selectedSubject)?.name;
      const res = await fetch("/api/ai/generate-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectName, rawContent: rawText })
      });
      
      const data = await res.json();
      if (data.nodes && data.edges) {
        // Map AI Nodes to ReactFlow Nodes
        const rfNodes: Node[] = data.nodes.map((n: any) => ({
          id: n.id,
          position: { x: n.x || Math.random() * 500, y: n.y || Math.random() * 500 },
          data: { label: n.label, description: n.description, status: 'unlocked' },
          style: getNodeStyle('unlocked')
        }));

        // Map AI Edges to ReactFlow Edges
        const rfEdges: Edge[] = data.edges.map((e: any) => ({
          id: e.id || `e-${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          label: e.label,
          animated: true,
          style: { stroke: '#6c5ce7', strokeWidth: 2 },
          labelStyle: { fill: '#94a3b8', fontSize: 9, fontWeight: 600 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6c5ce7' }
        }));

        setNodes(rfNodes);
        setEdges(rfEdges);
        toast.success(`AI đã tạo thành công ${rfNodes.length} nút kiến thức!`);
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
      // Clean and sanitize data for Firestore
      const sanitizedNodes = nodes.map(n => ({
        id: String(n.id),
        x: Number(n.position?.x) || 0,
        y: Number(n.position?.y) || 0,
        label: String((n.data as any)?.label || ""),
        description: String((n.data as any)?.description || ""),
        status: String((n.data as any)?.status || 'unlocked'),
        type: String((n.data as any)?.type || "")
      }));

      const sanitizedEdges = edges.map(e => ({
        id: String(e.id || `e-${e.source}-${e.target}`),
        source: String(e.source),
        target: String(e.target),
        label: String(e.label || "")
      }));

      const rawData = {
        subjectId: selectedSubject,
        nodes: sanitizedNodes,
        edges: sanitizedEdges,
      };

      const cleanData = JSON.parse(JSON.stringify(rawData));
      cleanData.updatedAt = serverTimestamp();

      await setDoc(doc(db, "knowledge_maps", selectedSubject), cleanData);
      toast.success("Đã cập nhật hệ thống sơ đồ tri thức!");
    } catch (err: any) {
      console.error("Firestore Save Error:", err);
      toast.error(`Lỗi khi lưu dữ liệu: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-6">
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
              onClick={handleSave}
              disabled={!selectedSubject || loading || nodes.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] px-6 py-2.5 rounded-xl text-sm font-black text-white shadow-lg shadow-[#6c5ce7]/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
           >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>Lưu sơ đồ</span>
           </button>
        </div>

      {/* Generation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 flex flex-col gap-4 h-full">
            <div className="bg-[#10101f]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col h-full shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                  <Brain size={120} className="text-[#6c5ce7]" />
               </div>

               <div className="flex items-center gap-2 text-xs font-black text-[#6c5ce7] uppercase tracking-widest mb-6">
                  <Layers size={14} />
                  <span>Nguồn dữ liệu tri thức</span>
               </div>

               <div className="flex bg-white/5 p-1 rounded-xl mb-6">
                  <button 
                    onClick={() => setActiveTab('text')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'text' ? 'bg-[#6c5ce7] text-white shadow-lg shadow-[#6c5ce7]/20' : 'text-slate-400 hover:text-white'}`}
                  >
                    Dán văn bản
                  </button>
                  <button 
                    onClick={() => setActiveTab('file')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'file' ? 'bg-[#6c5ce7] text-white shadow-lg shadow-[#6c5ce7]/20' : 'text-slate-400 hover:text-white'}`}
                  >
                    Tải File
                  </button>
               </div>

               {activeTab === 'text' ? (
                 <div className="flex-1 flex flex-col min-h-0">
                    <textarea 
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Dán nội dung giáo trình, đề cương hoặc tài liệu ôn tập vào đây..."
                      className="flex-1 w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-sm text-slate-300 outline-none focus:border-[#6c5ce7]/50 transition-all resize-none font-medium leading-relaxed scrollbar-hide"
                    />
                    <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                       <span>{rawText.length} ký tự</span>
                       <span>Tối đa 50,000</span>
                    </div>
                 </div>
               ) : (
                 <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl hover:border-[#6c5ce7]/30 transition-all cursor-pointer group">
                    <div className="text-center">
                       <RefreshCw size={32} className="mx-auto text-slate-600 mb-3 group-hover:text-[#6c5ce7] transition-colors" />
                       <p className="text-xs font-bold text-slate-500 group-hover:text-slate-300">Tính năng Tải file sắp ra mắt</p>
                       <p className="text-[10px] text-slate-600 mt-1">Dùng Tab Dán văn bản để trải nghiệm ngay</p>
                    </div>
                 </div>
               )}

               <button 
                  onClick={handleGenerateGraph}
                  disabled={!selectedSubject || isGenerating || (activeTab === 'text' && !rawText)}
                  className="mt-6 w-full py-4 rounded-2xl bg-gradient-to-r from-[#6c5ce7] to-[#8271ff] text-white font-black uppercase tracking-wider shadow-xl shadow-[#6c5ce7]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
               >
                  {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Brain size={18} />}
                  <span>{isGenerating ? "AI Đang phân tích..." : "Bắt đầu Phân tích"}</span>
               </button>
            </div>
        </div>

        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-[#050512] overflow-hidden relative shadow-inner group">
          {selectedSubject ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={(params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#6c5ce7' } }, eds))}
              fitView
              style={{ backgroundColor: '#050512', color: '#fff' }}
            >
              <Background color="#1a1a2e" gap={20} />
              <Controls className="!bg-[#10101f] !border-white/10 !fill-white" />
              
              <Panel position="top-right" className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/5 m-4">
                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <MousePointer2 size={10} /> Preview & Edit
                 </div>
                 <p className="text-[9px] text-slate-400">Kéo thả các node AI sinh ra để căn chỉnh lộ trình.</p>
              </Panel>
            </ReactFlow>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center opacity-40">
               <GitBranch size={48} className="text-slate-600 mb-4" />
               <p className="text-slate-500 font-medium">Chọn một môn học phía trên để bắt đầu.</p>
            </div>
          )}
          {isGenerating && (
            <div className="absolute inset-0 z-50 bg-[#050512]/60 backdrop-blur-sm flex items-center justify-center">
               <div className="text-center space-y-4">
                  <div className="relative">
                    <Brain size={64} className="text-[#6c5ce7] animate-pulse mx-auto" />
                    <div className="absolute inset-0 blur-2xl bg-[#6c5ce7]/20 rounded-full animate-pulse" />
                  </div>
                  <p className="text-sm font-black text-white uppercase tracking-widest animate-pulse">Trợ lý QIU đang kiến tạo sơ đồ...</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
