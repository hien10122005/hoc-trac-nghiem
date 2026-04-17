"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Lấy thông tin role từ Firestore để điều hướng chính xác
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().role === "admin") {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0F172A]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#6c5ce7]" />
        <p className="text-sm font-medium text-slate-400 animate-pulse">Đang xác thực bảo mật...</p>
      </div>
    </main>
  );
}
