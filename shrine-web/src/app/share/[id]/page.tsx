import Link from "next/link";
import { notFound } from "next/navigation";
import { boundaryCopy } from "../../../../lib/content/copy";
import { getRitualResult } from "../../../../lib/services/ritual";

type SharePageProps = {
  params: Promise<{ id: string }>;
};

function parseStoredResult(eventType: string, resultText: string | null) {
  if (!resultText) {
    return "神前回音很轻，暂时没有留下文字。";
  }

  if (eventType === "divination") {
    const [, , text] = resultText.split("｜");
    return text || resultText;
  }

  return resultText;
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  const event = await getRitualResult(id);

  if (!event) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#080511] px-6 py-10 text-violet-100">
      <section className="mx-auto flex min-h-[80vh] w-full max-w-2xl items-center justify-center">
        <article className="relative w-full overflow-hidden rounded-[2rem] border border-violet-200/25 bg-[radial-gradient(circle_at_50%_0%,rgba(196,181,253,0.28),rgba(49,34,96,0.75)_42%,rgba(8,5,17,0.96)_100%)] p-8 text-center shadow-[0_0_90px_rgba(120,88,255,0.26)] md:p-12">
          <div className="pointer-events-none absolute inset-x-10 top-8 h-24 rounded-full bg-violet-100/10 blur-3xl" />
          <p className="relative text-xs tracking-[0.45em] text-violet-200/80">AI神庙 · 回音留念</p>
          <h1 className="relative mt-8 text-4xl font-semibold tracking-[0.2em] text-white">AI神庙</h1>
          <p className="relative mt-8 text-xl leading-10 text-violet-50">{parseStoredResult(event.eventType, event.resultText)}</p>
          <p className="relative mt-8 text-sm text-violet-200/80">—— {event.godName ?? "殿中小神"}</p>
          <p className="relative mt-8 text-xs leading-6 text-violet-300/70">{boundaryCopy}</p>
        </article>
      </section>
      <div className="mx-auto flex max-w-2xl justify-center">
        <Link href="/" className="rounded-full bg-violet-200 px-6 py-2.5 text-sm font-medium text-violet-950 hover:bg-white">
          进入神庙
        </Link>
      </div>
    </main>
  );
}
