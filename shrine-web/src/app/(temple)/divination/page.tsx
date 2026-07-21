"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ClientApiError, requestJson } from "../../../../lib/http/client";
import { getOrCreateSessionId } from "../../../../lib/browser/session";
import { FortuneCylinder } from "../../../components/FortuneCylinder";

function waitForRitualMoment() {
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const duration = prefersReducedMotion ? 180 : 1_050;

  return new Promise<void>((resolve) => window.setTimeout(resolve, duration));
}

export default function DivinationPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [resultId, setResultId] = useState<string | undefined>();
  const [statusFailed, setStatusFailed] = useState(false);
  const submitLock = useRef(false);

  useEffect(() => {
    const sessionId = getOrCreateSessionId();

    requestJson<{ available?: boolean; resultId?: string }>(
      `/api/ritual?sessionId=${encodeURIComponent(sessionId)}&ritualType=divination`,
      undefined,
      "今日签位暂时无法确认。",
    )
      .then((data) => {
        setStatusFailed(false);
        setIsAvailable(data.available === true);
        setResultId(data.resultId);
      })
      .catch((statusError) => {
        setStatusFailed(true);
        setError(statusError instanceof Error ? statusError.message : "今日签位暂时无法确认。");
      });
  }, []);

  async function drawFortune() {
    if (submitLock.current) return;

    submitLock.current = true;
    setIsSubmitting(true);
    setError("");
    let isNavigating = false;

    try {
      const [requestResult] = await Promise.allSettled([
        requestJson<{ id?: string }>(
          "/api/ritual",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ritualType: "divination",
              sessionId: getOrCreateSessionId(),
              userMessage: question,
            }),
          },
          "签筒轻轻晃了一下，但没有落签。请稍后再试。",
        ),
        waitForRitualMoment(),
      ]);

      if (requestResult.status === "rejected") {
        throw requestResult.reason;
      }

      const data = requestResult.value;

      if (!data.id) {
        throw new ClientApiError("签筒轻轻晃了一下，但没有落签。请稍后再试。", 502);
      }

      router.push(`/result/${data.id}`);
      isNavigating = true;
    } catch (drawError) {
      if (
        drawError instanceof ClientApiError &&
        drawError.code === "DAILY_RITUAL_COMPLETED"
      ) {
        setIsAvailable(false);
        setResultId(drawError.resultId);
      }
      setError(
        drawError instanceof Error
          ? drawError.message
          : "签筒轻轻晃了一下，但没有落签。请稍后再试。",
      );
    } finally {
      if (!isNavigating) {
        submitLock.current = false;
        setIsSubmitting(false);
      }
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,#2b2355_0%,#17132f_38%,#0e0c1e_100%)] px-6 py-10 text-violet-100">
      <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-violet-300/20 bg-violet-950/45 p-8 shadow-[0_0_80px_rgba(120,88,255,0.2)] backdrop-blur md:p-12">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs tracking-[0.3em] text-violet-300/80">DIVINATION RITUAL</p>
          <Link href="/" className="text-sm text-violet-300 hover:text-violet-100">
            返回神庙入口
          </Link>
        </div>

        <h1 className="mt-5 text-3xl font-semibold text-violet-50 md:text-4xl">求签之殿</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-violet-200/90">
          今夜的签在筒中轻轻相碰。会是哪一句小小回音，正巧落到你手里呢？
        </p>

        <div className="mt-8 grid items-center gap-7 md:grid-cols-[0.8fr_1.2fr] md:gap-10">
          <FortuneCylinder isShaking={isSubmitting} />

          <section className="rounded-2xl border border-violet-200/15 bg-violet-950/35 p-5">
            <p className="text-sm text-violet-200">今日状态</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-violet-900/60 px-3 py-1 text-violet-200">
                {statusFailed
                  ? "今日签位暂时无法确认"
                  : isAvailable === null
                    ? "正在查验今日签位"
                    : isAvailable
                      ? "今日一签：可求"
                      : "今日之签已落下"}
              </span>
            </div>
            <label htmlFor="divination-question" className="mt-5 block text-sm text-violet-200">
              心中所问，可写可不写
            </label>
            <textarea
              id="divination-question"
              className="mt-3 h-24 w-full resize-none rounded-xl border border-violet-200/20 bg-violet-950/60 p-3 text-sm text-violet-100 outline-none placeholder:text-violet-300/50"
              placeholder="比如：我今天该先整理哪一团雾？"
              value={question}
              maxLength={240}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <button
              type="button"
              disabled={isSubmitting || isAvailable !== true}
              onClick={drawFortune}
              className="mt-5 rounded-full bg-violet-200 px-6 py-2.5 text-sm font-medium text-violet-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "签筒正在轻响……"
                : isAvailable === false
                  ? "今日之签已收好"
                  : "抽一支签"}
            </button>
            <p role="status" aria-live="polite" className="sr-only">
              {isSubmitting ? "签筒正在轻响，请稍候。" : ""}
            </p>
            {error ? (
              <p role="alert" className="mt-4 text-sm text-rose-200">
                {error}
              </p>
            ) : null}
            {isAvailable === false ? (
              <div className="mt-4 text-sm text-violet-200">
                <p>先带着今日的回音走一段，明日再来。</p>
                {resultId ? (
                  <Link href={`/result/${resultId}`} className="mt-3 inline-flex text-violet-100 underline underline-offset-4">
                    查看今日之签
                  </Link>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>

      </div>
    </main>
  );
}
