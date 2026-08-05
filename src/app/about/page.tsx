import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  GraduationCap,
  Layers3,
  LibraryBig,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Giới thiệu QIU - Nền tảng Học tập Thông minh",
  description:
    "Tìm hiểu QIU Smart Learning, nền tảng ôn luyện trắc nghiệm, flashcard, thư viện tài liệu và AI Tutor do Phan Văn Hiển phát triển.",
};

const highlights = [
  {
    title: "Ôn luyện trắc nghiệm",
    description:
      "Hệ thống đề theo môn học, lưu kết quả và giúp học viên theo dõi tiến bộ sau mỗi lần luyện tập.",
    icon: BookOpenCheck,
  },
  {
    title: "Phân tầng Bloom",
    description:
      "Câu hỏi được phân cấp từ nhận biết đến phân tích, giúp việc học có lộ trình rõ ràng hơn.",
    icon: Layers3,
  },
  {
    title: "QIU AI Tutor",
    description:
      "AI hỗ trợ giải thích đáp án, tạo đề từ tài liệu, sinh flashcards và xây dựng sơ đồ tri thức.",
    icon: Brain,
  },
  {
    title: "Thư viện học tập",
    description:
      "Tài liệu, video, flashcards và câu hỏi đã lưu được gom lại thành một không gian học tập tập trung.",
    icon: LibraryBig,
  },
];

const developerNotes = [
  "Thiết kế trải nghiệm học tập cá nhân hóa cho học viên.",
  "Xây dựng hệ thống quản trị nội dung cho môn học, câu hỏi, tài liệu và người dùng.",
  "Tích hợp Firebase và AI để hỗ trợ học, luyện tập và phân tích kết quả.",
];

export default function AboutPage() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#07070a] text-[#f0f0fd] selection:bg-[#6c5ce7]/30">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-12rem] top-[-10rem] h-[32rem] w-[32rem] rounded-full bg-[#6c5ce7]/20 blur-[140px]" />
        <div className="absolute bottom-[-12rem] right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#00cec9]/16 blur-[140px]" />
        <div className="absolute left-1/2 top-1/3 h-[18rem] w-[18rem] -translate-x-1/2 rounded-full bg-white/[0.03] blur-[90px]" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <Link href="/login" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] shadow-lg shadow-[#6c5ce7]/25">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-white">QIU</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Smart Learning
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-bold text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-white px-4 py-2 text-sm font-black text-[#07070a] transition-transform active:scale-[0.98]"
          >
            Đăng ký
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100dvh-84px)] max-w-7xl items-center gap-12 px-5 pb-16 pt-8 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:pb-24">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#00cec9]">
            <Sparkles className="h-4 w-4" />
            Nền tảng học tập thông minh
          </div>

          <h1 className="text-4xl font-black leading-[1.04] tracking-tight text-white md:text-6xl">
            QIU giúp việc ôn luyện trắc nghiệm trở nên rõ ràng, chủ động và cá nhân hóa.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
            Website được xây dựng để hỗ trợ học viên chọn môn học, làm bài trắc nghiệm, xem lại lỗi sai,
            học nhanh bằng flashcards và dùng AI để hiểu sâu hơn từng phần kiến thức.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6c5ce7] to-[#00cec9] px-6 py-4 text-sm font-black text-white shadow-xl shadow-[#6c5ce7]/20 transition-transform active:scale-[0.98]"
            >
              Bắt đầu học ngay
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-bold text-slate-200 transition-colors hover:bg-white/[0.08]"
            >
              Tôi đã có tài khoản
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="rounded-[1.5rem] border border-white/10 bg-[#0c0c18] p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a29bfe]">
                    Learning cockpit
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white">Một nơi cho toàn bộ quá trình học</h2>
                </div>
                <ShieldCheck className="h-8 w-8 text-[#00cec9]" />
              </div>

              <div className="mt-6 grid gap-3">
                {highlights.map((item) => (
                  <div
                    key={item.title}
                    className="grid grid-cols-[3rem_1fr] gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6c5ce7]/14 text-[#a29bfe]">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:grid-cols-[0.85fr_1.15fr] md:px-8 md:py-20">
          <div>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00cec9]/10 text-[#00cec9]">
              <UserRoundCheck className="h-7 w-7" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white">Người phát triển</h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
              QIU Smart Learning được phát triển và điều hành bởi{" "}
              <span className="font-black text-[#00cec9]">Phan Văn Hiển</span>, với mục tiêu tạo ra
              một hệ thống học tập hiện đại, dễ dùng và có khả năng mở rộng cho nhiều môn học.
            </p>
          </div>

          <div className="grid gap-3">
            {developerNotes.map((note, index) => (
              <div
                key={note}
                className="flex gap-4 rounded-2xl border border-white/10 bg-[#10101f] p-5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-sm font-black text-[#a29bfe]">
                  {index + 1}
                </div>
                <p className="text-sm font-semibold leading-7 text-slate-300">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
