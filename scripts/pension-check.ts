// node --experimental-strip-types scripts/pension-check.ts 로 실행하는 오프라인 자체 점검.
// 네트워크를 타는 fetch* 함수는 호출하지 않는다(import만 함).
import assert from "node:assert";
import { rankOf, nextDrawAt, type Draw } from "../src/lib/pension.ts";
import { recommendTickets, type Strategy } from "../src/lib/recommend.ts";

function makeDraw(overrides: Partial<Draw> = {}): Draw {
  return {
    drawNo: 327,
    date: "2026-08-06",
    firstGroup: 3,
    firstNumber: "221540",
    bonusNumber: "727161",
    prizes: [1, 2, 3, 4, 5, 6, 7].map((rank) => ({ rank, amount: 0 })),
    ...overrides,
  };
}

// ---- rankOf ----
const draw = makeDraw();
assert.strictEqual(rankOf(3, "221540", draw), 1); // 조 + 6자리 전부 일치
assert.strictEqual(rankOf(1, "221540", draw), 2); // 조 무관, 6자리만 일치 (우선순위: 3등 아님)
assert.strictEqual(rankOf(2, "727161", draw), "bonus"); // 보너스
assert.strictEqual(rankOf(1, "121540", draw), 3); // 뒤 5자리 일치
assert.strictEqual(rankOf(1, "111540", draw), 4); // 뒤 4자리 일치
assert.strictEqual(rankOf(1, "112540", draw), 5); // 뒤 3자리 일치
assert.strictEqual(rankOf(1, "112340", draw), 6); // 뒤 2자리 일치
assert.strictEqual(rankOf(1, "112360", draw), 7); // 뒤 1자리 일치
assert.strictEqual(rankOf(1, "112361", draw), null); // 낙첨

// 앞자리 0 케이스: wnRnkVl 이 앞자리 0을 잘린 채 내려올 수 있으니 뒤에서부터 비교해야 함
const zeroDraw = makeDraw({ firstNumber: "000123", firstGroup: 2, bonusNumber: "999999" });
assert.strictEqual(rankOf(1, "900123", zeroDraw), 3); // 뒤 5자리 "00123" 일치

// ---- nextDrawAt ----
function kstFields(d: Date) {
  const t = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return { day: t.getUTCDay(), h: t.getUTCHours(), min: t.getUTCMinutes() };
}

const aThursday = nextDrawAt(new Date());
{
  const f = kstFields(aThursday);
  assert.strictEqual(f.day, 4, "목요일이어야 함");
  assert.strictEqual(f.h, 19);
  assert.strictEqual(f.min, 5);
}

const samples = [
  new Date(aThursday.getTime() - 6 * 86400_000), // 전주 금요일 즈음
  new Date(aThursday.getTime() - 2 * 86400_000),
  new Date(aThursday.getTime() + 3 * 86400_000),
];
for (const now of samples) {
  const next = nextDrawAt(now);
  const f = kstFields(next);
  assert.strictEqual(f.day, 4, "목요일이어야 함");
  assert.strictEqual(f.h, 19);
  assert.strictEqual(f.min, 5);
  assert.ok(next.getTime() > now.getTime(), "now 보다 미래여야 함");
}

// 목 19:04 -> 같은 날 19:05
const before = new Date(aThursday.getTime() - 60_000);
assert.strictEqual(nextDrawAt(before).getTime(), aThursday.getTime());

// 목 19:06 -> 다음 주 목요일 19:05
const after = new Date(aThursday.getTime() + 60_000);
assert.strictEqual(nextDrawAt(after).getTime(), aThursday.getTime() + 7 * 86400_000);

// ---- recommendTickets ----
const strategies: Strategy[] = ["uniform", "lastDigit", "sameNumber"];
for (const strategy of strategies) {
  const s1 = recommendTickets(strategy, 5, 100);
  const s2 = recommendTickets(strategy, 5, 100);
  assert.deepStrictEqual(s1, s2, `${strategy}: 같은 seed는 같은 결과여야 함`);

  const s3 = recommendTickets(strategy, 5, 101);
  assert.notDeepStrictEqual(s1, s3, `${strategy}: 다른 seed는 다른 결과여야 함`);

  assert.strictEqual(s1.length, 5);
  for (const t of s1) {
    assert.strictEqual(t.digits.length, 6, `${strategy}: digits는 6자리여야 함`);
    assert.ok(/^\d{6}$/.test(t.digits), `${strategy}: digits는 숫자만이어야 함`);
    assert.ok(t.group >= 1 && t.group <= 5, `${strategy}: group은 1~5여야 함`);
  }
}

// lastDigit: 다섯 장의 끝자리가 서로 달라야 함
const lastDigitTickets = recommendTickets("lastDigit", 5, 7);
const lastDigits = lastDigitTickets.map((t) => t.digits.slice(-1));
assert.strictEqual(new Set(lastDigits).size, 5, "lastDigit: 끝자리가 서로 달라야 함");

// sameNumber: digits는 전부 같고, group은 1~5 전부 나와야 함
const sameNumberTickets = recommendTickets("sameNumber", 5, 7);
assert.strictEqual(new Set(sameNumberTickets.map((t) => t.digits)).size, 1, "sameNumber: digits가 전부 같아야 함");
assert.deepStrictEqual(
  sameNumberTickets.map((t) => t.group).sort((a, b) => a - b),
  [1, 2, 3, 4, 5],
  "sameNumber: group이 1~5 전부여야 함",
);

console.log("pension-check ok");
