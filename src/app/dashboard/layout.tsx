"use client";

import { useState, useEffect } from "react";
import { 
  Home, 
  BookOpen, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  GraduationCap,
  BarChart3,
  Bookmark
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, "users", authUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Đã đăng xuất");
      router.push("/login");
    } catch (error) {
      toast.error("Lỗi khi đăng xuất");
    }
  };

  const menuItems = [
    { name: "Trang chủ", icon: Home, href: "/dashboard" },
    { name: "Thư viện", icon: BookOpen, href: "/dashboard/library" },
    { name: "Phân tích", icon: BarChart3, href: "/dashboard/analytics" },
    { name: "Câu hỏi đã lưu", icon: Bookmark, href: "/dashboard/saved" },
    { name: "Hồ sơ cá nhân", icon: User, href: "/dashboard/profile" },
    { name: "Cài đặt tài khoản", icon: Settings, href: "/dashboard/settings" },
  ];

  if (loading) return null;

  return (
    <div className="flex min-h-screen bg-[#07070a] text-[#f0f0fd] font-manrope selection:bg-[#6c5ce7]/30">
      <Toaster position="top-right" />
      
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#6c5ce7]/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#00cec9]/5 blur-[120px]" />
      </div>

      {/* Sidebar Overlay for Mobile */}
      {!isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(true)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0 md:w-20"
        } fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/5 bg-[#0a0a14]/80 backdrop-blur-2xl transition-all duration-500 ease-in-out`}
      >
        {/* Sidebar Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] flex items-center justify-center shadow-lg shadow-[#6c5ce7]/20">
              <GraduationCap className="text-white h-6 w-6" />
            </div>
            {isSidebarOpen && (
              <span className="text-xl font-bold tracking-tight text-white uppercase whitespace-nowrap">
                Học <span className="text-[#6c5ce7]">DNC</span>
              </span>
            )}
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-xl p-2 hover:bg-white/5 text-slate-400 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Quick Profile */}
        {isSidebarOpen && (
          <div className="p-6">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-[#6c5ce7]/20 border border-[#6c5ce7]/30 flex items-center justify-center text-[#6c5ce7] font-bold">
                  {userData?.name?.charAt(0) || "U"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-white truncate">{userData?.name || "Học viên"}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Sinh viên</p>
                </div>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] w-2/3" />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 text-center uppercase tracking-tighter">Tiến độ học tập: 65%</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-3 py-6">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard");
            // Special case for dashboard root
            const activeMatch = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 rounded-xl px-3 py-3.5 transition-all duration-300 group relative ${
                  activeMatch 
                    ? "bg-[#6c5ce7]/10 text-[#6c5ce7]" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon size={22} className={`${activeMatch ? "text-[#6c5ce7]" : "group-hover:scale-110 transition-transform"}`} />
                {isSidebarOpen && <span className="text-sm font-bold whitespace-nowrap">{item.name}</span>}
                {activeMatch && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#6c5ce7] rounded-r-full shadow-[0_0_10px_#6c5ce7]" />
                )}
                {activeMatch && isSidebarOpen && (
                  <ChevronRight size={14} className="ml-auto opacity-40" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-4 rounded-xl px-3 py-3.5 text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-400 group"
          >
            <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="text-sm font-bold">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`${isSidebarOpen ? "md:pl-72" : "md:pl-20"} flex-1 transition-all duration-500 ease-in-out`}>
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/5 bg-[#07070a]/60 px-6 backdrop-blur-md">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden md:flex rounded-xl p-2 hover:bg-white/5 text-slate-400 transition-colors"
              >
                <Menu size={22} />
              </button>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden rounded-xl p-2 hover:bg-white/5 text-slate-400 transition-colors"
              >
                <Menu size={22} />
              </button>
              <h2 className="text-lg font-bold text-white">
                {menuItems.find(item => pathname === item.href)?.name || "Bảng điều khiển"}
              </h2>
           </div>

           <div className="flex items-center gap-4">
              <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block" />
              <div className="flex items-center gap-3">
                 <div className="hidden text-right sm:block">
                    <p className="text-sm font-bold text-white">{userData?.name || "Học viên"}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none">ID: {user?.uid.slice(0, 6)}</p>
                 </div>
                 <Link href="/dashboard/profile" className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 p-0.5 shadow-xl hover:scale-110 transition-transform">
                    <div className="flex h-full w-full items-center justify-center rounded-[9px] bg-gradient-to-br from-[#6c5ce7] to-[#00cec9]">
                       <User size={18} className="text-white" />
                    </div>
                 </Link>
              </div>
           </div>
        </header>

        <section className="relative z-10 p-6 md:p-10 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {children}
        </section>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        .font-manrope { font-family: 'Manrope', sans-serif; }
      `}</style>
    </div>
  );
}
