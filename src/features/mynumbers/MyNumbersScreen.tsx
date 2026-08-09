import { useEffect, useRef, useState } from "react";

import { Button, Paragraph, useToast } from "@toss/tds-mobile";

import { PensionNumber } from "../../components/PensionNumber";
import { Card, ScreenLayout } from "../../components/ScreenLayout";
import { EVENT, track } from "../../lib/analytics";
import { fetchLatestDraw, rankOf, type Draw, type Rank } from "../../lib/pension";
import { palette } from "../../theme";

interface Ticket {
  group: number;
  digits: string;
}

const TICKETS_KEY = "pa:my-tickets";
const MAX_TICKETS = 10;

function loadTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(TICKETS_KEY);
    return raw ? (JSON.parse(raw) as Ticket[]) : [];
  } catch {
    return [];
  }
}

function saveTickets(tickets: Ticket[]): void {
  try {
    localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  } catch {
    /* 프라이빗 모드 등에서 저장이 막힐 수 있어요 */
  }
}

const RANK_LABEL: Record<Exclude<Rank, null>, string> = {
  1: "1등",
  2: "2등",
  3: "3등",
  4: "4등",
  5: "5등",
  6: "6등",
  7: "7등",
  bonus: "보너스",
};

export function MyNumbersScreen() {
  const { openToast } = useToast();
  const [group, setGroup] = useState(1);
  const [digits, setDigits] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>(loadTickets);
  const [draw, setDraw] = useState<Draw | null>(null);
  // 회차 대조가 끝난 뒤 딱 한 번만 기록하기 위한 플래그
  const checkedRef = useRef(false);

  useEffect(() => {
    fetchLatestDraw()
      .then(setDraw)
      .catch(() => {
        /* 실패하면 대조 없이 저장한 번호 목록만 보여줘요 */
      });
  }, []);

  useEffect(() => {
    if (checkedRef.current || draw == null || tickets.length === 0) return;
    checkedRef.current = true;
    track(EVENT.myNumbersChecked, { tickets: tickets.length });
  }, [draw, tickets.length]);

  const onDigitsChange = (value: string) => {
    setDigits(value.replace(/\D/g, "").slice(0, 6));
  };

  const onSave = () => {
    if (digits.length !== 6) {
      openToast("여섯 자리를 모두 입력해 주세요.");
      return;
    }
    if (tickets.length >= MAX_TICKETS) {
      openToast(`최대 ${MAX_TICKETS}장까지 저장할 수 있어요.`);
      return;
    }
    const next = [...tickets, { group, digits }];
    setTickets(next);
    saveTickets(next);
    setDigits("");
    track(EVENT.myNumbersSaved, { tickets: next.length });
  };

  const onDelete = (index: number) => {
    const next = tickets.filter((_, i) => i !== index);
    setTickets(next);
    saveTickets(next);
  };

  return (
    <ScreenLayout
      title="내 번호 확인"
      subtitle="산 번호를 저장해 두면 발표 직후 몇 등인지 알려드려요"
    >
      <Card style={{ marginTop: 8 }}>
        <Paragraph typography="t6" fontWeight="bold" color={palette.ink}>
          조를 골라주세요
        </Paragraph>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {[1, 2, 3, 4, 5].map((g) => (
            <div key={g} style={{ flex: 1 }}>
              <Button
                display="block"
                variant={group === g ? "fill" : "weak"}
                color={group === g ? "primary" : "dark"}
                onClick={() => setGroup(g)}
              >
                {g}조
              </Button>
            </div>
          ))}
        </div>

        <Paragraph
          typography="t6"
          fontWeight="bold"
          color={palette.ink}
          style={{ marginTop: 20 }}
        >
          여섯 자리를 입력해 주세요
        </Paragraph>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={digits}
          onChange={(e) => onDigitsChange(e.target.value)}
          placeholder="000000"
          style={{
            marginTop: 10,
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 14px",
            fontSize: 20,
            letterSpacing: 4,
            borderRadius: 12,
            border: `1px solid ${palette.line}`,
            outline: "none",
          }}
        />
        <div style={{ marginTop: 14 }}>
          <Button display="full" onClick={onSave}>
            저장
          </Button>
        </div>
      </Card>

      {tickets.length === 0 ? (
        <Card style={{ marginTop: 12, textAlign: "center" }}>
          <Paragraph typography="t6" color={palette.sub}>
            아직 저장한 번호가 없어요
          </Paragraph>
        </Card>
      ) : (
        tickets.map((ticket, i) => {
          const rank = draw ? rankOf(ticket.group, ticket.digits, draw) : null;
          const reference = draw ? (rank === "bonus" ? draw.bonusNumber : draw.firstNumber) : null;
          return (
            <Card
              key={i}
              style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}
            >
              <div style={{ flex: 1 }}>
                <PensionNumber
                  group={ticket.group}
                  digits={ticket.digits}
                  size={30}
                  dim={reference ? (idx) => ticket.digits[idx] !== reference[idx] : undefined}
                />
              </div>
              {draw && (
                <Paragraph
                  typography="t7"
                  fontWeight="bold"
                  color={rank ? palette.good : palette.sub}
                >
                  {rank ? `${RANK_LABEL[rank]} 🎉` : "낙첨"}
                </Paragraph>
              )}
              <button
                type="button"
                onClick={() => onDelete(i)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: palette.sub,
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </Card>
          );
        })
      )}
    </ScreenLayout>
  );
}
