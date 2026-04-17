"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, Trash2, Shield, User, Search, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Timestamp | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Tạm thời không build orderBy('createdAt', 'desc') nếu chưa có index
    const q = query(collection(db, "users"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      
      // Sort manually client side to avoid Firebase index error
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

    return () => unsubscribe();
  }, []);

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.role === "admin") {
      toast.error("Không thể xóa tài khoản Quản trị viên (Admin)!");
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

  const filteredUsers = users.filter(u => 
    (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
    (u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || "")
  );

  const studentCount = users.filter(u => u.role === "student").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Tài khoản <span className="bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] bg-clip-text text-transparent">Học viên</span>
          </h1>
          <p className="text-slate-400 mt-1">Quản lý và theo dõi thông tin người dùng trên toàn hệ thống.</p>
        </div>
      </div>

      {/* Widgets & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Students Widget */}
        <div className="rounded-2xl border border-white/5 bg-[#10101f] p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#00cec9]/10 blur-xl group-hover:bg-[#00cec9]/20 transition-all" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#00cec9] to-[#00b0b9] p-0.5 shadow-lg shadow-[#00cec9]/20">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#10101f]">
                <Users size={24} className="text-[#00cec9]" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Tổng số học viên</p>
              <h3 className="text-3xl font-bold text-white mt-1">{loading ? "..." : studentCount}</h3>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="md:col-span-2 relative h-full flex items-center">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo Tên hoặc Email học viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-white/5 bg-[#10101f] py-5 pl-12 pr-4 text-sm text-white outline-none focus:border-[#6c5ce7]/50 focus:ring-4 focus:ring-[#6c5ce7]/5 transition-all shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-3xl border border-white/5 bg-[#10101f] shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-lg font-bold text-white">Danh sách thành viên đăng ký</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0a0a14] text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-5">Người dùng</th>
                <th scope="col" className="px-6 py-5">Vai trò</th>
                <th scope="col" className="px-6 py-5">Ngày tham gia</th>
                <th scope="col" className="px-6 py-5 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex justify-center flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[#6c5ce7]" />
                      <span className="text-slate-500 font-medium">Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Không tìm thấy thành viên nào phù hợp với tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-bold text-lg
                          ${user.role === 'admin' ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}
                        `}>
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white mb-0.5">{user.name || "Chưa cập nhật tên"}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide border
                        ${user.role === 'admin' 
                          ? "bg-orange-500/10 text-orange-400 border-orange-500/20" 
                          : "bg-[#00cec9]/10 text-[#00cec9] border-[#00cec9]/20"
                        }
                      `}>
                        {user.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                        {user.role === 'admin' ? "Quản trị viên" : "Học viên"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {user.createdAt 
                        ? new Date(user.createdAt.toMillis()).toLocaleDateString("vi-VN", {
                            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                          })
                        : "Không xác định"
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role !== 'admin' ? (
                        <button 
                          onClick={() => handleDeleteUser(user)}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                          title="Xóa học viên"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-slate-600 mr-2 opacity-0 group-hover:opacity-100">Bất khả xâm phạm</span>
                      )}
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
