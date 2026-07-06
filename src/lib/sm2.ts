// =============================================================================
// SM-2 (SuperMemo-2) — identical maths to behsk/src/lib/srs.ts. Used for the
// guest (localStorage) mode; logged-in users get the authoritative server copy.
// =============================================================================

export interface Sm2State {
  repetitions: number;
  easeFactor: number;
  interval: number;
}

export const DEFAULT_STATE: Sm2State = {
  repetitions: 0,
  easeFactor: 2.5,
  interval: 0,
};
export const MIN_EF = 1.3;
export const DAY_MS = 24 * 60 * 60 * 1000;

/** Quality buttons (Anki-style) mapped to SM-2 q ∈ [0,5]. */
export const QUALITY = {
  AGAIN: 1, // quên
  HARD: 3, // nhớ nhưng khó
  GOOD: 4, // nhớ
  EASY: 5, // nhớ ngay
} as const;

export function sm2(prev: Sm2State | null | undefined, quality: number): Sm2State {
  const p = prev ?? DEFAULT_STATE;
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let ef = p.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ef < MIN_EF) ef = MIN_EF;

  let repetitions: number;
  let interval: number;
  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions = p.repetitions + 1;
    if (p.repetitions === 0) interval = 1;
    else if (p.repetitions === 1) interval = 6;
    else interval = Math.round(p.interval * ef);
  }
  return { repetitions, easeFactor: ef, interval };
}

export function intervalLabel(days: number): string {
  if (days <= 0) return "hôm nay";
  if (days === 1) return "1 ngày";
  if (days < 30) return `${days} ngày`;
  if (days < 365) return `${Math.round(days / 30)} tháng`;
  return `${(days / 365).toFixed(1)} năm`;
}
