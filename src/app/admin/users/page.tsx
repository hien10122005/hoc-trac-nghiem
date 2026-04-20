"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot, 
  query, 
  deleteDoc, 
  doc, 
  Timestamp, 
  updateDoc,
  getDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { 
  Users, 
  Trash2, 
  ShieldCheck, 
  User, 
  Search, 
  Loader2, 
  ShieldAlert, 
  UserCog, 
  ShieldX,
  Filter
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FirestoreUserData } from "@/types/user";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "admin" | "student";
  createdAt: Timestamp | null;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "student">("all");
  const [currentAdmin, setCurrentAdmin] = useState<FirestoreUserData | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const data = userDoc.data() as FirestoreUserData;
      if (data?.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      setCurrentAdmin(data);
    });

    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      
      usersData.sort((a, b) => {
        const timeA = (a.createdAt as Timestamp)?.toMillis?.() || 0;
        const timeB = (b.createdAt as Timestamp)?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast.error("Lỗi khi tải danh sách người dùng");
      setLoading(false);
    });

    return () => {
      unsubAuth();
      unsubscribe();
    };
  }, [router]);

  const isSupremeAdmin = (email: string) => email.toLowerCase().includes("phanvanhien");

  const handleToggleAdmin = async (user: UserProfile) => {
    if (isSupremeAdmin(user.email)) {
      toast.error("Tài khoản này thuộc quyền quản trị tối cao, không thể thay đổi!");
      return;
    }

    if (currentAdmin?.role !== "admin") {
      toast.error("Bạn không có quyền thực hiện hành động này!");
      return;
    }

    const newRole = user.role === "admin" ? "student" : "admin";
    const actionText = newRole === "admin" ? "Cấp quyền Admin" : "Gỡ quyền Admin";

    if (confirm(`Bạn có chắc chắn muốn ${actionText} cho ${user.email}?`)) {
      const toastId = toast.loading("Đang cập nhật quyền...");
      try {
        await updateDoc(doc(db, "users", user.id), {
          role: newRole,
          lastUpdatedAt: Timestamp.now()
        });
        toast.success(`Đã thay đổi vai trò của ${user.email} thành ${newRole === 'admin' ? 'Quản trị viên' : 'Học viên'}`, { id: toastId });
      } catch (error) {
        console.error("Error updating role:", error);
        toast.error("Lỗi khi cập nhật quyền.", { id: toastId });
      }
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (isSupremeAdmin(user.email)) {
      toast.error("Không thể xóa tài khoản Quản trị viên tối cao!");
      return;
    }

    if (user.role === "admin" && !isSupremeAdmin(currentAdmin?.email || "")) {
       toast.error("Bạn không có quyền xóa các Quản trị viên khác!");
       return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa học viên ${user.name || user.email}? Hành động này cấm họ đăng nhập vào hệ thống!`)) {
      const toastId = toast.loading("Đang xóa tài khoản...");
      try {
        await deleteDoc(doc(db, "users", user.id));
        toast.success(`Đã xóa tài khoản ${user.email} thành công!`, { id: toastId });
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Lỗi khi xóa học viên.", { id: toastId });
      }
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
                         (u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || "");
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const studentCount = users.filter(u => u.role === "student").length;
  const adminCount = users.filter(u => u.role === "admin").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-outfit">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Quản lý <span className="bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] bg-clip-text text-transparent">Tài khoản</span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Theo dõi và phân quyền người dùng trên toàn hệ thống.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-white/5 bg-[#10101f] p-5 shadow-xl relative overflow-hidden group">
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Users size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Học viên</p>
              <h3 className="text-2xl font-black text-white">{loading ? "..." : studentCount}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#10101f] p-5 shadow-xl relative overflow-hidden group">
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quản trị</p>
              <h3 className="text-2xl font-black text-white">{loading ? "..." : adminCount}</h3>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Tìm tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-white/5 bg-[#10101f] py-3.5 pl-11 pr-4 text-sm text-white outline-none focus:border-[#6c5ce7]/50 transition-all font-medium"
            />
          </div>
          <div className="flex items-center bg-[#10101f] rounded-xl border border-white/5 p-1 gap-1">
            {(["all", "admin", "student"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  roleFilter === r ? "bg-[#6c5ce7] text-white shadow-lg shadow-[#6c5ce7]/20" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {r === 'all' ? 'Tất cả' : r === 'admin' ? 'Admin' : 'Học viên'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/5 bg-[#10101f] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0a0a14] text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-5">Người dùng</th>
                <th scope="col" className="px-6 py-5">Trạng thái</th>
                <th scope="col" className="px-6 py-5">Ngày tạo</th>
                <th scope="col" className="px-6 py-5 text-right">Quản lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#6c5ce7] mx-auto mb-2" />
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Đang xác thực dữ liệu...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                    Không tìm thấy thành viên nào.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-black text-sm border
                          ${user.role === 'admin' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}
                        `}>
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white mb-0.5 flex items-center gap-2">
                             {user.name || "N/A"}
                             {isSupremeAdmin(user.email) && <ShieldCheck size={12} className="text-[#00cec9]" />}
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border
                        ${user.role === 'admin' 
                          ? "bg-orange-500/5 text-orange-400 border-orange-500/20" 
                          : "bg-blue-500/5 text-blue-400 border-blue-500/20"
                        }
                      `}>
                        {user.role === 'admin' ? <ShieldCheck size={12} /> : <User size={12} />}
                        {user.role === 'admin' ? "Admin" : "Student"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-bold">
                      {user.createdAt ? new Date(user.createdAt.toMillis()).toLocaleDateString("vi-VN") : "---"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isSupremeAdmin(user.email) ? (
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter px-3 py-1 bg-white/5 rounded-lg">Supreme Protected</span>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleToggleAdmin(user)}
                              className={`p-2 rounded-xl transition-all border border-white/5 ${
                                user.role === 'admin' 
                                  ? "hover:bg-red-500/10 hover:text-red-400 text-slate-500" 
                                  : "hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-500"
                              }`}
                              title={user.role === 'admin' ? "Gỡ quyền Admin" : "Cấp quyền Admin"}
                            >
                              {user.role === 'admin' ? <ShieldX size={18} /> : <UserCog size={18} />}
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user)}
                              className="p-2 rounded-xl text-slate-500 hover:bg-red-500/20 hover:text-red-400 border border-white/5 transition-all"
                              title="Xóa vĩnh viễn"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
