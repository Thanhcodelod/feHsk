// =============================================================================
// Luyện dịch progress — two backends behind one interface (mirrors vocab SRS):
//   - logged in → authoritative server state (behsk, table translation_attempts)
//   - guest     → localStorage, namespaced by "guest"
// Tracks, per translation sentence: attempts, whether ever answered correctly,
// and a bookmark ("câu đã lưu"). Sentences attempted but not yet answered
// correctly form the "câu sai cần ôn" review list.
// =============================================================================

import {
  apiGetTranslationProgress,
  apiTranslationAttempt,
  apiTranslationSave,
} from "@/lib/api";

export interface LdRecord {
  a: number; // attempts
  ok: 0 | 1; // ever answered correctly
}
export type LdMap = Record<string, LdRecord>;

const progKey = (scope: string) => `ld_prog_${scope}`;
const savedKey = (scope: string) => `ld_saved_${scope}`;

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

export function loadLdProgress(scope = "guest"): LdMap {
  return read<LdMap>(progKey(scope), {});
}

export function loadLdSaved(scope = "guest"): string[] {
  return read<string[]>(savedKey(scope), []);
}

/** Record an attempt on a sentence; returns the updated map. */
export function recordLd(scope: string, id: string, correct: boolean): LdMap {
  const map = loadLdProgress(scope);
  const prev = map[id] ?? { a: 0, ok: 0 };
  map[id] = { a: prev.a + 1, ok: (prev.ok || (correct ? 1 : 0)) as 0 | 1 };
  write(progKey(scope), map);
  return map;
}

/** Toggle a bookmark; returns the updated saved-id list. */
export function toggleLdSaved(scope: string, id: string): string[] {
  const set = new Set(loadLdSaved(scope));
  if (set.has(id)) set.delete(id);
  else set.add(id);
  const list = [...set];
  write(savedKey(scope), list);
  return list;
}

// ---- Server-or-local interface (used by the components) --------------------

/** Pure: return a new map with one attempt applied (for optimistic UI). */
export function applyAttempt(prog: LdMap, id: string, correct: boolean): LdMap {
  const prev = prog[id] ?? { a: 0, ok: 0 };
  return {
    ...prog,
    [id]: { a: prev.a + 1, ok: (prev.ok || (correct ? 1 : 0)) as 0 | 1 },
  };
}

/** Load progress + bookmarks (server when logged in, else localStorage). */
export async function loadLd(
  useServer: boolean,
  scope = "guest"
): Promise<{ prog: LdMap; saved: string[] }> {
  if (useServer) {
    try {
      const states = await apiGetTranslationProgress();
      const prog: LdMap = {};
      const saved: string[] = [];
      for (const s of states) {
        prog[s.itemId] = { a: s.attempts, ok: s.correct ? 1 : 0 };
        if (s.saved) saved.push(s.itemId);
      }
      return { prog, saved };
    } catch {
      // fall back to whatever is cached locally if the request fails
      return { prog: loadLdProgress(scope), saved: loadLdSaved(scope) };
    }
  }
  return { prog: loadLdProgress(scope), saved: loadLdSaved(scope) };
}

/** Persist one attempt (server or localStorage). Fire-and-forget friendly. */
export async function persistLdAttempt(
  useServer: boolean,
  scope: string,
  id: string,
  correct: boolean
): Promise<void> {
  if (useServer) {
    try {
      await apiTranslationAttempt(id, correct);
    } catch {
      /* ignore — optimistic UI already updated */
    }
    return;
  }
  recordLd(scope, id, correct);
}

/** Persist a bookmark toggle (server or localStorage). */
export async function persistLdSaved(
  useServer: boolean,
  scope: string,
  id: string,
  willSave: boolean
): Promise<void> {
  if (useServer) {
    try {
      await apiTranslationSave(id, willSave);
    } catch {
      /* ignore */
    }
    return;
  }
  const has = loadLdSaved(scope).includes(id);
  if (has !== willSave) toggleLdSaved(scope, id);
}

// ---- Derived stats ---------------------------------------------------------

export interface LessonStat {
  lesson: number;
  count: number; // sentences in the lesson
  attempted: number;
  correct: number;
  pct: number; // correct / count (0..100)
  status: "done" | "doing" | "todo";
}

export interface LevelStats {
  lessonsDone: number;
  lessonsTotal: number;
  practiced: number; // sentences attempted
  total: number; // sentences available
  correct: number; // sentences ever correct
  accuracy: number; // 0..100
  lessons: LessonStat[];
}

/** Compute the landing stats for a level from its sentences + progress map. */
export function computeLevelStats(
  items: { id: string; lesson: number }[],
  prog: LdMap
): LevelStats {
  const byLesson = new Map<number, { id: string }[]>();
  for (const it of items) {
    if (!byLesson.has(it.lesson)) byLesson.set(it.lesson, []);
    byLesson.get(it.lesson)!.push(it);
  }
  const lessons: LessonStat[] = [...byLesson.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([lesson, list]) => {
      const attempted = list.filter((s) => (prog[s.id]?.a ?? 0) > 0).length;
      const correct = list.filter((s) => prog[s.id]?.ok === 1).length;
      const status: LessonStat["status"] =
        correct === list.length && list.length > 0
          ? "done"
          : attempted > 0
            ? "doing"
            : "todo";
      return {
        lesson,
        count: list.length,
        attempted,
        correct,
        pct: list.length ? Math.round((correct / list.length) * 100) : 0,
        status,
      };
    });

  const practiced = items.filter((s) => (prog[s.id]?.a ?? 0) > 0).length;
  const correct = items.filter((s) => prog[s.id]?.ok === 1).length;
  return {
    lessonsDone: lessons.filter((l) => l.status === "done").length,
    lessonsTotal: lessons.length,
    practiced,
    total: items.length,
    correct,
    accuracy: practiced ? Math.round((correct / practiced) * 100) : 0,
    lessons,
  };
}

/** Sentences attempted but not yet answered correctly (câu sai cần ôn). */
export function isWrongToReview(rec: LdRecord | undefined): boolean {
  return !!rec && rec.a > 0 && rec.ok === 0;
}
