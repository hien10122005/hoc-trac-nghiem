"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { User, Mail, Calendar, Shield, MapPin, Award } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        const userDoc = await getDoc(doc(db, "users", authUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return null;

  const stats = [
    { label: "Ngày tham gia", value: userData?.createdAt?.toDate().toLocaleDateString('vi-VN') || "Mới đây", icon: Calendar, color: "text-amber-400" },
    { label: "Trạng thái", value: "Đang hoạt động", icon: Shield, color: "text-[#00cec9]" },
  ];

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Profile Header */}
      <div className="relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <User size={120} />
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-[#6c5ce7]/20">
            {userData?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
          </div>
          
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-3xl font-bold text-white">{userData?.name || "Học viên"}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-400 text-sm">
              <div className="flex items-center gap-1.5">
                <Mail size={16} />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield size={16} />
                <span className="uppercase tracking-widest text-[10px] font-bold text-[#00cec9]">Học viên chính thức</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-3 hover:bg-white/[0.05] transition-colors">
            <div className={`p-2 rounded-lg bg-white/5 w-fit ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Info */}
      <div className="max-w-2xl rounded-3xl border border-white/5 bg-white/[0.02] p-8 space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <User size={20} className="text-[#6c5ce7]" />
          Thông tin chi tiết
        </h2>
        
        <div className="space-y-4">
          <div className="flex justify-between py-3 border-b border-white/5">
            <span className="text-slate-500">Mã học viên</span>
            <span className="text-white font-mono">{user?.uid.slice(0, 10)}...</span>
          </div>
          <div className="flex justify-between py-3 border-b border-white/5">
            <span className="text-slate-500">Loại tài khoản</span>
            <span className="text-white">Sinh viên</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-slate-500">Lần cuối đăng nhập</span>
            <span className="text-white">{user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('vi-VN') : "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
