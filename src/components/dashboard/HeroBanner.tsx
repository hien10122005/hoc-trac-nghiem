"use client";

import { motion } from "framer-motion";
import { Flame, Quote } from "lucide-react";
import { useEffect, useState } from "react";

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
  streak: number;
}

export default function HeroBanner({ userName, streak }: HeroBannerProps) {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setQuote(MOTIVATIONAL_QUOTES[randomIndex]);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1b] p-8 md:p-12 border border-white/5 shadow-2xl"
    >
      {/* Background Glows */}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#6c5ce7]/10 blur-[80px]" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#00cec9]/10 blur-[80px]" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 text-center md:text-left">
          <motion.div
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.2 }}
             className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#aca3ff] text-xs font-bold uppercase tracking-widest"
          >
            <span>Bảng điều khiển học viên</span>
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
          className="shrink-0 flex flex-col items-center justify-center p-8 rounded-[2rem] bg-gradient-to-br from-[#ff7675]/10 to-[#fab1a0]/10 border border-[#ff7675]/20 shadow-xl relative group"
        >
          <div className="absolute inset-0 bg-[#ff7675]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] blur-xl" />
          <Flame size={48} className="text-[#ff7675] animate-pulse mb-2" />
          <span className="text-4xl font-black text-white">{streak}</span>
          <span className="text-[10px] font-bold text-[#ff7675] uppercase tracking-widest mt-1">Chuỗi ngày (Streak)</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
