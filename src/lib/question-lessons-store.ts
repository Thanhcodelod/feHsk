// =============================================================================
// Question-lesson progress — the question-bank analogue of luyen-dich-store.
// Two backends behind one interface:
//   - logged in → server state (behsk, table QuestionProgress). Attempts are
//     recorded server-side automatically by POST /api/submissions; this store
//     only *reads* them back and toggles the "saved" bookmark.
//   - guest     → localStorage, namespaced by "guest".
// Progress is keyed by the globally-unique questionId, so a single map covers
// every function-exercise type. Lessons are synthesized by chunking the flat
// question list (see function-exercises.ts / LESSON_SIZE).
// =============================================================================

import { apiGetQuestionProgress, apiQuestionSave } from "@/lib/api";
import { LESSON_SIZE } from "@/lib/function-exercises";

export interface QRecord {
  a: number; // attempts
  ok: 0 | 1; // ever answered correctly
}
export type QMap = Record<string, QRecord>;

const progKey = (scope: string) => `q_prog_${scope}`;
const savedKey = (scope: string) => `q_saved_${scope}`;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export function loadQProgress(scope = "guest"): QMap {
  return read<QMap>(progKey(scope), {});
}

export function loadQSaved(scope = "guest"): string[] {
  return read<string[]>(savedKey(scope), []);
}

/** Record an attempt locally (guest); returns the updated map. */
export function recordQ(scope: string, id: string, correct: boolean): QMap {
  const map = loadQProgress(scope);
  const prev = map[id] ?? { a: 0, ok: 0 };
  map[id] = { a: prev.a + 1, ok: (prev.ok || (correct ? 1 : 0)) as 0 | 1 };
  write(progKey(scope), map);
  return map;
}

/** Toggle a bookmark locally; returns the updated saved-id list. */
export function toggleQSaved(scope: string, id: string): string[] {
  const set = new Set(loadQSaved(scope));
  if (set.has(id)) set.delete(id);
  else set.add(id);
  const list = [...set];
  write(savedKey(scope), list);
  return list;
}

/** Pure: return a new map with one attempt applied (optimistic UI). */
export function applyAttempt(prog: QMap, id: string, correct: boolean): QMap {
  const prev = prog[id] ?? { a: 0, ok: 0 };
  return {
    ...prog,
    [id]: { a: prev.a + 1, ok: (prev.ok || (correct ? 1 : 0)) as 0 | 1 },
  };
}

/** Load progress + bookmarks (server when logged in, else localStorage). */
export async function loadQ(
  useServer: boolean,
  scope = "guest"
): Promise<{ prog: QMap; saved: string[] }> {
  if (useServer) {
    try {
      const states = await apiGetQuestionProgress();
      const prog: QMap = {};
      const saved: string[] = [];
      for (const s of states) {
        prog[s.questionId] = { a: s.attempts, ok: s.correct ? 1 : 0 };
        if (s.saved) saved.push(s.questionId);
      }
      return { prog, saved };
    } catch {
      // fall back to whatever is cached locally if the request fails
      return { prog: loadQProgress(scope), saved: loadQSaved(scope) };
    }
  }
  return { prog: loadQProgress(scope), saved: loadQSaved(scope) };
}

/**
 * Persist one attempt. Logged-in attempts are already saved server-side by
 * POST /api/submissions, so this only writes the guest localStorage mirror.
 */
export async function persistQAttempt(
  useServer: boolean,
  scope: string,
  id: string,
  correct: boolean
): Promise<void> {
  if (useServer) return; // handled by the submission grading endpoint
  recordQ(scope, id, correct);
}

/** Persist a bookmark toggle (server or localStorage). */
export async function persistQSaved(
  useServer: boolean,
  scope: string,
  id: string,
  willSave: boolean
): Promise<void> {
  if (useServer) {
    try {
      await apiQuestionSave(id, willSave);
    } catch {
      /* ignore — optimistic UI already updated */
    }
    return;
  }
  const has = loadQSaved(scope).includes(id);
  if (has !== willSave) toggleQSaved(scope, id);
}

// ---- Derived stats ---------------------------------------------------------

export interface LessonStat {
  lesson: number;
  count: number; // questions in the lesson
  from: number; // 1-based first question number
  to: number; // 1-based last question number
  attempted: number;
  correct: number;
  pct: number; // correct / count (0..100)
  status: "done" | "doing" | "todo";
}

export interface LevelStats {
  lessonsDone: number;
  lessonsTotal: number;
  practiced: number; // questions attempted
  total: number; // questions available
  correct: number; // questions ever correct
  accuracy: number; // 0..100
  lessons: LessonStat[];
}

/** Compute the landing stats from a flat question list + progress map. */
export function computeQuestionStats(
  questions: { id: string }[],
  prog: QMap,
  size = LESSON_SIZE
): LevelStats {
  const total = questions.length;
  const count = Math.max(1, Math.ceil(total / size));
  const lessons: LessonStat[] = [];
  for (let l = 1; l <= count; l++) {
    const slice = questions.slice((l - 1) * size, l * size);
    const attempted = slice.filter((q) => (prog[q.id]?.a ?? 0) > 0).length;
    const correct = slice.filter((q) => prog[q.id]?.ok === 1).length;
    const status: LessonStat["status"] =
      correct === slice.length && slice.length > 0
        ? "done"
        : attempted > 0
          ? "doing"
          : "todo";
    lessons.push({
      lesson: l,
      count: slice.length,
      from: (l - 1) * size + 1,
      to: (l - 1) * size + slice.length,
      attempted,
      correct,
      pct: slice.length ? Math.round((correct / slice.length) * 100) : 0,
      status,
    });
  }

  const practiced = questions.filter((q) => (prog[q.id]?.a ?? 0) > 0).length;
  const correct = questions.filter((q) => prog[q.id]?.ok === 1).length;
  return {
    lessonsDone: lessons.filter((l) => l.status === "done").length,
    lessonsTotal: lessons.length,
    practiced,
    total,
    correct,
    accuracy: practiced ? Math.round((correct / practiced) * 100) : 0,
    lessons,
  };
}

/** Questions attempted but not yet answered correctly (câu sai cần ôn). */
export function isWrongToReview(rec: QRecord | undefined): boolean {
  return !!rec && rec.a > 0 && rec.ok === 0;
}
