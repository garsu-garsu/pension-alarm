import { useEffect, useRef, useState } from "react";

import { Device } from "@apps-in-toss/web-framework";
import { Button, Paragraph, useToast } from "@toss/tds-mobile";

import { PensionNumber } from "../../components/PensionNumber";
import { Card, ScreenLayout } from "../../components/ScreenLayout";
import { EVENT, track } from "../../lib/analytics";
import {
  fetchLatestDraw,
  formatCountdown,
  msUntilNextDraw,
  type Draw,
} from "../../lib/pension";
import { isInTossApp } from "../../lib/tossEnv";
import { useTour, useTourTarget } from "../../lib/tour";
import { palette } from "../../theme";

const DHLOTTERY_URL = "https://dhlottery.co.kr";

const RANK_LABELS = ["1등", "2등", "3등", "4등", "5등", "6등", "7등"];

export function ResultScreen() {
  const { openToast } = useToast();
  const [draw, setDraw] = useState<Draw | null>(null);
  const [error, setError] = useState(false);
  // 다시 시도 버튼을 누르면 이 값을 올려서 아래 effect 를 다시 돌려요.
  const [reloadKey, setReloadKey] = useState(0);
  const [countdown, setCountdown] = useState(() =>
    formatCountdown(msUntilNextDraw()),
  );

  const tour = useTour();
  const setTourTarget = useTourTarget("result-numbers");
  const numbersCardRef = useRef<HTMLDivElement | null>(null);
  const tourKey = tour.current?.key;
  useEffect(() => {
    if (tourKey === "result-numbers") {
      numbersCardRef.current?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }, [tourKey]);

  useEffect(() => {
    setError(false);
    setDraw(null);
    fetchLatestDraw()
      .then((d) => {
        setDraw(d);
        track(EVENT.resultViewed, { drawNo: d.drawNo });
      })
      .catch(() => setError(true));
  }, [reloadKey]);

  useEffect(() => {
    const timer = setInterval(
      () => setCountdown(formatCountdown(msUntilNextDraw())),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  const openDhlottery = async () => {
    track(EVENT.dhlotteryOpened, {});
    try {
      if (isInTossApp()) {
        await Device.openURL(DHLOTTERY_URL);
      } else {
        window.open(DHLOTTERY_URL, "_blank", "noopener");
      }
    } catch {
      openToast("동행복권 사이트를 열지 못했어요.");
    }
  };

  return (
    <ScreenLayout
      title="이번 주 당첨번호"
      subtitle={`다음 추첨까지 ${countdown}`}
    >
      {error ? (
        <Card style={{ marginTop: 8, textAlign: "center" }}>
          <Paragraph typography="t6" color={palette.sub}>
            당첨번호를 불러오지 못했어요
          </Paragraph>
          <div style={{ marginTop: 12 }}>
            <Button display="full" onClick={() => setReloadKey((k) => k + 1)}>
              다시 시도
            </Button>
          </div>
        </Card>
      ) : !draw ? (
        <Card style={{ marginTop: 8, textAlign: "center" }}>
          <Paragraph typography="t6" color={palette.sub}>
            불러오는 중…
          </Paragraph>
        </Card>
      ) : (
        <>
          <div
            ref={(el) => {
              numbersCardRef.current = el;
              setTourTarget(el);
            }}
          >
            <Card style={{ marginTop: 8 }}>
              <Paragraph typography="t6" fontWeight="bold" color={palette.ink}>
                제{draw.drawNo}회 · {draw.date} 추첨
              </Paragraph>
              <div style={{ marginTop: 12 }}>
                <PensionNumber
                  group={draw.firstGroup}
                  digits={draw.firstNumber}
                />
              </div>
              <Paragraph
                typography="t7"
                color={palette.sub}
                style={{ marginTop: 16 }}
              >
                보너스
              </Paragraph>
              <div style={{ marginTop: 6 }}>
                <PensionNumber digits={draw.bonusNumber} />
              </div>
            </Card>
          </div>

          <Card style={{ marginTop: 12 }}>
            <Paragraph typography="t6" fontWeight="bold" color={palette.ink}>
              등수별 당첨금
            </Paragraph>
            {draw.prizes.map(({ rank, amount }) => (
              <div
                key={rank}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 10,
                }}
              >
                <Paragraph typography="t7" color={palette.sub}>
                  {RANK_LABELS[rank - 1]}
                </Paragraph>
                <Paragraph typography="t7" color={palette.ink}>
                  {amount.toLocaleString("ko-KR")}원
                </Paragraph>
              </div>
            ))}
          </Card>
        </>
      )}

      <Card style={{ marginTop: 12 }}>
        <Paragraph typography="t7" color={palette.sub}>
          당첨결과와 판매점 정보를 공식 사이트에서 볼 수 있어요.
        </Paragraph>
        <div style={{ marginTop: 12 }}>
          <Button
            display="full"
            variant="weak"
            color="dark"
            onClick={openDhlottery}
          >
            동행복권 홈페이지 바로가기
          </Button>
        </div>
      </Card>
    </ScreenLayout>
  );
}
