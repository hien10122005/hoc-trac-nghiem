"use client";

import { motion } from "framer-motion";
import { Quote, LogOut, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
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

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setQuote(MOTIVATIONAL_QUOTES[randomIndex]);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="relative overflow-hidden rounded-[3rem] bg-[#0c0c1a] border border-white/5 p-10 md:p-14 shadow-2xl"
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#6c5ce7]/10 to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#6c5ce7]/10 blur-[100px]" />
      <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#00cec9]/10 blur-[100px]" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Text Content */}
        <div className="lg:col-span-8 space-y-6">
          <motion.div
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.2 }}
             className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#aca3ff] text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-[#aca3ff] animate-pulse" />
            <span>AI Powered Learning Hub</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter text-white leading-[1.1]">
            Chinh phục <br />
            <span className="bg-gradient-to-r from-[#6c5ce7] via-[#a29bfe] to-[#00cec9] bg-clip-text text-transparent">Kiến thức mới</span>
          </h1>

          <div className="flex items-start gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/5 max-w-2xl backdrop-blur-sm relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#6c5ce7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Quote size={24} className="text-[#6c5ce7] shrink-0 mt-1" />
            <div>
              <p className="text-slate-300 italic text-base md:text-lg leading-relaxed">{quote}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-widest">— Câu nói truyền cảm hứng</p>
            </div>
          </div>
        </div>

        {/* Brand/Quick Info Card */}
        <div className="lg:col-span-4 flex justify-center lg:justify-end">
           <motion.div 
             whileHover={{ scale: 1.02 }}
             className="relative p-1 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent shadow-2xl"
           >
              <div className="bg-[#0f0f1b] rounded-[2.4rem] p-8 space-y-6 w-full max-w-[280px]">
                 <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] flex items-center justify-center p-0.5 shadow-lg shadow-[#6c5ce7]/20">
                    <div className="h-full w-full rounded-[14px] bg-[#0f0f1b] flex items-center justify-center">
                       <GraduationCap className="text-white h-8 w-8" />
                    </div>
                 </div>
                 <div className="text-center space-y-1">
                    <h3 className="text-xl font-black text-white tracking-tight">QIU ACADEMY</h3>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Version 2026.4.1</p>
                 </div>
                 <div className="pt-4 flex flex-col gap-2">
                    <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-center text-slate-400">
                       Hệ thống thông minh
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-[#6c5ce7]/10 border border-[#6c5ce7]/20 text-[10px] font-bold text-center text-[#6c5ce7]">
                       Đã sẵn sàng ôn luyện
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
