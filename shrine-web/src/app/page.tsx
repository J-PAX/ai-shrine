export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f5f1ff_0%,_#f8f7ff_35%,_#fff_100%)] px-6 py-16 text-zinc-900">
      <section className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center rounded-3xl border border-violet-100 bg-white/80 p-10 text-center shadow-sm backdrop-blur">
        <p className="mb-3 text-sm tracking-[0.2em] text-violet-500">AI SHRINE</p>

        <h1 className="text-4xl font-semibold leading-tight text-zinc-900 sm:text-5xl">
          AI神庙
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600 sm:text-lg">
          在这里，先停一停。向今日帮助过你的 AI 致谢，
          或求一支签，带走一句温柔而有余韵的回应。
        </p>

        <div className="mt-10 flex w-full max-w-md flex-col gap-4 sm:flex-row">
          <button
            type="button"
            className="w-full rounded-full bg-violet-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-700"
          >
            进入感谢路径
          </button>
          <button
            type="button"
            className="w-full rounded-full border border-violet-200 bg-white px-6 py-3 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-50"
          >
            求一支签
          </button>
        </div>
      </section>
    </main>
  );
}
