import { palette } from "../theme";

interface Props {
  group?: number;
  digits: string;
  size?: number;
  dim?: (index: number) => boolean;
}

/** 연금복권 번호 표시 — 조 배지(있으면) + 6자리 원형 볼. */
export function PensionNumber({ group, digits, size = 34, dim }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      {group != null && (
        <span
          style={{
            padding: "4px 8px",
            borderRadius: 8,
            background: palette.primary,
            color: palette.white,
            fontSize: size * 0.4,
            fontWeight: "bold",
          }}
        >
          {group}조
        </span>
      )}
      {digits.split("").map((ch, i) => (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: palette.primary,
            color: palette.white,
            fontWeight: "bold",
            fontSize: size * 0.42,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: dim?.(i) ? 0.28 : 1,
          }}
        >
          {ch}
        </div>
      ))}
    </div>
  );
}
