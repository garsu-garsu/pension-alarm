import { useState } from "react";

import { Paragraph } from "@toss/tds-mobile";

import { NotifySlotCard } from "../../components/NotifySlotCard";
import { Card, ScreenLayout } from "../../components/ScreenLayout";
import {
  BUY_SLOTS,
  CHECK_SLOTS,
  agreedBuySlot,
  agreedCheckSlot,
  canRequestNotifyConsent,
} from "../../data/notify";
import { palette } from "../../theme";

export function AlarmScreen() {
  const [buy, setBuy] = useState(agreedBuySlot);
  const [check, setCheck] = useState(agreedCheckSlot);

  return (
    <ScreenLayout title="알림 설정" subtitle="사는 것도 확인하는 것도 대신 챙겨드려요">
      {!canRequestNotifyConsent() && (
        <Card style={{ marginTop: 8 }}>
          <Paragraph typography="t7" color={palette.sub}>
            토스 앱에서 열면 알림을 설정할 수 있어요.
          </Paragraph>
        </Card>
      )}

      <NotifySlotCard
        title="연금복권 사라고 알려드릴 시각"
        slots={BUY_SLOTS}
        agreedCode={buy}
        onAgreed={setBuy}
        where="alarm"
      />
      <NotifySlotCard
        title="번호 확인하라고 알려드릴 시각"
        slots={CHECK_SLOTS}
        agreedCode={check}
        onAgreed={setCheck}
        where="alarm"
      />

      <Card style={{ marginTop: 12 }}>
        <Paragraph typography="t7" color={palette.sub} style={{ lineHeight: 1.5 }}>
          연금복권은 목요일 오후 5시에 판매가 끝나고, 저녁 7시 5분에 추첨해요. 그 시간에 맞춰
          알려드려요.
        </Paragraph>
      </Card>
    </ScreenLayout>
  );
}
