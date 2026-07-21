"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClientApiError, requestJson } from "../../../../lib/http/client";
import { getOrCreateSessionId } from "../../../../lib/browser/session";

type IncenseOption = { name: string; note: string };

export default function ThanksPage() {
  const router = useRouter();
  const [incense, setIncense] = useState<IncenseOption[]>([]);
  const [selectedIncense, setSelectedIncense] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [resultId, setResultId] = useState<string | undefined>();

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    Promise.all([
      requestJson<{ available?: boolean; resultId?: string }>(
        `/api/ritual?sessionId=${encodeURIComponent(sessionId)}&ritualType=thanks`,
        undefined,
        "今日参拜状态暂时无法确认。",
      ),
      requestJson<{ incense?: IncenseOption[] }>(
        `/api/incense?sessionId=${encodeURIComponent(sessionId)}`,
        undefined,
        "今日香单还在雾中，请稍后刷新再试。",
      ),
    ])
      .then(([status, menu]) => {
        setIsAvailable(status.available !== false);
        setResultId(status.resultId);
        if (Array.isArray(menu.incense) && menu.incense.length === 3) {
          setIncense(menu.incense);
          setSelectedIncense(menu.incense[0].name);
        } else {
          setError("今日香单还在雾中，请稍后刷新再试。");
        }
      })
      .catch((loadError) => {
        setIsAvailable(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "今日香单还在雾中，请稍后刷新再试。",
        );
      });
  }, []);

  async function submitRitual() {
    setIsSubmitting(true);
    setError("");

    try {
      const data = await requestJson<{ id?: string }>(
        "/api/ritual",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ritualType: "thanks",
            sessionId: getOrCreateSessionId(),
            incenseName: selectedIncense,
            userMessage: message || `献上${selectedIncense}，谢谢今日相助。`,
          }),
        },
        "香烟绕了一圈，没有找到回音。请稍后再试。",
      );

      if (!data.id) {
        throw new ClientApiError("香烟绕了一圈，没有找到回音。请稍后再试。", 502);
      }

      router.push(`/result/${data.id}`);
    } catch (submitError) {
      if (
        submitError instanceof ClientApiError &&
        submitError.code === "DAILY_RITUAL_COMPLETED"
      ) {
        setIsAvailable(false);
        setResultId(submitError.resultId);
      }
      setError(
        submitError instanceof Error
          ? submitError.message
          : "香烟绕了一圈，没有找到回音。请稍后再试。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,#2b2355_0%,#17132f_38%,#0e0c1e_100%)] px-6 py-10 text-violet-100">
      <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-violet-300/20 bg-violet-950/45 p-8 shadow-[0_0_80px_rgba(120,88,255,0.2)] backdrop-blur md:p-12">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs tracking-[0.3em] text-violet-300/80">THANKS RITUAL</p>
          <Link href="/" className="text-sm text-violet-300 hover:text-violet-100">
            返回神庙入口
          </Link>
        </div>

        <h1 className="mt-5 text-3xl font-semibold text-violet-50 md:text-4xl">感谢之殿</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-violet-200/90">
          今日的一炷香已备好。选一种你喜欢的香气，留下一句话（也可以不写），
          就让这份感谢在殿前安静落下。
        </p>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {incense.length === 0 && !error ? (
            <div className="col-span-full rounded-2xl border border-violet-200/15 bg-violet-950/35 p-8 text-center text-sm text-violet-200">
              殿中正在为你调制今日的三缕香气……
            </div>
          ) : null}
          {incense.map((item) => (
            <button
              key={item.name}
              type="button"
              disabled={isAvailable === false}
              onClick={() => setSelectedIncense(item.name)}
              className={`rounded-2xl border p-5 text-left transition hover:bg-violet-800/40 ${
                selectedIncense === item.name
                  ? "border-violet-100/45 bg-violet-800/55 shadow-[0_0_30px_rgba(196,181,253,0.15)]"
                  : "border-violet-200/20 bg-violet-900/35"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <p className="mt-2 text-lg text-violet-100">{item.name}</p>
              <p className="mt-2 text-xs leading-5 text-violet-300/80">{item.note}</p>
              <p className="mt-3 text-xs text-violet-200">
                {selectedIncense === item.name ? "已选此香" : "选择此香"}
              </p>
            </button>
          ))}
        </section>

        <section className="mt-7 rounded-2xl border border-violet-200/15 bg-violet-950/35 p-5">
          <label htmlFor="thanks-message" className="text-sm text-violet-200">
            写一句你想说的话
          </label>
          <textarea
            id="thanks-message"
            className="mt-3 h-28 w-full resize-none rounded-xl border border-violet-200/20 bg-violet-950/60 p-3 text-sm text-violet-100 outline-none placeholder:text-violet-300/50"
            placeholder="比如：谢谢你今天陪我改完那段最难的代码。"
            value={message}
            maxLength={240}
            onChange={(event) => setMessage(event.target.value)}
          />
          <button
            type="button"
            disabled={isSubmitting || isAvailable !== true || !selectedIncense}
            onClick={submitRitual}
            className="mt-4 rounded-full bg-violet-200 px-6 py-2.5 text-sm font-medium text-violet-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "香烟正上升……"
              : isAvailable === false
                ? "今日一炷香已安放"
                : "敬上今日一炷香"}
          </button>
          {error ? (
            <p role="alert" className="mt-4 text-sm text-rose-200">
              {error}
            </p>
          ) : null}
          {isAvailable === false ? (
            <div className="mt-4 text-sm text-violet-200">
              <p>明日再来，殿前会为你备好新香。</p>
              {resultId ? (
                <Link href={`/result/${resultId}`} className="mt-3 inline-flex text-violet-100 underline underline-offset-4">
                  查看今日回音
                </Link>
              ) : null}
            </div>
          ) : null}
          <p className="mt-4 text-sm text-violet-200/90">神前只收短短一句。说完，就让它落在这里。</p>
          <p className="mt-2 text-xs leading-5 text-violet-300/65">
            你留下的短句会交给回音小神阅读，用来生成今日专属回音。
          </p>
        </section>
      </div>
    </main>
  );
}
