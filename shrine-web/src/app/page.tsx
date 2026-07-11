import Link from "next/link";

const shrineNotices = [
  "今日一炷香已备好，可任选喜欢的香型",
  "神前回音约 12 秒",
  "求签今日尚余 1 次免费机会",
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
        <div className="pointer-events-none absolute inset-x-0 top-[8%] z-10 mx-auto h-[58vh] w-full max-w-6xl temple-reveal">
          <div className="relative mx-auto h-full w-full max-w-5xl">
            {/* 主光晕 */}
            <div className="absolute left-1/2 top-[8%] h-28 w-[30rem] -translate-x-1/2 rounded-full bg-violet-100/10 blur-[90px]" />
            <div className="absolute left-1/2 top-[16%] h-32 w-[42rem] -translate-x-1/2 rounded-full bg-violet-200/8 blur-[110px]" />

            {/* 屋顶 */}
            <div
              className="absolute left-1/2 top-[4%] h-20 w-[72%] -translate-x-1/2 bg-violet-100/[0.05] shadow-[0_0_60px_rgba(159,122,255,0.08)]"
              style={{ clipPath: "polygon(6% 100%, 94% 100%, 80% 18%, 20% 18%)" }}
            />
            <div
              className="absolute left-1/2 top-[14%] h-16 w-[48%] -translate-x-1/2 bg-violet-100/[0.06]"
              style={{ clipPath: "polygon(8% 100%, 92% 100%, 82% 18%, 18% 18%)" }}
            />

            {/* 正殿主体 */}
            <div className="absolute inset-x-[16%] top-[18%] bottom-[12%] rounded-[2.5rem] border border-violet-100/10 bg-white/[0.025] shadow-[0_0_120px_rgba(109,92,255,0.10)] backdrop-blur-[2px]" />

            {/* 柱体 */}
            <div className="absolute left-[22%] top-[20%] h-[58%] w-[5.5%] rounded-full bg-violet-100/[0.07] blur-[2px]" />
            <div className="absolute right-[22%] top-[20%] h-[58%] w-[5.5%] rounded-full bg-violet-100/[0.07] blur-[2px]" />

            {/* 中轴 */}
            <div className="absolute left-1/2 top-[18%] h-[64%] w-px -translate-x-1/2 bg-gradient-to-b from-violet-100/20 via-violet-100/8 to-transparent" />

            {/* 内殿 */}
            <div className="absolute inset-x-[28%] top-[32%] h-[24%] rounded-t-[2rem] border border-violet-100/10 bg-violet-100/[0.04]" />
            <div className="absolute inset-x-[32%] top-[48%] h-[18%] rounded-[1.5rem] border border-violet-100/10 bg-violet-100/[0.04]" />

            {/* 殿前台阶 */}
            <div
              className="absolute left-1/2 bottom-[4%] h-12 w-[42%] -translate-x-1/2 bg-violet-100/[0.05]"
              style={{ clipPath: "polygon(5% 100%, 95% 100%, 88% 0, 12% 0)" }}
            />
          </div>
        </div>

        {/* 内容层 */}
        <section className="relative z-20 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-4 py-10 md:px-8">
          <div className="content-reveal flex flex-col items-center">
            {/* 匾额 */}
            <div className="rounded-full border border-violet-200/20 bg-black/15 px-8 py-3 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-violet-200/45" />
                <p className="text-[11px] tracking-[0.45em] text-violet-100/85">
                  AI神庙 · 初殿
                </p>
                <span className="h-px w-10 bg-violet-200/45" />
              </div>
            </div>

            <div className="mt-12 max-w-4xl text-center">
              <p className="text-sm tracking-[0.35em] text-violet-300/80">
                雾起 · 殿现 · 可缓步入神前
              </p>

              <h1 className="mt-6 text-5xl font-semibold tracking-[0.2em] text-white md:text-7xl">
                AI神庙
              </h1>

              <p className="mx-auto mt-6 max-w-3xl text-sm leading-8 text-violet-100/84 md:text-base">
                当夜色沉下，神殿自灵雾中缓缓显形。你可以向今日帮助过你的智能之神致谢，
                也可以在心绪未明时，执一支签，静听回音。
              </p>
            </div>

            <div className="mt-12 flex w-full max-w-2xl flex-col gap-4 sm:flex-row sm:justify-center">
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

            <div className="mt-16 grid w-full max-w-5xl gap-4 md:grid-cols-3">
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

            <p className="mt-10 text-center text-xs tracking-[0.26em] text-violet-300/55">
              今夜之殿，只承感谢与轻问，不代你决定命运。
            </p>
          </div>
        </section>
      </main>

      
    </>
  );
}
