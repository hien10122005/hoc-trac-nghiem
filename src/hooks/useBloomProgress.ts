import { useMemo } from 'react';
import { SubjectStats } from '@/types/user';

export interface BloomProgressLevel {
  level: number;
  correct: number;
  total: number;
  percentage: number;
  isUnlocked: boolean;
}

/**
 * Hook useBloomProgress: Tính toán tiến độ mở khóa dựa trên Thang đo Bloom.
 * Điều kiện: Trả lời đúng >= 80% số lượng câu hỏi của level N để mở khóa level N+1.
 */
export const useBloomProgress = (subjectStats?: SubjectStats) => {
  const stats = subjectStats?.bloomLevelStats || {};

  const result = useMemo(() => {
    const levels: BloomProgressLevel[] = [];
    
    // Level 1 luôn được mở khóa
    const l1_correct = stats[1]?.correct || 0;
    const l1_total = stats[1]?.total || 0;
    const l1_percentage = l1_total > 0 ? (l1_correct / l1_total) * 100 : 0;
    levels.push({ level: 1, correct: l1_correct, total: l1_total, percentage: l1_percentage, isUnlocked: true });

    // Các level tiếp theo (2, 3, 4)
    for (let i = 2; i <= 4; i++) {
      const prevLevel = levels[i - 2];
      const isUnlocked = prevLevel.total > 0 && prevLevel.percentage >= 80;
      
      const current_correct = stats[i]?.correct || 0;
      const current_total = stats[i]?.total || 0;
      const current_percentage = current_total > 0 ? (current_correct / current_total) * 100 : 0;
      
      levels.push({ 
        level: i, 
        correct: current_correct, 
        total: current_total, 
        percentage: current_percentage, 
        isUnlocked 
      });
    }

    // Cấp độ cao nhất hiện tại học viên có thể vào học
    const currentUnlocked = [...levels].reverse().find(l => l.isUnlocked)?.level || 1;

    return { levels, currentUnlocked };
  }, [stats]);

  return result;
};
