import { useState } from "react";

import { Button, Paragraph } from "@toss/tds-mobile";

import { PensionNumber } from "../../components/PensionNumber";
import { Card, ScreenLayout } from "../../components/ScreenLayout";
import { useAdGate } from "../../hooks/useAdGate";
import { EVENT, track } from "../../lib/analytics";
import { recommendTickets, STRATEGIES, type Strategy, type Ticket } from "../../lib/recommend";
import { palette } from "../../theme";

const LABELS = ["A", "B", "C", "D", "E"];

type Results = Record<Strategy, Ticket[] | null>;

export function RecommendScreen() {
  const { watchThen } = useAdGate();
  const [results, setResults] = useState<Results>({
    uniform: null,
    lastDigit: null,
    sameNumber: null,
  });

  const onGenerate = (key: Strategy) => {
    watchThen(() => {
      const seed = Date.now();
      setResults((prev) => ({ ...prev, [key]: recommendTickets(key, 5, seed) }));
      track(EVENT.recommendGenerated, { strategy: key });
    }, "recommend:" + key);
  };

  return (
    <ScreenLayout title="번호 추천" subtitle="고르기 귀찮을 때 대신 골라드려요">
      <Card style={{ marginTop: 8 }}>
        <Paragraph typography="t7" color={palette.sub} style={{ lineHeight: 1.5 }}>
          연금복권은 매 회차 독립이라 어떤 방식도 1등 확률을 높이지 못해요. 아래는 확률이 아니라
          꽝날 확률이나 당첨금이 몰리는 방식을 바꾸는 방식이에요.
        </Paragraph>
      </Card>

      {STRATEGIES.map(({ key, label, summary, basis, effect }) => {
        const tickets = results[key];
        return (
          <Card key={key} style={{ marginTop: 12 }}>
            <Paragraph typography="t6" fontWeight="bold" color={palette.ink}>
              {label}
            </Paragraph>
            <Paragraph typography="t7" color={palette.sub} style={{ marginTop: 2 }}>
              {summary}
            </Paragraph>
            <Paragraph typography="t7" color={palette.sub} style={{ marginTop: 8, lineHeight: 1.5 }}>
              {basis}
            </Paragraph>
            <Paragraph typography="t7" color={palette.sub} style={{ lineHeight: 1.5 }}>
              → {effect}
            </Paragraph>

            {tickets != null && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                {tickets.map((ticket, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Paragraph typography="t6" fontWeight="bold" color={palette.primary}>
                      {LABELS[i]}
                    </Paragraph>
                    <PensionNumber group={ticket.group} digits={ticket.digits} size={30} />
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <Button display="full" onClick={() => onGenerate(key)}>
                {tickets == null ? "광고 보고 추천받기" : "다시 추천받기"}
              </Button>
            </div>
          </Card>
        );
      })}
    </ScreenLayout>
  );
}
