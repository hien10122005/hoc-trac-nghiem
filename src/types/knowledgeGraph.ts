export type NodeStatus = 'locked' | 'unlocked' | 'completed';
export type NodeType = 'subject' | 'topic' | 'material';

export interface KnowledgeNode {
  id: string;
  label: string;
  type: NodeType;
  position: { x: number; y: number };
  status: NodeStatus;
  data?: any;
}

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface KnowledgeMap {
  id: string;
  subjectId: string;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  updatedAt: any;
}
