import { Timestamp } from "firebase/firestore";

export interface Flashcard {
  id: string;
  frontText: string;
  backText: string;
  hint?: string;
}

export interface FlashcardDeck {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  cards: Flashcard[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  authorId: string;
}

export interface FlashcardProgress {
  userId: string;
  deckId: string;
  knownCardIds: string[]; // Danh sách các ID thẻ đã thuộc
  learningCardIds: string[]; // Danh sách các ID thẻ đang học
  lastStudiedAt: Timestamp;
}
