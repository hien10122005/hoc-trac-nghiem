"use client";

import { motion } from "framer-motion";
import { Flame, Quote, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const MOTIVATIONAL_QUOTES = [
  "Học, học nữa, học mãi. - Lênin",
  "Đừng hổ thẹn khi không biết, chỉ hổ thẹn khi không học. - Ngạn ngữ",
  "Tri thức là sức mạnh. - Francis Bacon",
  "Học vấn có những chùm rễ đắng cay nhưng hoa quả lại ngọt ngào. - Aristoteles",
  "Đầu tư vào kiến thức đem lại lợi nhuận cao nhất. - Benjamin Franklin",
  "Thiên tài là 1% cảm hứng và 99% là mồ hôi. - Thomas Edison",
  "Bạn không bao giờ quá già để đặt một mục tiêu mới hay mơ một giấc mơ mới. - C.S. Lewis",
  "Hành trình ngàn dặm bắt đầu từ một bước chân. - Lão Tử",
  "Sự học như đi thuyền trên dòng nước ngược, không tiến ắt sẽ lùi. - Tục ngữ",
  "Mục tiêu của giáo dục không phải là dạy cách kiếm sống mà là cách sống."
];

interface HeroBannerProps {
  userName: string;
}

export default function HeroBanner({ userName }: HeroBannerProps) {
  const [quote, setQuote] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!quote) {
      const t = setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
        setQuote(MOTIVATIONAL_QUOTES[randomIndex]);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [quote]);

  const handleLogout = async () => {
    const toastId = toast.loading("Đang đăng xuất...");
    try {
      await signOut(auth);
      toast.success("Hẹn gặp lại bạn sớm!", { id: toastId });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Lỗi khi đăng xuất", { id: toastId });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1b] p-8 md:p-12 border border-white/5 shadow-2xl"
    >
      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all group"
      >
        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-wider">Đăng xuất</span>
      </button>

      {/* Background Glows */}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#6c5ce7]/10 blur-[80px]" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#00cec9]/10 blur-[80px]" />

      <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 text-center md:text-left">
          <motion.div
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.2 }}
             className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#aca3ff] text-xs font-bold uppercase tracking-widest"
          >
            <span>Cổng thông tin học tập DNC</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Chào mừng, <span className="bg-gradient-to-r from-[#6c5ce7] via-[#a29bfe] to-[#00cec9] bg-clip-text text-transparent">{userName}</span>!
          </h1>
          <div className="flex items-center justify-center md:justify-start gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/5 max-w-lg">
            <Quote size={20} className="text-[#6c5ce7] shrink-0" />
            <p className="text-slate-400 italic text-sm md:text-base">{quote}</p>
          </div>
        </div>

        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="shrink-0 grid grid-cols-2 gap-3 p-6 rounded-[2rem] bg-white/5 border border-white/5 shadow-xl relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#6c5ce7]/5 to-[#00cec9]/5 opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center space-y-1">
             <span className="text-2xl font-black text-white">Quiz</span>
             <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest text-center">Ôn luyện trắc nghiệm</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#6c5ce7]/10 border border-[#6c5ce7]/20 flex flex-col items-center justify-center space-y-1">
             <span className="text-2xl font-black text-[#6c5ce7]">Library</span>
             <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest text-center">Kho tài liệu số</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
