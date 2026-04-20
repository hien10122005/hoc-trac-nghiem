export interface Question {
  id: string;
  subjectId: string;
  content: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  bloomLevel: 1 | 2 | 3 | 4; // 1: Remember, 2: Understand, 3: Apply, 4: Analyze/Evaluate
  createdAt?: string;
}
