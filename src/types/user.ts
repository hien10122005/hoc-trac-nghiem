import { Timestamp } from "firebase/firestore";

export interface SubjectStats {
  name: string;
  totalExams: number;
  totalCorrect: number;
  totalQuestions: number;
  totalScoreSum: number;
  bestScore: number;
  lastUpdatedAt?: Timestamp;
}

export interface FirestoreUserData {
  name?: string;
  email?: string;
  role?: "admin" | "student";
  createdAt: Timestamp;
  savedQuestions?: string[];
  totalExams?: number;
  totalCorrect?: number;
  totalQuestions?: number;
  totalScoreSum?: number;
  lastUpdatedAt?: Timestamp;
  subjectStats?: Record<string, SubjectStats>;
}
