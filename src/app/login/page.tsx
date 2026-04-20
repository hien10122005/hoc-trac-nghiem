"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // Lấy thông tin role từ Firestore
      const userDoc = await getDoc(doc(db, "users", uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === "admin") {
          router.push("/admin");
        } else if (userData.role === "student") {
          router.push("/dashboard");
        } else {
          alert("Tài khoản chưa được phân quyền");
        }
      } else {
        alert("Tài khoản chưa được phân quyền");
      }
    } catch (err: unknown) {
      const e = err as { code?: string };
      console.error(e);
      if (e.code === "auth/user-not-found" || e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        setError("Email hoặc mật khẩu không chính xác.");
      } else if (e.code === "auth/invalid-email") {
        setError("Email không hợp lệ.");
      } else {
        setError("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
            animation: "float 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -right-32 top-1/3 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
            animation: "float 10s ease-in-out infinite 2s",
          }}
        />
        <div
          className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--primary-light) 0%, transparent 70%)",
            animation: "float 12s ease-in-out infinite 4s",
          }}
        />
      </div>

      {/* Login card */}
      <div
        className="relative z-10 w-full max-w-md"
        style={{ animation: "fadeInUp 0.8s ease-out" }}
      >
        <div
          className="rounded-3xl border border-white/10 p-8 shadow-2xl backdrop-blur-xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(36, 36, 62, 0.8) 100%)",
            animation: "pulse-glow 4s ease-in-out infinite",
          }}
        >
          {/* Logo & Title */}
          <div
            className="mb-8 text-center"
            style={{ animation: "slideInLeft 0.6s ease-out 0.2s both" }}
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] shadow-lg">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">
              QIU
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Đăng nhập để bắt đầu ôn tập
            </p>
          </div>


          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5" style={{ animation: "fadeInUp 0.6s ease-out 0.3s both" }}>
              <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-[var(--text-muted)] outline-none transition-all duration-300 focus:border-[var(--primary)] focus:bg-white/10 focus:ring-2 focus:ring-[var(--primary)]/30"
                />
              </div>
              {error && (
                <p className="mt-1 text-[10px] text-red-400 animate-fade">
                  {error}
                </p>
              )}
            </div>

            <div className="space-y-1.5" style={{ animation: "fadeInUp 0.6s ease-out 0.4s both" }}>
              <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-12 text-sm text-white placeholder-[var(--text-muted)] outline-none transition-all duration-300 focus:border-[var(--primary)] focus:bg-white/10 focus:ring-2 focus:ring-[var(--primary)]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              id="login-button"
              type="submit"
              disabled={isLoading}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(108,92,231,0.4)] disabled:opacity-60"
              style={{ animation: "fadeInUp 0.6s ease-out 0.6s both" }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>
          </form>

          <div className="mt-6 text-center space-y-4" style={{ animation: "fadeInUp 0.6s ease-out 0.8s both" }}>
            <p className="text-sm text-[var(--text-muted)]">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="font-bold text-[var(--accent)] hover:underline hover:text-white transition-colors">
                Đăng ký ngay
              </Link>
            </p>
            <p className="text-xs text-[var(--text-muted)]/60">
              © 2026 &mdash; QIU Smart Learning Platform
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
