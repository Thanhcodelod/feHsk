// =============================================================================
// Client-side progress store (localStorage). Because the app runs without auth
// or a database by default, a learner's submission history, streak, and
// category stats live in the browser. When a real backend + auth is added,
// swap these calls for API calls to /api/submissions & /api/stats.
// =============================================================================

"use client";

import type {
  HSKLevel,
  QuestionCategory,
  QuestionType,
} from "@/lib/types";

const KEY = "hsk-master:v1";

export interface HistoryEntry {
  questionId: string;
  level: HSKLevel;
  category: QuestionCategory;
  type: QuestionType;
  isCorrect: boolean;
  score: number;
  ts: number; // epoch ms
  dateKey: string; // YYYY-MM-DD (local)
}

interface StoreShape {
  history: HistoryEntry[];
}

function read(): StoreShape {
  if (typeof window === "undefined") return { history: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { history: [] };
    const parsed = JSON.parse(raw) as StoreShape;
    return { history: parsed.history ?? [] };
  } catch {
    return { history: [] };
  }
}

function write(data: StoreShape): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
    window.dispatchEvent(new Event("hsk-progress-updated"));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function dateKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function recordAttempt(
  entry: Omit<HistoryEntry, "ts" | "dateKey">
): void {
  const data = read();
  const ts = Date.now();
  data.history.push({ ...entry, ts, dateKey: dateKey(ts) });
  // Keep the store bounded.
  if (data.history.length > 5000) {
    data.history = data.history.slice(-5000);
  }
  write(data);
}

export function getHistory(): HistoryEntry[] {
  return read().history;
}

export function clearHistory(): void {
  write({ history: [] });
}

// ---------------------------------------------------------------------------
// Derived analytics
// ---------------------------------------------------------------------------

export interface CategoryStat {
  attempts: number;
  correct: number;
  accuracy: number;
}

export interface ProgressSummary {
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
  streakDays: number;
  practicedToday: boolean;
  byCategory: Record<QuestionCategory, CategoryStat>;
  byLevel: Record<HSKLevel, CategoryStat>;
  last14Days: { date: string; attempts: number; correct: number }[];
}

const EMPTY_CAT: CategoryStat = { attempts: 0, correct: 0, accuracy: 0 };

export function summarize(history: HistoryEntry[]): ProgressSummary {
  const byCategory = {} as Record<QuestionCategory, CategoryStat>;
  const byLevel = {} as Record<HSKLevel, CategoryStat>;

  const bump = (
    map: Record<string, CategoryStat>,
    k: string,
    correct: boolean
  ) => {
    const cur = map[k] ?? { attempts: 0, correct: 0, accuracy: 0 };
    cur.attempts += 1;
    if (correct) cur.correct += 1;
    cur.accuracy = cur.attempts ? cur.correct / cur.attempts : 0;
    map[k] = cur;
  };

  for (const h of history) {
    bump(byCategory, h.category, h.isCorrect);
    bump(byLevel, h.level, h.isCorrect);
  }

  const totalAttempts = history.length;
  const totalCorrect = history.filter((h) => h.isCorrect).length;

  // Streak: count consecutive days back from today with >=1 attempt.
  const days = new Set(history.map((h) => h.dateKey));
  let streakDays = 0;
  const cursor = new Date();
  const practicedToday = days.has(dateKey(cursor.getTime()));
  // If nothing today, streak can still run through yesterday.
  if (!practicedToday) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dateKey(cursor.getTime()))) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Last 14 days series.
  const last14Days: { date: string; attempts: number; correct: number }[] = [];
  const t = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(t);
    d.setDate(t.getDate() - i);
    const key = dateKey(d.getTime());
    const dayEntries = history.filter((h) => h.dateKey === key);
    last14Days.push({
      date: key,
      attempts: dayEntries.length,
      correct: dayEntries.filter((h) => h.isCorrect).length,
    });
  }

  return {
    totalAttempts,
    totalCorrect,
    accuracy: totalAttempts ? totalCorrect / totalAttempts : 0,
    streakDays,
    practicedToday,
    byCategory: fillCats(byCategory),
    byLevel,
    last14Days,
  };
}

function fillCats(
  map: Record<QuestionCategory, CategoryStat>
): Record<QuestionCategory, CategoryStat> {
  const cats: QuestionCategory[] = [
    "LISTENING",
    "READING",
    "WRITING",
    "SPEAKING",
    "VOCAB_PRONUNCIATION",
  ];
  const out = {} as Record<QuestionCategory, CategoryStat>;
  for (const c of cats) out[c] = map[c] ?? { ...EMPTY_CAT };
  return out;
}
