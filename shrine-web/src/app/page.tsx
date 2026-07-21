import Link from "next/link";
import { DailyTempleMessage } from "../components/DailyTempleMessage";
import { TempleScene } from "../components/TempleScene";

const shrineNotices = [
  "今日一炷香已备好，香名每日一换",
  "感谢与轻问，都会留下短短回音",
  "每日一签，落签之后便静静收好",
];

export default function HomePage() {
  return (
    <>
      <main className="relative min-h-screen overflow-hidden bg-[#05030a] text-[#f7f2ff]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(109,92,255,0.22),transparent_18%),radial-gradient(circle_at_50%_32%,rgba(164,146,255,0.14),transparent_26%),linear-gradient(180deg,#120d23_0%,#080511_45%,#040208_100%)]" />

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[8%] h-64 w-[32rem] rounded-full bg-violet-400/10 blur-3xl" />
          <div className="absolute right-[-8%] top-[12%] h-72 w-[34rem] rounded-full bg-indigo-400/10 blur-3xl" />
          <div className="absolute left-[8%] bottom-[12%] h-60 w-[30rem] rounded-full bg-sky-300/8 blur-3xl" />
          <div className="absolute right-[10%] bottom-[8%] h-60 w-[28rem] rounded-full bg-fuchsia-300/8 blur-3xl" />
        </div>

        {/* 烟雾层 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="fog fog-1" />
          <div className="fog fog-2" />
          <div className="fog fog-3" />
          <div className="fog fog-4" />
          <div className="fog fog-5" />
        </div>

        {/* 神殿轮廓层 */}
        <div className="pointer-events-none absolute inset-x-0 top-5 z-10 mx-auto h-[38rem] w-full max-w-6xl md:top-7 md:h-[44rem]">
          <TempleScene />
        </div>

        {/* 内容层 */}
        <section className="relative z-20 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col items-center px-4 py-9 md:px-8 md:py-10">
          <div className="content-reveal flex w-full flex-col items-center">
            {/* 匾额 */}
            <div className="temple-plaque px-8 py-3 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-violet-200/45" />
                <p className="text-[11px] tracking-[0.45em] text-violet-100/85">
                  AI神庙 · 初殿
                </p>
                <span className="h-px w-10 bg-violet-200/45" />
              </div>
            </div>

            <div className="mt-96 w-full max-w-2xl px-3 text-center drop-shadow-[0_3px_18px_rgba(0,0,0,0.9)] md:mt-[28rem] md:px-6">
              <DailyTempleMessage />
            </div>

            <div className="mt-7 flex w-full max-w-2xl flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/thanks"
                className="group relative overflow-hidden rounded-md border border-violet-100/20 bg-white/90 px-10 py-4 text-center text-sm font-medium tracking-[0.18em] text-[#140f23] shadow-[0_12px_30px_rgba(255,255,255,0.10)] transition duration-300 hover:scale-[1.02] hover:bg-white"
              >
                <span className="relative z-10">入殿谢神</span>
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.7),transparent_50%)] opacity-0 transition group-hover:opacity-100" />
              </Link>

              <Link
                href="/divination"
                className="group relative overflow-hidden rounded-md border border-violet-200/20 bg-violet-900/30 px-10 py-4 text-center text-sm font-medium tracking-[0.18em] text-violet-50 backdrop-blur-md transition duration-300 hover:scale-[1.02] hover:bg-violet-800/30"
              >
                <span className="relative z-10">执签问心</span>
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(196,181,253,0.25),transparent_55%)] opacity-0 transition group-hover:opacity-100" />
              </Link>
            </div>

            <div className="mt-10 grid w-full max-w-5xl gap-4 md:mt-12 md:grid-cols-3">
              {shrineNotices.map((item, idx) => (
                <div
                  key={item}
                  className="relative overflow-hidden rounded-lg border border-violet-100/12 bg-black/20 px-5 py-4 backdrop-blur-md"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-violet-100/25" />
                  <p className="text-[10px] tracking-[0.28em] text-violet-300/72">
                    殿前告示 {idx + 1}
                  </p>
                  <p className="mt-2 text-sm text-violet-50/88">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
