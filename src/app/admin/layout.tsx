"use client";

import { useState } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Database, 
  Users, 
  LogOut, 
  Menu, 
  Bell,
  Search
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Toaster } from "react-hot-toast";

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
    { name: "Tài khoản học viên", icon: Users, href: "/admin/users" },
  ];

  const getIcon = (item: { name: string }) => {
    switch (item.name) {
      case "Tổng quan": return <LayoutDashboard size={22} />;
      case "Quản lý môn học": return <BookOpen size={22} />;
      case "Ngân hàng câu hỏi": return <Database size={22} />;
      case "Tài khoản học viên": return <Users size={22} />;
      default: return <LayoutDashboard size={22} />;
    }
  };

  const handleLogout = async () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      try {
        await signOut(auth);
        router.push("/login");
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a14] text-slate-200 selection:bg-[#6c5ce7]/30">
      <Toaster position="top-right" toastOptions={{ style: { background: '#10101f', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/5 bg-[#10101f]/80 backdrop-blur-xl transition-all duration-300 ease-in-out`}
      >
        <div className="flex h-20 items-center justify-between px-6">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] flex items-center justify-center shadow-lg shadow-[#6c5ce7]/20">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-white uppercase">
                Admin <span className="text-[#6c5ce7]">DNC</span>
              </span>
            </div>
          )}
          {!isSidebarOpen && (
            <div className="mx-auto h-8 w-8 rounded-lg bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">D</span>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-6">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 rounded-xl px-3 py-3 transition-all duration-300 group ${
                  isActive 
                    ? "bg-[#6c5ce7]/10 text-[#6c5ce7] shadow-[inset_0_0_10px_rgba(108,92,231,0.05)]" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className={`${isActive ? "text-[#6c5ce7]" : "group-hover:scale-110 transition-transform"}`}>
                  {getIcon(item)}
                </div>
                {isSidebarOpen && <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>}
                {isActive && isSidebarOpen && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#6c5ce7] shadow-[0_0_8px_#6c5ce7]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-[#0a0a14]/40">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-400 group"
          >
            <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="text-sm font-medium whitespace-nowrap">Đăng xuất</span>}
          </button>
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
                <p className="text-sm font-semibold text-white">Admin Hiển</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Hệ thống quản trị</p>
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
