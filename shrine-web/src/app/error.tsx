"use client";

import Link from "next/link";
import { useEffect } from "react";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error("AI Shrine page error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0e0c1e] px-6 text-violet-100">
      <section className="w-full max-w-xl rounded-[2rem] border border-violet-300/20 bg-violet-950/45 p-8 text-center shadow-[0_0_70px_rgba(120,88,255,0.2)]">
        <p className="text-xs tracking-[0.3em] text-violet-300/80">TEMPLE PAUSED</p>
        <h1 className="mt-5 text-3xl font-semibold text-violet-50">殿中的灯刚刚轻晃了一下</h1>
        <p className="mt-4 text-sm leading-7 text-violet-200/90">
          这次回音没有稳稳落下。可以重新试一次，也可以先回到神庙入口。
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-violet-200 px-6 py-2.5 text-sm font-medium text-violet-950 hover:bg-white"
          >
            再试一次
          </button>
          <Link
            href="/"
            className="rounded-full border border-violet-200/25 px-6 py-2.5 text-sm text-violet-100 hover:bg-violet-900/45"
          >
            回到神庙入口
          </Link>
        </div>
      </section>
    </main>
  );
}
