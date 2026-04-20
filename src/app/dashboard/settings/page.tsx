"use client";

import { useState } from "react";
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { FirestoreUserData } from "@/types/user";
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  KeyRound
} from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [userData, setUserData] = useState<FirestoreUserData | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp!");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Đang cập nhật mật khẩu...");

    try {
      // 1. Re-authenticate
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // 2. Update password
      await updatePassword(auth.currentUser, newPassword);
      
      toast.success("Đổi mật khẩu thành công!", { id: toastId });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error("Error updating password:", error);
      if (error.code === "auth/wrong-password") {
        toast.error("Mật khẩu hiện tại không đúng.", { id: toastId });
      } else {
        toast.error("Có lỗi xảy ra. Có thể phiên đăng nhập đã hết hạn.", { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-white">Cài đặt tài khoản</h1>
        <p className="text-slate-500">Quản lý bảo mật và thông tin truy cập của bạn.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Security Status Card */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[#00cec9]/10 flex items-center justify-center text-[#00cec9]">
                 <ShieldCheck size={24} />
              </div>
              <div>
                 <p className="text-sm font-bold text-white uppercase tracking-tight">Trạng thái bảo mật</p>
                 <p className="text-xs text-[#00cec9] font-bold">Rất tốt (Mật khẩu đang được bảo vệ)</p>
              </div>
           </div>
           <div className="hidden sm:block h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#00cec9] w-full" />
           </div>
        </div>

        {/* Change Password Form */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 space-y-8">
          <div className="flex items-center gap-2">
            <KeyRound size={20} className="text-[#6c5ce7]" />
            <h2 className="text-xl font-bold text-white">Đổi mật khẩu</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mật khẩu hiện tại</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPasswords ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none focus:border-[#6c5ce7] focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none focus:border-[#6c5ce7] focus:bg-white/10 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Xác nhận mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none focus:border-[#6c5ce7] focus:bg-white/10 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
               <button 
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-1.5 transition-colors"
               >
                  {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showPasswords ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
               </button>
               
               <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#8e44ad] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#6c5ce7]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Cập nhật mật khẩu"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security Warning */}
        <div className="flex gap-4 p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
           <AlertCircle className="shrink-0" />
           <p className="text-xs leading-relaxed">
             <span className="font-bold uppercase tracking-wider block mb-1">Mẹo bảo mật:</span>
             Sử dụng ít nhất 8 ký tự, bao gồm cả chữ hoa, chữ thường, số và ký tự đặc biệt để đảm bảo tài khoản của bạn luôn được bảo vệ tốt nhất.
           </p>
        </div>
      </div>
    </div>
  );
}
