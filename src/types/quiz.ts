import { Timestamp } from "firebase/firestore";

export interface QuizResultData {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  subjectId: string;
  subjectName?: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  createdAt: Timestamp;
}
