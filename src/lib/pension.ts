// 동행복권 연금복권720+ 공식 API (CORS 열려 있음 — 실측 확인).
// 최신 회차: selectPstPt720Info.do (파라미터 없음). 특정 회차: ?srchPsltEpsd=N
// (N 주변 여러 회차가 섞여 오므로 psltEpsd === N 인 행만 골라 씁니다).

const BASE = "https://www.dhlottery.co.kr/pt720/selectPstPt720Info.do";

// 응답 한 행 — 등수(wnSqNo)별로 8행이 한 회차를 이룬다.
// 1=1등(이때만 wnBndNo가 조), 2=2등, 3~7=3~7등, 21=보너스.
interface RawRow {
  psltEpsd: number;
  psltRflYmd: string; // "20260806"
  wnAmt: number;
  wnSqNo: number;
  wnBndNo?: string;
  wnRnkVl: string; // 등수별 자릿수가 다른 당첨 숫자 문자열(앞자리 0 잘릴 수 있음)
}

export interface Draw {
  drawNo: number;
  date: string; // "YYYY-MM-DD"
  firstGroup: number; // 1등 조 (1~5)
  firstNumber: string; // 1등 6자리
  bonusNumber: string; // 보너스 6자리
  prizes: { rank: number; amount: number }[]; // 1~7등
}

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | "bonus" | null;

function toDate(ymd: string): string {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

function toDraw(rows: RawRow[]): Draw {
  const first = rows.find((r) => r.wnSqNo === 1);
  const bonus = rows.find((r) => r.wnSqNo === 21);
  if (!first || !bonus) throw new Error("pension draw: 1등/보너스 행이 없어요");
  const prizes = [1, 2, 3, 4, 5, 6, 7].map((rank) => ({
    rank,
    amount: rows.find((r) => r.wnSqNo === rank)?.wnAmt ?? 0,
  }));
  return {
    drawNo: rows[0].psltEpsd,
    date: toDate(rows[0].psltRflYmd),
    firstGroup: Number(first.wnBndNo),
    firstNumber: first.wnRnkVl.padStart(6, "0"),
    bonusNumber: bonus.wnRnkVl.padStart(6, "0"),
    prizes,
  };
}

async function fetchRows(url: string): Promise<RawRow[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`pension fetch failed: ${url} (${res.status})`);
  const json = (await res.json()) as { data: { result: RawRow[] } };
  return json.data.result;
}

export async function fetchLatestDraw(): Promise<Draw> {
  return toDraw(await fetchRows(BASE));
}

export async function fetchDraw(drawNo: number): Promise<Draw> {
  const rows = await fetchRows(`${BASE}?srchPsltEpsd=${drawNo}`);
  return toDraw(rows.filter((r) => r.psltEpsd === drawNo));
}

// 우선순위대로 위에서부터 먼저 맞는 것 하나만 등수로 인정한다.
// 뒷자리 비교는 slice(-n)으로 하는데, 두 문자열이 같은 길이(6)라 위치별 비교와 동치다.
export function rankOf(group: number, digits: string, draw: Draw): Rank {
  const d = digits.padStart(6, "0");
  if (d === draw.firstNumber) return group === draw.firstGroup ? 1 : 2;
  if (d === draw.bonusNumber) return "bonus";
  for (const [rank, len] of [
    [3, 5],
    [4, 4],
    [5, 3],
    [6, 2],
    [7, 1],
  ] as const) {
    if (d.slice(-len) === draw.firstNumber.slice(-len)) return rank;
  }
  return null;
}

// now 를 KST 벽시계 기준 필드로 변환 (실행 환경 타임존과 무관하게 계산하기 위함)
function kstParts(now: Date) {
  const t = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return {
    y: t.getUTCFullYear(),
    m: t.getUTCMonth(),
    d: t.getUTCDate(),
    day: t.getUTCDay(),
    h: t.getUTCHours(),
    min: t.getUTCMinutes(),
  };
}

export function nextDrawAt(now: Date = new Date()): Date {
  const { y, m, d, day, h, min } = kstParts(now);
  let dayDiff = (4 - day + 7) % 7; // 이번 주 목요일까지 남은 일수
  const pastDrawTimeToday = day === 4 && (h > 19 || (h === 19 && min >= 5));
  if (dayDiff === 0 && pastDrawTimeToday) dayDiff = 7; // 오늘 추첨 시각이 지났으면 다음 주로

  // KST 19:05 = UTC 10:05 (날짜는 그대로, 시각만 -9시간)
  return new Date(Date.UTC(y, m, d + dayDiff, 10, 5, 0, 0));
}

export function msUntilNextDraw(now: Date = new Date()): number {
  return nextDrawAt(now).getTime() - now.getTime();
}

export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (days >= 1) return `${days}일 ${hours}시간 ${minutes}분`;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${hours}시간 ${minutes}분 ${pad(seconds)}초`;
}
