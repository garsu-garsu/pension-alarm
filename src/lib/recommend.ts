// 연금복권도 매 회차 독립이라 과거 번호로 미래를 맞힐 수 없어요. 이건 "고르기 귀찮은 사람 대신 골라주는" 재미 기능입니다.

export type Strategy = "uniform" | "lastDigit" | "sameNumber";

export interface Ticket {
  group: number; // 1~5
  digits: string; // 6자리 문자열
}

// mulberry32: seed 하나로 결정적 난수를 만드는 초경량 PRNG (테스트 재현성 때문에 Math.random 대신 사용)
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomDigits(rand: () => number, len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(rand() * 10);
  return s;
}

function randomGroup(rand: () => number): number {
  return 1 + Math.floor(rand() * 5);
}

// 0~9 를 섞어서 반환 (lastDigit 전략에서 서로 다른 끝자리를 뽑는 데 사용)
function shuffleDigits(rand: () => number): number[] {
  const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function drawUniform(rand: () => number, count: number): Ticket[] {
  return Array.from({ length: count }, () => ({
    group: randomGroup(rand),
    digits: randomDigits(rand, 6),
  }));
}

// 5장의 마지막 자리를 서로 다르게. 10장을 넘으면 끝자리가 모자라니 11번째부터는 균등으로.
function drawLastDigit(rand: () => number, count: number): Ticket[] {
  const shuffled = shuffleDigits(rand);
  return Array.from({ length: count }, (_, i) => ({
    group: randomGroup(rand),
    digits: randomDigits(rand, 5) + String(i < 10 ? shuffled[i] : Math.floor(rand() * 10)),
  }));
}

// 6자리 하나를 뽑아 모든 장에 같게 쓰고, 조만 1~5로 다르게. 5장을 넘으면 조를 다시 1부터.
function drawSameNumber(rand: () => number, count: number): Ticket[] {
  const digits = randomDigits(rand, 6);
  return Array.from({ length: count }, (_, i) => ({
    group: (i % 5) + 1,
    digits,
  }));
}

export function recommendTickets(strategy: Strategy, count: number, seed: number): Ticket[] {
  const rand = mulberry32(seed);
  if (strategy === "lastDigit") return drawLastDigit(rand, count);
  if (strategy === "sameNumber") return drawSameNumber(rand, count);
  return drawUniform(rand, count);
}

export interface StrategyInfo {
  key: Strategy;
  label: string; // 버튼/제목용 짧은 이름
  summary: string; // 한 줄 설명
  basis: string; // 수학적 근거
  effect: string; // 실제로 뭐가 달라지는지
}

export const STRATEGIES: StrategyInfo[] = [
  {
    key: "uniform",
    label: "완전 무작위",
    summary: "조와 번호를 그냥 고르게 뽑아요",
    basis: "1등은 조까지 맞아야 해서 500만분의 1이에요. 어떤 방식도 이 확률을 높이지 못해요.",
    effect: "기준이 되는 방식이에요. 아래 방식들도 1등 확률은 이것과 같아요.",
  },
  {
    key: "lastDigit",
    label: "끝자리 분산",
    summary: "다섯 장의 마지막 자리를 서로 다르게",
    basis:
      "7등은 마지막 한 자리만 맞으면 돼요. 다섯 장의 끝자리를 모두 다르게 하면 그중 하나가 맞을 확률이 정확히 50퍼센트예요. 아무렇게나 다섯 장을 사면 40.95퍼센트예요.",
    effect: "1등 확률은 그대로예요. 대신 다섯 장이 전부 꽝날 일이 줄어요.",
  },
  {
    key: "sameNumber",
    label: "번호 하나로 다섯 조",
    summary: "같은 번호를 1조부터 5조까지",
    basis:
      "2등은 조를 안 봐요. 같은 번호를 다섯 조에 걸어두면 그 번호가 나올 때 한 장은 1등, 나머지 네 장은 2등이 돼요.",
    effect: "기대값은 무작위와 같아요. 대신 당첨될 땐 한 번에 크게 받고, 안 될 땐 다 같이 꽝이에요.",
  },
];
