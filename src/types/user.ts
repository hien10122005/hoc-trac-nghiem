import { Timestamp } from "firebase/firestore";

export interface SubjectStats {
  name: string;
  totalExams: number;
  totalCorrect: number;
  totalQuestions: number;
  totalScoreSum: number;
  bestScore: number;
  bloomLevelStats?: Record<number, { correct: number; total: number }>;
  lastUpdatedAt?: Timestamp;
}

export interface SavedQuestion {
  subjectId: string;
  questionId: string;
  content: string;
  savedAt: string;
  topicId?: string;
  topicName?: string;
}

export interface FirestoreUserData {
  name?: string;
  email?: string;
  role?: "admin" | "student";
  createdAt: Timestamp;
  savedQuestions?: SavedQuestion[];
  totalExams?: number;
  totalCorrect?: number;
  totalQuestions?: number;
  totalScoreSum?: number;
  lastUpdatedAt?: Timestamp;
  subjectStats?: Record<string, SubjectStats>;
}
