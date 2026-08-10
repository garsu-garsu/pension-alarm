/**
 * 콘솔 스크린샷(636x1048)을 뽑아요.
 *
 * 콘솔은 1px만 달라도 거부해서 뷰포트를 직접 고정하고 찍습니다.
 * 광고 자리가 화면에 남지 않게 광고그룹 ID 를 비우고 빌드한 결과물을 찍어요.
 *
 * 쓰기:
 *   VITE_AD_GROUP_ID_BANNER= VITE_AD_GROUP_ID_BANNER_IMAGE= VITE_AD_GROUP_ID_REWARDED= npx vite build
 *   npx vite preview --port 4184
 *   PORT=4184 node scripts/shots.mjs
 */
import { mkdir } from "node:fs/promises";

import puppeteer from "puppeteer-core";

const CHROME =
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const URL = `http://localhost:${process.env.PORT ?? 5173}/`;
const OUT = "screenshots";
// 477 x 786 을 4/3 배율로 렌더하면 정확히 636x1048 이 나와요.
// 481px 이상에서는 앱이 480px 폭으로 가운데 정렬돼 양옆에 회색 여백이 생기니
// 그 아래로 잡습니다(636/1048 비율을 만족하는 폭은 159의 배수뿐이에요).
const SIZE = { width: 477, height: 786, deviceScaleFactor: 4 / 3 };

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 갓 설치한 상태로 찍으면 "내번호"가 텅 비어 보여요. 최신 회차를 받아
// 끝자리가 맞는 7등 한 장을 섞어 실제로 대조가 되는 화면을 만들어요.
const rows = await fetch(
  "https://www.dhlottery.co.kr/pt720/selectPstPt720Info.do",
).then((r) => r.json());
const first = rows.data.result.find((r) => r.wnSqNo === 1);
const win = String(first.wnRnkVl).padStart(6, "0");
const tickets = [
  { group: Number(first.wnBndNo), digits: `481${win.slice(-3)}` }, // 5등(뒤 3자리)
  { group: 2, digits: "907312" }, // 낙첨
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--window-size=636,1048"],
});

try {
  await mkdir(OUT, { recursive: true });
  const page = await browser.newPage();
  await page.setViewport(SIZE);

  // 코치마크는 스토어에 보여줄 화면이 아니에요.
  await page.evaluateOnNewDocument((t) => {
    localStorage.setItem("pa:onboarded", "1");
    localStorage.setItem("pa:my-tickets", JSON.stringify(t));
  }, tickets);

  await page.goto(URL, { waitUntil: "networkidle0" });
  // #root 는 min-height 라 화면 아래가 비어 보여요. 캡처용으로만 꽉 채우고,
  // 하단 고정 배너 자리(96px)도 비웁니다 — 스토어 화면에 광고 자리는 안 보여야 해요.
  await page.addStyleTag({
    // 떠 있는 탭바는 배너 자리 위에 뜨게 잡혀 있어요. 그 자리를 없앤 만큼 같이 내립니다.
    content:
      "html,body,#root{height:100%}#root>div{padding-bottom:0!important}nav{bottom:12px!important}",
  });
  await wait(400);

  // 1) 당첨번호
  await page.waitForSelector("text/이번 주 당첨번호", { timeout: 15_000 });
  await wait(1200);
  await page.screenshot({ path: `${OUT}/1-result.png` });

  const tab = async (label) => {
    await page.click(`::-p-text(${label})`);
    // 누른 탭에 포커스 링이 남아 스토어 화면에 검은 테두리로 찍혀요.
    await page.evaluate(() => document.activeElement?.blur());
    await wait(1400);
  };
  const scroll = async (px) => {
    await page.evaluate((y) => document.querySelector("main")?.scrollBy(0, y), px);
    await wait(600);
  };

  // 2) 내번호 — 조와 여섯 자리 입력
  await tab("내번호");
  await page.waitForSelector("text/내 번호", { timeout: 10_000 });
  await page.screenshot({ path: `${OUT}/2-mynumbers.png` });

  // 3) 내번호 아래 — 저장한 번호가 몇 등인지 자동 대조
  await scroll(300);
  await page.screenshot({ path: `${OUT}/3-check.png` });

  // 4) 번호추천 — 광고 게이트는 미설정이라 바로 통과해요
  await tab("번호추천");
  await page.click("::-p-text(광고 보고 추천받기)");
  await wait(1600);
  await page.screenshot({ path: `${OUT}/4-recommend.png` });

  // 5) 알림 설정
  await tab("알림");
  await page.screenshot({ path: `${OUT}/5-alarm.png` });
} finally {
  await browser.close();
}
