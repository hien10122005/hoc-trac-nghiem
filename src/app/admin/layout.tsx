"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  BookOpen, 
  Database, 
  Users, 
  LogOut, 
  Menu, 
  Bell,
  Search,
  FileText,
  Sparkles
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import toast, { Toaster } from "react-hot-toast";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { name: "Tổng quan", icon: LayoutDashboard, href: "/admin" },
    { name: "Quản lý môn học", icon: BookOpen, href: "/admin/subjects" },
    { name: "Ngân hàng câu hỏi", icon: Database, href: "/admin/questions" },
    { name: "Thẻ học Flashcards", icon: Sparkles, href: "/admin/flashcards" },
    { name: "Thư viện tài liệu", icon: FileText, href: "/admin/materials" },
    { name: "Tài khoản học viên", icon: Users, href: "/admin/users" },
  ];

  const getIcon = (item: { name: string }) => {
    switch (item.name) {
      case "Tổng quan": return <LayoutDashboard size={22} />;
      case "Quản lý môn học": return <BookOpen size={22} />;
      case "Ngân hàng câu hỏi": return <Database size={22} />;
      case "Thẻ học Flashcards": return <Sparkles size={22} />;
      case "Thư viện tài liệu": return <FileText size={22} />;
      case "Tài khoản học viên": return <Users size={22} />;
      default: return <LayoutDashboard size={22} />;
    }
  };

  const handleLogout = async () => {
    const toastId = toast.loading("Đang đăng xuất...");
    try {
      await signOut(auth);
      toast.success("Đã đăng xuất thành công", { id: toastId });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Lỗi khi đăng xuất", { id: toastId });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a14] text-slate-200 selection:bg-[#6c5ce7]/30">
      <Toaster position="top-right" toastOptions={{ style: { background: '#10101f', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/5 bg-[#0d0d17]/90 backdrop-blur-2xl transition-all duration-500 ease-in-out`}
      >
        <div className="flex h-24 items-center justify-between px-6">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] flex items-center justify-center shadow-lg shadow-[#6c5ce7]/20 rotate-3">
                <span className="text-white font-black text-xl">Q</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-widest text-white uppercase leading-none">
                  <span className="text-[#6c5ce7]">QIU</span> ADMIN
                </span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Management Hub</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto h-10 w-10 rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">Q</span>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          <div className="mb-4 px-2">
             <p className={`text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] ${!isSidebarOpen && "hidden"}`}>Hệ thống</p>
          </div>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 rounded-2xl px-3 py-3.5 transition-all duration-300 group relative ${
                  isActive 
                    ? "bg-[#6c5ce7]/10 text-white" 
                    : "text-slate-400 hover:bg-white/[0.03] hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="admin-nav-glow"
                    className="absolute inset-0 bg-gradient-to-r from-[#6c5ce7]/20 to-transparent rounded-2xl -z-10"
                  />
                )}
                <div className={`${isActive ? "text-[#6c5ce7]" : "group-hover:scale-110 group-hover:text-[#6c5ce7] transition-all"} shrink-0`}>
                  {getIcon(item)}
                </div>
                {isSidebarOpen && <span className={`text-sm font-semibold whitespace-nowrap tracking-tight transition-colors ${isActive ? "text-white" : "text-slate-400"}`}>{item.name}</span>}
                {isActive && isSidebarOpen && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#6c5ce7] shadow-[0_0_12px_#6c5ce7]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5 bg-white/[0.01]">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-4 rounded-2xl px-3 py-3.5 text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-400 group"
          >
            <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="text-sm font-semibold whitespace-nowrap">Đăng xuất</span>}
          </button>
          
          {isSidebarOpen && (
            <div className="mt-4 px-3 py-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[9px] text-slate-500 font-bold text-center leading-relaxed">
                © 2026 <span className="text-white">QIU</span><br />
                Phát triển và điều hành bởi <br />
                <span className="text-[#00cec9]">PhanVanHien</span>
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`${isSidebarOpen ? "pl-64" : "pl-20"} flex-1 transition-all duration-300 ease-in-out`}>
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/5 bg-[#0a0a14]/60 px-8 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-xl p-2 hover:bg-white/5 text-slate-400 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="h-8 w-px bg-white/10 mx-2 hidden md:block" />
            <h2 className="text-lg font-semibold text-white hidden md:block">
              {menuItems.find(item => item.href === pathname)?.name || "Bảng quản trị"}
            </h2>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Tìm giao diện, tài liệu..."
                className="w-64 rounded-xl border border-white/5 bg-white/5 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#6c5ce7]/50 focus:bg-white/10 transition-all"
              />
            </div>
            
            <button className="relative rounded-xl p-2.5 hover:bg-white/5 text-slate-400 transition-colors">
              <Bell size={20} />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#00cec9] border-2 border-[#0a0a14]" />
            </button>

            <div className="h-8 w-px bg-white/10" />

            <div className="flex items-center gap-3 pl-2">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-white">PhanVanHien</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Quản trị viên tối cao</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-[#1a1a2e] border border-white/10 p-0.5 shadow-xl">
                 <div className="flex h-full w-full items-center justify-center rounded-[9px] bg-gradient-to-br from-[#6c5ce7] to-[#00cec9]">
                   <Users size={18} className="text-white" />
                 </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <section className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </section>
      </main>
    </div>
  );
}
