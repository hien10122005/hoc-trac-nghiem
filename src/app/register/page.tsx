"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2, User } from "lucide-react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Đang tạo tài khoản...");
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // Tạo user document trong Firestore
      await setDoc(doc(db, "users", uid), {
        name,
        email,
        role: "student",
        createdAt: serverTimestamp()
      });

      toast.success("Đăng ký thành công!", { id: toastId });
      router.push("/dashboard");
      
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        toast.error("Email này đã được sử dụng.", { id: toastId });
      } else if (err.code === "auth/weak-password") {
        toast.error("Mật khẩu quá yếu, cần ít nhất 6 ký tự.", { id: toastId });
      } else if (err.code === "auth/invalid-email") {
        toast.error("Email không hợp lệ.", { id: toastId });
      } else {
        toast.error("Đã có lỗi xảy ra. Vui lòng thử lại sau.", { id: toastId });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 selection:bg-[#6c5ce7]/30">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{
            background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
            animation: "float 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -right-32 top-1/3 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
            animation: "float 10s ease-in-out infinite 2s",
          }}
        />
        <div
          className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full opacity-25 blur-3xl"
          style={{
            background: "radial-gradient(circle, var(--primary-light) 0%, transparent 70%)",
            animation: "float 12s ease-in-out infinite 4s",
          }}
        />
      </div>

      {/* Register card */}
      <div
        className="relative z-10 w-full max-w-md my-8"
        style={{ animation: "fadeInUp 0.8s ease-out" }}
      >
        <div
          className="rounded-3xl border border-white/10 p-8 shadow-2xl backdrop-blur-xl"
          style={{
            background: "linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(36, 36, 62, 0.8) 100%)",
            animation: "pulse-glow 4s ease-in-out infinite",
          }}
        >
          {/* Logo & Title */}
          <div className="mb-8 text-center" style={{ animation: "slideInLeft 0.6s ease-out 0.2s both" }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] shadow-lg shadow-[#6c5ce7]/20">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Đăng ký Học viên
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Tạo tài khoản để tham gia kiểm tra trắc nghiệm
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5" style={{ animation: "fadeInUp 0.6s ease-out 0.3s both" }}>
              <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Họ và tên
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <User className="h-5 w-5" />
                </span>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ và tên của bạn"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-[#6c5ce7] focus:bg-white/10 focus:ring-2 focus:ring-[#6c5ce7]/30"
                />
              </div>
            </div>

            <div className="space-y-1.5" style={{ animation: "fadeInUp 0.6s ease-out 0.4s both" }}>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-[#6c5ce7] focus:bg-white/10 focus:ring-2 focus:ring-[#6c5ce7]/30"
                />
              </div>
            </div>

            <div className="space-y-1.5" style={{ animation: "fadeInUp 0.6s ease-out 0.5s both" }}>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-12 text-sm text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-[#6c5ce7] focus:bg-white/10 focus:ring-2 focus:ring-[#6c5ce7]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5" style={{ animation: "fadeInUp 0.6s ease-out 0.6s both" }}>
              <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-12 text-sm text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-[#6c5ce7] focus:bg-white/10 focus:ring-2 focus:ring-[#6c5ce7]/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(108,92,231,0.4)] disabled:opacity-60 mt-4"
              style={{ animation: "fadeInUp 0.6s ease-out 0.7s both" }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang thiết lập...
                  </>
                ) : (
                  "Tạo tài khoản"
                )}
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400" style={{ animation: "fadeInUp 0.6s ease-out 0.8s both" }}>
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-bold text-[#00cec9] hover:underline hover:text-white transition-colors">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
