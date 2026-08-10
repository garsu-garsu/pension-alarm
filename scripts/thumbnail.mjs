/**
 * 스토어 가로 썸네일(1932x828)을 뽑아요. 콘솔이 1px 도 안 봐줘서 뷰포트를 정확히 맞춥니다.
 *
 * 쓰기: node scripts/thumbnail.mjs  →  submission/thumbnail-1932x828.png
 */
import { mkdir } from "node:fs/promises";

import puppeteer from "puppeteer-core";

const CHROME =
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "submission/thumbnail-1932x828.png";

const html = `<!doctype html><meta charset="utf-8">
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1932px; height: 828px; display: flex; align-items: center;
    padding: 0 130px; gap: 80px;
    font-family: "Malgun Gothic", sans-serif; color: #fff;
    background: linear-gradient(135deg, #2A9C72 0%, #146145 100%);
  }
  .copy { flex: 1; }
  h1 { font-size: 128px; font-weight: 800; letter-spacing: -4px; white-space: nowrap; }
  p  { font-size: 58px; font-weight: 600; opacity: .88; margin-top: 34px; white-space: nowrap; }
  .pill {
    display: inline-block; margin-top: 62px; padding: 26px 52px;
    border-radius: 999px; background: rgba(255,255,255,.22);
    font-size: 46px; font-weight: 700;
  }
  /* 연금복권 용지 — 조 + 여섯 자리 */
  .ticket {
    background: #fff; border-radius: 40px; padding: 40px 44px;
    box-shadow: 0 24px 60px rgba(0,0,0,.25);
    display: flex; align-items: center; gap: 16px; flex: none;
  }
  .cell {
    width: 88px; height: 112px; border-radius: 22px; background: #EAF5EF;
    display: flex; align-items: center; justify-content: center;
    font-size: 62px; font-weight: 800; color: #146145;
  }
  .group { background: #1E7F5C; color: #fff; font-size: 44px; }
</style>
<div class="copy">
  <h1>복권 확인,<br>앱이 대신해요</h1>
  <p>연금복권 720+ 자동 대조</p>
  <span class="pill">토스에서 만나요</span>
</div>
<div class="ticket">
  <div class="cell group">3조</div>
  ${[2, 2, 1, 5, 4, 0].map((d) => `<div class="cell">${d}</div>`).join("")}
</div>`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
});
try {
  await mkdir("submission", { recursive: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1932, height: 828, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: OUT });
} finally {
  await browser.close();
}
