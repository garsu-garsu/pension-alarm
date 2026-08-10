import { Paragraph } from "@toss/tds-mobile";

import { BANNER_H } from "./BannerAd";
import { useRouter, type Route, type RouteName } from "../router";
import { palette } from "../theme";

interface Tab {
  name: RouteName;
  label: string;
  emoji: string;
}

const TABS: Tab[] = [
  { name: "result", label: "당첨번호", emoji: "🎫" },
  { name: "mynumbers", label: "내번호", emoji: "🧾" },
  { name: "recommend", label: "번호추천", emoji: "🍀" },
  { name: "alarm", label: "알림", emoji: "🔔" },
];

/**
 * 메인 탭 — 토스 브랜딩 가이드의 플로팅 형태(둥근 캡슐, 화면 아래에 떠 있음).
 * 화면 폭 전체를 채우는 고정 바는 토스 기본 하단 탭과 헷갈려서 쓰면 안 돼요.
 * 본문 위에 떠 있으므로 ScreenLayout 이 본문 아래를 그만큼 비워둡니다.
 */
export function BottomNav() {
  const { route, reset } = useRouter();

  return (
    <nav
      style={{
        // 하단 고정 배너 바로 위에 띄워요. #root 가 아니라 화면 기준이라
        // 배너와 같은 방식으로 가운데 정렬합니다.
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: `calc(${BANNER_H}px + env(safe-area-inset-bottom) + 10px)`,
        width: "calc(100% - 40px)",
        maxWidth: 440,
        zIndex: 11,
        display: "flex",
        background: palette.white,
        borderRadius: 999,
        boxShadow: "0 6px 20px rgba(22,36,31,0.16)",
        padding: "6px 6px 8px",
      }}
    >
      {TABS.map((tab) => {
        const active = route.name === tab.name;
        return (
          <button
            key={tab.name}
            type="button"
            onClick={() => reset({ name: tab.name } as Route)}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              borderRadius: 999,
              padding: "6px 0 4px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              cursor: "pointer",
            }}
          >
            {/* lineHeight 를 1 로 두지 않으면 이모지 줄 높이 때문에 캡슐이 두꺼워져요. */}
            <span
              style={{
                fontSize: 22,
                lineHeight: 1,
                opacity: active ? 1 : 0.45,
              }}
            >
              {tab.emoji}
            </span>
            <Paragraph
              typography="t7"
              fontWeight={active ? "bold" : "medium"}
              color={active ? palette.primary : palette.sub}
            >
              {tab.label}
            </Paragraph>
          </button>
        );
      })}
    </nav>
  );
}
