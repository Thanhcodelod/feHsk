// =============================================================================
// Vocabulary spaced-repetition store (SM-2). Two backends behind one interface:
//   - logged in  → authoritative server state (behsk, table user_cards)
//   - guest      → localStorage, computed with the same SM-2 maths (lib/sm2)
// =============================================================================

"use client";

import type { VocabWord } from "@/lib/types";
import { apiGetSrsStates, apiSrsReview, type SrsCardDTO } from "@/lib/api";
import { sm2, DAY_MS } from "@/lib/sm2";

export interface CardState {
  repetitions: number;
  easeFactor: number;
  interval: number; // days
  nextReviewMs: number;
  lastReviewMs: number | null;
}

export type SrsMap = Record<string, CardState>;

const KEY = "hsk-master:srs-sm2";
/** interval (days) at/above which a word counts as "đã thuộc". */
export const MASTERED_INTERVAL = 21;

function fromDto(d: SrsCardDTO): CardState {
  return {
    repetitions: d.repetitions,
    easeFactor: d.easeFactor,
    interval: d.interval,
    nextReviewMs: new Date(d.nextReviewDate).getTime(),
    lastReviewMs: d.lastReviewDate ? new Date(d.lastReviewDate).getTime() : null,
  };
}

function loadLocal(): SrsMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as SrsMap;
  } catch {
    return {};
  }
}
function saveLocal(map: SrsMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
    window.dispatchEvent(new Event("hsk-vocab-updated"));
  } catch {
    /* ignore */
  }
}

/** Load the whole SRS map (server when logged in, else localStorage). */
export async function loadSrs(useServer: boolean): Promise<SrsMap> {
  if (useServer) {
    const states = await apiGetSrsStates();
    const map: SrsMap = {};
    for (const s of states) map[s.cardId] = fromDto(s);
    return map;
  }
  return loadLocal();
}

/**
 * Record a review for one card with quality q ∈ [0,5]. Returns the new state.
 * Server mode delegates to the backend (authoritative SM-2); guest mode computes
 * locally and persists to localStorage.
 */
export async function submitReview(
  useServer: boolean,
  cardId: string,
  quality: number
): Promise<CardState> {
  if (useServer) {
    const dto = await apiSrsReview(cardId, quality);
    window.dispatchEvent(new Event("hsk-vocab-updated"));
    return fromDto(dto);
  }
  const map = loadLocal();
  const prev = map[cardId];
  const next = sm2(prev, quality);
  const now = Date.now();
  const state: CardState = {
    repetitions: next.repetitions,
    easeFactor: next.easeFactor,
    interval: next.interval,
    nextReviewMs: now + next.interval * DAY_MS,
    lastReviewMs: now,
  };
  map[cardId] = state;
  saveLocal(map);
  return state;
}

/** Clear local (guest) SRS progress. */
export function resetLocalSrs(): void {
  saveLocal({});
}

export function isMastered(s: CardState | undefined): boolean {
  return !!s && s.interval >= MASTERED_INTERVAL;
}

export interface VocabStats {
  total: number;
  neu: number; // chưa học
  learning: number; // đang học
  mastered: number; // đã thuộc
  due: number; // cần ôn (mới hoặc tới hạn)
}

export function computeStats(words: VocabWord[], map: SrsMap): VocabStats {
  const now = Date.now();
  let neu = 0,
    learning = 0,
    mastered = 0,
    due = 0;
  for (const w of words) {
    const s = map[w.id];
    if (!s) {
      neu++;
      due++;
      continue;
    }
    if (isMastered(s)) mastered++;
    else learning++;
    if (s.nextReviewMs <= now) due++;
  }
  return { total: words.length, neu, learning, mastered, due };
}

/** New words first, then due words (most overdue first), capped at `size`. */
export function buildSession(
  words: VocabWord[],
  map: SrsMap,
  size = 15
): VocabWord[] {
  const now = Date.now();
  const due = words.filter((w) => {
    const s = map[w.id];
    return !s || s.nextReviewMs <= now;
  });
  due.sort((a, b) => {
    const sa = map[a.id];
    const sb = map[b.id];
    const da = sa ? sa.nextReviewMs : -Infinity; // new words first
    const db = sb ? sb.nextReviewMs : -Infinity;
    return da - db;
  });
  return due.slice(0, size);
}
