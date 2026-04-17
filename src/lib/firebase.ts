import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

export { app, auth, db };
