import { Timestamp } from "firebase/firestore";

export interface MaterialData {
  id: string;
  title: string;
  description: string;
  url: string;
  subjectId: string;
  type: string; // 'pdf' | 'link' | 'docx' | 'youtube' | 'reading'
  content?: string; // Markdown content for reading lessons
  createdAt: Timestamp;
}
