import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  getDocs, 
  getDocsFromCache,
  Query
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBYQZhZ_2RPKqb59vn_idWpsRWqkm3gjjI",
  authDomain: "phanvanhien-74a22.firebaseapp.com",
  projectId: "phanvanhien-74a22",
  storageBucket: "phanvanhien-74a22.firebasestorage.app",
  messagingSenderId: "583994944638",
  appId: "1:583994944638:web:84709167cb8966b2d8bc2f",
  measurementId: "G-5LYM88044P"
};

// Khởi tạo Firebase 1 lần duy nhất để tránh lỗi khi Next.js hot-reload
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Bật chế độ lưu trữ offline (Persistence)
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Firestore Persistence: Đang mở nhiều tab, chỉ bật được ở 1 tab.");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore Persistence: Trình duyệt không hỗ trợ.");
    }
  });
}

/**
 * Helper: Thử lấy dữ liệu từ Cache trước, nếu không có mới gọi Server.
 * Giúp tiết kiệm lượt Read và tăng tốc độ hiển thị.
 */
export async function getCachedDocs(q: Query) {
  try {
    const snapshot = await getDocsFromCache(q);
    if (!snapshot.empty) {
      console.log("Firestore: Loaded from Cache");
      return snapshot;
    }
  } catch (_err) {
    // Chỉ log lỗi nếu không phải là lỗi "không tìm thấy trong cache"
  }
  
  const serverSnapshot = await getDocs(q);
  console.log("Firestore: Loaded from Server (Reads count!)");
  return serverSnapshot;
}

export { app, auth, db };

