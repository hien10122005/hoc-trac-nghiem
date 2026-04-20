import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { KnowledgeMap } from "@/types/knowledgeGraph";

const CACHE_PREFIX = "knowledge_map_";
const STALE_TIME = 24 * 60 * 60 * 1000; // 24 hours in ms

export async function getKnowledgeMap(subjectId: string): Promise<KnowledgeMap | null> {
  // SSR check
  if (typeof window === "undefined") return null;

  const cacheKey = `${CACHE_PREFIX}${subjectId}`;
  
  // 1. Try to get from localStorage
  const cachedData = localStorage.getItem(cacheKey);
  let cachedMap: KnowledgeMap | null = null;
  
  if (cachedData) {
    try {
      const parsed = JSON.parse(cachedData);
      cachedMap = parsed.data;
      const timestamp = parsed.timestamp;
      
      // Checking if it's stale
      const isStale = Date.now() - timestamp > STALE_TIME;
      
      if (!isStale) {
        console.log(`KnowledgeMap [${subjectId}]: Loaded from cache.`);
        return cachedMap;
      }
      
      console.log(`KnowledgeMap [${subjectId}]: Cache is stale. Revalidating in background...`);
      // Background revalidation (fire and forget)
      fetchAndCacheMap(subjectId, cacheKey);
      return cachedMap;
    } catch (e) {
      console.error("Error parsing knowledge map cache:", e);
    }
  }

  // 2. Fetch from Firestore if no cache or error
  return await fetchAndCacheMap(subjectId, cacheKey);
}

async function fetchAndCacheMap(subjectId: string, cacheKey: string): Promise<KnowledgeMap | null> {
  try {
    const docRef = doc(db, "knowledge_maps", subjectId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() } as KnowledgeMap;
      
      // Save to localStorage
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      console.log(`KnowledgeMap [${subjectId}]: Updated cache from Firestore.`);
      return data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching knowledge map:", error);
    return null;
  }
}
