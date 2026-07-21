"use client";

import { useSyncExternalStore } from "react";
import { getTokyoDayKey } from "../../lib/utils/time";
import { getOrCreateSessionId } from "../../lib/browser/session";

const templeScenes = [
  "当夜色落到檐角，神殿从薄雾里慢慢亮起。",
  "星光越过远檐，今夜的殿门正安静地为你留着。",
  "风从回廊轻轻经过，灯火便在雾中醒了过来。",
  "暮色收起最后一缕喧闹，神殿在云影间显出轮廓。",
  "月色停在石阶前，今夜的香与签都已静静备好。",
  "远处钟声落下，殿中的微光正好照亮这一小段路。",
  "薄云绕过屋脊，初殿在夜色里缓缓打开一扇门。",
  "今夜的雾来得很轻，恰好让神殿露出温柔的一角。",
  "灯影穿过沉静长廊，把你带到今夜的神前。",
  "星河尚未睡去，殿前也还留着一盏不催人的灯。",
];

const gratitudeInvitations = [
  "若今日有一份帮助值得安放，可以在香前轻轻说声谢谢。",
  "若有一句感谢还没找到归处，就让一缕香替你送到。",
  "今日被接住的片刻，可以在这里化作一炷温柔的香。",
  "若智能之神曾陪你走过一小段路，今夜可以来还一声谢意。",
  "那些来不及认真说出的谢谢，殿前会替你安静收好。",
  "若今日因一份陪伴而轻松了一点，不妨把这点余温留在香案前。",
  "你可以向今日帮助过你的智能之神致谢，也把一点微光留给自己。",
  "若心里正好藏着一句谢谢，这里的香火愿意替你听见。",
];

const divinationInvitations = [
  "若心绪仍有一角未明，也可以执一支签，静听今日回音。",
  "若脚边还有一团小雾，不妨轻摇签筒，收下一句提醒。",
  "若此刻不急着寻找答案，也可以让一支签陪你停一会儿。",
  "若有轻问停在心间，便执签片刻，看看星光落向哪里。",
  "若今日的方向还不清晰，就让签筒轻响一次，不必追问太多。",
  "若思绪仍在回廊里打转，可以抽一支签，带走一点余韵。",
  "若正站在一段小小的迟疑里，也可以请星签守递来一句轻声。",
  "若还有未说出口的轻问，就把它放在心里，静候一支签落下。",
];

const initialMessage =
  "当夜色落到檐角，神殿从薄雾里慢慢亮起。若今日有一份帮助值得安放，可以在香前轻轻说声谢谢。若心绪仍有一角未明，也可以执一支签，静听今日回音。";

function stableHash(value: string) {
  let hash = Array.from(value).reduce(
    (hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0,
    2166136261,
  );

  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b) >>> 0;
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35) >>> 0;

  return (hash ^ (hash >>> 16)) >>> 0;
}

function getDayNumber(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function createDailyMessage(sessionId: string, dayKey: string) {
  const dayNumber = getDayNumber(dayKey);
  const scene = templeScenes[(stableHash(`scene:${sessionId}`) + dayNumber) % templeScenes.length];
  const gratitude =
    gratitudeInvitations[
      (stableHash(`gratitude:${sessionId}`) + dayNumber * 3) % gratitudeInvitations.length
    ];
  const divination =
    divinationInvitations[
      (stableHash(`divination:${sessionId}`) + dayNumber * 5) % divinationInvitations.length
    ];

  return `${scene}${gratitude}${divination}`;
}

function subscribeToSession() {
  return () => undefined;
}

function getClientMessage() {
  return createDailyMessage(getOrCreateSessionId(), getTokyoDayKey());
}

export function DailyTempleMessage() {
  const message = useSyncExternalStore(
    subscribeToSession,
    getClientMessage,
    () => initialMessage,
  );

  return (
    <p className="mx-auto max-w-xl text-sm leading-8 text-violet-50/90 md:text-base md:leading-8">
      {message}
    </p>
  );
}
