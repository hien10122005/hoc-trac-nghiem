import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  GraduationCap,
  Layers3,
  LibraryBig,
  LineChart,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Giới thiệu QIU - Nền tảng Học tập Thông minh",
  description:
    "Tìm hiểu QIU Smart Learning, nền tảng ôn luyện trắc nghiệm, flashcard, thư viện tài liệu và AI Tutor do Phan Văn Hiển phát triển.",
};

const features = [
  {
    title: "Luyện đề theo môn",
    description: "Chọn môn học, làm bài trắc nghiệm và xem kết quả ngay sau khi hoàn thành.",
    icon: BookOpenCheck,
  },
  {
    title: "Tư duy Bloom",
    description: "Câu hỏi được phân tầng từ nhận biết, thông hiểu đến vận dụng và phân tích.",
    icon: Layers3,
  },
  {
    title: "AI Tutor",
    description: "Giải thích đáp án, phân tích lỗi sai và gợi ý bài luyện tập bằng AI.",
    icon: Brain,
  },
  {
    title: "Thư viện tài liệu",
    description: "Gom tài liệu, video, flashcards và câu hỏi đã lưu vào một không gian học.",
    icon: LibraryBig,
  },
];

const stats = [
  { value: "4", label: "cấp độ Bloom" },
  { value: "AI", label: "hỗ trợ học tập" },
  { value: "24/7", label: "truy cập mọi lúc" },
];

const developerNotes = [
  "Xây dựng trải nghiệm học tập rõ ràng, hiện đại và dễ tiếp cận cho học viên.",
  "Phát triển hệ thống quản trị môn học, câu hỏi, tài liệu, flashcards và người dùng.",
  "Tích hợp Firebase cùng AI để hỗ trợ luyện tập, phân tích kết quả và cá nhân hóa lộ trình.",
];

export default function AboutPage() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#07070a] text-[#f0f0fd] selection:bg-[#6c5ce7]/30">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />
        <div className="absolute left-[-18rem] top-[-18rem] h-[42rem] w-[42rem] rounded-full bg-[#6c5ce7]/20 blur-[150px]" />
        <div className="absolute bottom-[-16rem] right-[-14rem] h-[38rem] w-[38rem] rounded-full bg-[#00cec9]/16 blur-[150px]" />
      </div>

      <header className="relative z-10 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/about" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6c5ce7] shadow-lg shadow-[#6c5ce7]/25">
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

      <section className="relative z-10 mx-auto grid min-h-[calc(100dvh-80px)] max-w-7xl items-center gap-10 px-5 pb-16 pt-8 md:grid-cols-[0.98fr_1.02fr] md:px-8 md:pb-20">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#00cec9]/20 bg-[#00cec9]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#00cec9]">
            <Sparkles className="h-4 w-4" />
            Giới thiệu nền tảng
          </div>

          <h1 className="max-w-3xl text-4xl font-black leading-[1.03] tracking-tight text-white md:text-6xl">
            Học trắc nghiệm thông minh hơn với QIU Smart Learning.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
            QIU là website hỗ trợ học viên ôn luyện theo môn học, theo dõi tiến bộ, xem lại lỗi sai
            và sử dụng AI để hiểu sâu hơn từng câu hỏi.
          </p>

          <div className="mt-8 grid max-w-xl grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
            {stats.map((item) => (
              <div key={item.label} className="border-r border-white/10 p-4 last:border-r-0">
                <p className="text-2xl font-black text-white">{item.value}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6c5ce7] px-6 py-4 text-sm font-black text-white shadow-xl shadow-[#6c5ce7]/25 transition-colors hover:bg-[#5b4bc4] active:scale-[0.98]"
            >
              Bắt đầu học ngay
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-bold text-slate-200 transition-colors hover:bg-white/[0.08]"
            >
              Đăng nhập hệ thống
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2.5rem] bg-[#6c5ce7]/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#10101f] shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-[#00cec9]" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                QIU dashboard
              </p>
            </div>

            <div className="grid gap-5 p-5 md:p-6">
              <div className="rounded-3xl border border-white/10 bg-[#151528] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#00cec9]">
                      Tiến độ hôm nay
                    </p>
                    <h2 className="mt-3 text-3xl font-black text-white">86%</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Hoàn thành mục tiêu luyện tập và củng cố kiến thức trọng tâm.
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00cec9]/10 text-[#00cec9]">
                    <LineChart className="h-7 w-7" />
                  </div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full w-[86%] rounded-full bg-[#00cec9]" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                  <BarChart3 className="h-7 w-7 text-[#a29bfe]" />
                  <p className="mt-5 text-sm font-black text-white">Phân tích kết quả</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Theo dõi điểm số, số bài đã làm và môn cần cải thiện.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                  <ShieldCheck className="h-7 w-7 text-[#00cec9]" />
                  <p className="mt-5 text-sm font-black text-white">Học có định hướng</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Tập trung vào phần còn yếu thay vì học dàn trải.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-[#6c5ce7]/20 bg-[#6c5ce7]/10 p-5">
                <div className="flex items-center gap-3">
                  <Brain className="h-7 w-7 text-[#a29bfe]" />
                  <div>
                    <p className="text-sm font-black text-white">QIU AI Tutor</p>
                    <p className="text-sm text-slate-400">Giải thích ngắn gọn, dễ hiểu, đúng trọng tâm.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00cec9]">
              Điểm nổi bật
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
              Một nền tảng gọn, đủ sâu và tập trung vào kết quả học tập.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((item) => (
              <article
                key={item.title}
                className="rounded-3xl border border-white/10 bg-[#10101f] p-6 transition-colors hover:border-[#6c5ce7]/40"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6c5ce7]/12 text-[#a29bfe]">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-base font-black text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-8 px-5 py-16 md:grid-cols-[0.9fr_1.1fr] md:px-8 md:py-20">
        <div className="rounded-[2rem] border border-white/10 bg-[#10101f] p-7">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00cec9]/10 text-[#00cec9]">
            <UserRoundCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-7 text-3xl font-black tracking-tight text-white">Người phát triển</h2>
          <p className="mt-4 text-base leading-8 text-slate-300">
            QIU Smart Learning được phát triển và điều hành bởi{" "}
            <span className="font-black text-[#00cec9]">Phan Văn Hiển</span>, với mục tiêu tạo ra
            một hệ thống học tập hiện đại, dễ dùng và có khả năng mở rộng cho nhiều môn học.
          </p>
        </div>

        <div className="grid gap-4">
          {developerNotes.map((note) => (
            <div
              key={note}
              className="flex gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5"
            >
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#00cec9]" />
              <p className="text-sm font-semibold leading-7 text-slate-300">{note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-5 pb-16 md:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-[#6c5ce7] p-8 text-white md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                Sẵn sàng trải nghiệm QIU?
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/80">
                Tạo tài khoản học viên để bắt đầu ôn luyện, lưu tiến độ và sử dụng các công cụ học tập thông minh.
              </p>
            </div>
            <Link
              href="/register"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-[#07070a] transition-transform active:scale-[0.98]"
            >
              Tạo tài khoản
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
