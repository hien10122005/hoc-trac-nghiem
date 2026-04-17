"use client";

import { 
  BookOpen, 
  Database, 
  Users, 
  Activity,
  Plus,
  ArrowUpRight,
  TrendingUp,
  FileText
} from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    { 
      label: "Tổng môn học", 
      value: "12", 
      icon: BookOpen, 
      color: "from-blue-500 to-cyan-400",
      trend: "+2 tháng này" 
    },
    { 
      label: "Ngân hàng câu hỏi", 
      value: "1,250", 
      icon: Database, 
      color: "from-purple-500 to-pink-500",
      trend: "+120 tuần này" 
    },
    { 
      label: "Tổng học viên", 
      value: "450", 
      icon: Users, 
      color: "from-emerald-500 to-teal-400",
      trend: "+45 thành viên mới" 
    },
    { 
      label: "Lượt thi hôm nay", 
      value: "86", 
      icon: Activity, 
      color: "from-orange-500 to-yellow-400",
      trend: "+15% so với hôm qua" 
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Chào mừng trở lại, <span className="bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] bg-clip-text text-transparent">Admin</span>
          </h1>
          <p className="text-slate-400 mt-1">Hôm nay hệ thống của bạn đang hoạt động rất tốt.</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-all border border-white/5">
            <FileText size={18} />
            <span>Xuất báo cáo</span>
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-[#6c5ce7] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#5b4bc4] transition-all shadow-lg shadow-[#6c5ce7]/20">
            <Plus size={18} />
            <span>Thêm môn học</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div 
            key={stat.label}
            className="group relative overflow-hidden rounded-2xl bg-[#10101f] p-6 border border-white/5 hover:border-[#6c5ce7]/30 transition-all duration-500 shadow-xl"
            style={{ 
              animation: "fadeInUp 0.6s ease-out both",
              animationDelay: `${i * 100}ms` 
            }}
          >
            <div className="flex items-start justify-between">
              <div className={`rounded-xl bg-gradient-to-br ${stat.color} p-3 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon size={22} className="text-white" />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#00cec9] bg-[#00cec9]/10 px-2 py-1 rounded-full uppercase tracking-wider">
                <TrendingUp size={10} />
                <span>Live</span>
              </div>
            </div>
            
            <div className="mt-6">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="mt-1 text-3xl font-bold text-white">{stat.value}</h3>
              <p className="mt-2 text-xs text-slate-400">
                <span className="text-[#00cec9]">{stat.trend}</span>
              </p>
            </div>
            
            {/* Background decoration */}
            <div className={`absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-gradient-to-br ${stat.color} opacity-[0.03] blur-2xl group-hover:opacity-10 transition-opacity`} />
          </div>
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity List */}
        <div className="lg:col-span-2 rounded-2xl bg-[#10101f] border border-white/5 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h3 className="text-lg font-semibold text-white">Hoạt động gần đây</h3>
            <button className="text-xs font-medium text-[#6c5ce7] hover:underline flex items-center gap-1">
              Xem tất cả <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {[
                { user: "Nguyễn Văn A", action: "vừa hoàn thành bài thi", target: "Toán cao cấp A1", time: "2 phút trước" },
                { user: "Trần Thị B", action: "đã thêm câu hỏi mới vào", target: "Tiếng Anh chuyên ngành", time: "15 phút trước" },
                { user: "Lê Văn C", action: "vừa đăng ký tài khoản mới", target: "", time: "1 giờ trước" },
                { user: "Phạm Minh D", action: "đã cập nhật tài liệu cho", target: "Vật lý đại cương", time: "3 giờ trước" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:border-[#6c5ce7]/50 transition-colors">
                      {item.user.split(" ").pop()?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {item.user} <span className="text-slate-500 font-normal">{item.action}</span> {item.target && <span className="text-[#6c5ce7]">{item.target}</span>}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">{item.time}</p>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/5 rounded-lg transition-all">
                    <ArrowUpRight size={14} className="text-slate-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Tips/Info */}
        <div className="space-y-8">
          <div className="rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] p-6 text-white shadow-xl shadow-[#6c5ce7]/20 relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="font-bold text-lg">Mẹo quản trị</h3>
              <p className="text-sm text-white/80 mt-2 leading-relaxed">
                Bạn có thể nhấn tổ hợp phím <code className="bg-black/20 px-1 rounded">Ctrl + K</code> để mở nhanh thanh tìm kiếm toàn hệ thống.
              </p>
              <button className="mt-6 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#6c5ce7] opacity-90 hover:opacity-100 transition-opacity">
                Khám phá ngay
              </button>
            </div>
            {/* Background decoration */}
            <Activity className="absolute -right-8 -bottom-8 h-40 w-40 text-black/5 rotate-12 group-hover:scale-110 transition-transform duration-500" />
          </div>

          <div className="rounded-2xl bg-[#10101f] border border-white/5 p-6 shadow-xl">
             <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
               <TrendingUp size={18} className="text-[#00cec9]" />
               <span>Trạng thái máy chủ</span>
             </h3>
             <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Database (Firestore)</span>
                    <span className="text-emerald-400 font-medium">99.9%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[99.9%] bg-emerald-400 rounded-full" />
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Lưu trữ (Storage)</span>
                    <span className="text-[#6c5ce7] font-medium">75%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[75%] bg-[#6c5ce7] rounded-full" />
                  </div>
               </div>
               <div className="pt-2">
                 <p className="text-[10px] text-slate-500 text-center italic">Cập nhật tự động sau mỗi 30s</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
