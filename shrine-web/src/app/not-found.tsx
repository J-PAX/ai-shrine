import Link from "next/link";
import { emptyResultCopy } from "../../lib/content/copy";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0e0c1e] px-6 text-violet-100">
      <section className="w-full max-w-xl rounded-[2rem] border border-violet-300/20 bg-violet-950/45 p-8 text-center shadow-[0_0_70px_rgba(120,88,255,0.2)]">
        <p className="text-xs tracking-[0.3em] text-violet-300/80">RESULT NOT FOUND</p>
        <h1 className="mt-5 text-3xl font-semibold text-violet-50">{emptyResultCopy.title}</h1>
        <p className="mt-4 text-sm leading-7 text-violet-200/90">{emptyResultCopy.body}</p>
        <Link
          href="/"
          className="mt-7 inline-flex rounded-full bg-violet-200 px-6 py-2.5 text-sm font-medium text-violet-950 hover:bg-white"
        >
          回到神庙入口
        </Link>
      </section>
    </main>
  );
}
