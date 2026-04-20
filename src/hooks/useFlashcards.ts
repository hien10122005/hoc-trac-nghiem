import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp 
} from "firebase/firestore";
import { FlashcardDeck } from "@/types/flashcard";

export function useFlashcards(subjectId?: string) {
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subjectId) {
      setLoading(false);
      return;
    }

    async function fetchDeck() {
      try {
        setLoading(true);
        setError(null);

        // 1. Kiểm tra LocalStorage trước
        const cacheKey = `qiu_fc_cache_${subjectId}`;
        const syncKey = `qiu_fc_sync_${subjectId}`;
        const cachedData = localStorage.getItem(cacheKey);
        const lastSync = localStorage.getItem(syncKey);

        // 2. Kiểm tra metadata từ Firestore để xem có cập nhật mới không
        // Document này chứa thông tin về thời gian cập nhật cuối cùng của hệ thống flashcard
        const metadataRef = doc(db, "system_metadata", "flashcards");
        const metaSnap = await getDoc(metadataRef);
        
        let needsUpdate = true;
        if (metaSnap.exists() && lastSync) {
          const serverUpdate = (metaSnap.data().lastUpdated as Timestamp).toMillis();
          if (parseInt(lastSync) >= serverUpdate && cachedData) {
            needsUpdate = false;
          }
        }

        if (!needsUpdate && cachedData) {
          console.log("Flashcards: Loaded from LocalStorage Cache");
          setDeck(JSON.parse(cachedData));
          setLoading(false);
          return;
        }

        // 3. Gọi từ Firestore (Chỉ tốn 1 Read cho toàn bộ deck)
        console.log("Flashcards: Syncing from Firestore Server");
        const decksRef = collection(db, "flashcard_decks");
        const q = query(decksRef, where("subjectId", "==", subjectId));
        const querySnap = await getDocs(q);

        if (!querySnap.empty) {
          const deckData = { 
            id: querySnap.docs[0].id, 
            ...querySnap.docs[0].data() 
          } as FlashcardDeck;
          
          setDeck(deckData);
          
          // Lưu vào Cache
          localStorage.setItem(cacheKey, JSON.stringify(deckData));
          localStorage.setItem(syncKey, Date.now().toString());
        } else {
          setDeck(null);
        }
      } catch (err: any) {
        console.error("useFlashcards Error:", err);
        setError(err.message || "Không thể tải bộ thẻ học.");
      } finally {
        setLoading(false);
      }
    }

    fetchDeck();
  }, [subjectId]);

  return { deck, loading, error };
}
