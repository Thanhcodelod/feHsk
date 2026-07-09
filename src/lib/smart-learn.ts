// =============================================================================
// Smart adaptive vocab learning (Lingoland-style). A word climbs through 5
// memory levels; each level is confirmed by a progressively harder exercise, and
// a word is only "learned" (mastered) once it reaches the top level. Words that
// are answered wrong drop a level and come back sooner (in-session spaced
// repetition). Long-term SM-2 (lib/vocab-srs) is still recorded on every answer.
//
// Pure functions only (no React/DOM) so the progression rules are unit-testable.
// =============================================================================

import type { VocabWord } from "@/lib/types";
import { QUALITY } from "@/lib/sm2";

/** Top level = "Thông thạo" = mastered / đã học xong. */
export const MASTER_LEVEL = 5;

export interface LevelMeta {
  name: string; // display name of the memory level
}

/** 0 = chưa học (hạt giống) … 5 = Thông thạo (hoa nở). */
export const LEVELS: LevelMeta[] = [
  { name: "Chưa học" },
  { name: "Mới học" },
  { name: "Nhớ tạm" },
  { name: "Nhớ lâu" },
  { name: "Thuộc lòng" },
  { name: "Thông thạo" },
];

export type ExerciseType =
  | "flashcard" // introduce (level 0)
  | "truefalse" // level 1
  | "choose-meaning" // level 2
  | "listen-meaning" // level 2 (variant)
  | "choose-word" // level 3
  | "listen-word" // level 3 (variant)
  | "typing" // level 4
  | "meaning-audio"; // level 4 (variant)

export const EXERCISE_TITLES: Record<ExerciseType, string> = {
  flashcard: "Từ mới",
  truefalse: "Đúng hay sai?",
  "choose-meaning": "Chọn nghĩa",
  "listen-meaning": "Nghe và chọn nghĩa",
  "choose-word": "Chọn từ",
  "listen-word": "Nghe và chọn từ",
  typing: "Nhập từ",
  "meaning-audio": "Chọn âm thanh đúng",
};

export interface LearnCard {
  word: VocabWord;
  level: number; // 0..MASTER_LEVEL
  seen: number; // times shown this session (drives exercise variety)
  due: number; // virtual "turn" at which the card wants to be shown again
}

// Each level offers two interchangeable exercise types (harder as the level
// rises). Having two per level lets us always pick one that differs from the
// previous question, so the same exercise never repeats back-to-back.
const LEVEL_VARIANTS: ExerciseType[][] = [
  ["flashcard"], // 0 — introduction (only one form)
  ["truefalse", "choose-meaning"], // 1 — easiest recognition
  ["choose-meaning", "listen-meaning"], // 2 — recognition
  ["choose-word", "listen-word"], // 3 — recall
  ["typing", "meaning-audio"], // 4 — hardest recall
];

/**
 * Exercise type for a card's level, preferring a variant that differs from
 * `avoid` (the previous question's type). This guarantees two consecutive
 * questions are never the same type — except unavoidable level-0 flashcards when
 * several brand-new words are introduced together.
 */
export function chooseType(
  level: number,
  seen: number,
  avoid: ExerciseType | null = null
): ExerciseType {
  const variants = LEVEL_VARIANTS[Math.min(Math.max(level, 0), 4)];
  const notAvoid = variants.filter((v) => v !== avoid);
  const from = notAvoid.length ? notAvoid : variants;
  return from[seen % from.length];
}

/** Type a card would show with no anti-repeat constraint (heuristic use). */
export function exerciseForLevel(level: number, seen: number): ExerciseType {
  return chooseType(level, seen, null);
}

/** Flashcard self-assessment → target level (Thông thạo skips ahead). */
export const FLASHCARD_TARGET = {
  known: 4, // "Thông thạo"
  partial: 2, // "Nhớ tạm"
  unknown: 1, // "Chưa biết"
} as const;

/** New level after an exercise result. Never drops below 1 once introduced. */
export function nextLevelOnAnswer(level: number, correct: boolean): number {
  if (correct) return Math.min(MASTER_LEVEL, level + 1);
  return Math.max(1, level - 1);
}

/** SM-2 quality to persist for the long-term scheduler. */
export function qualityForResult(correct: boolean): number {
  return correct ? QUALITY.GOOD : QUALITY.AGAIN;
}
export function qualityForFlashcard(
  rating: keyof typeof FLASHCARD_TARGET
): number {
  if (rating === "known") return QUALITY.EASY;
  if (rating === "partial") return QUALITY.HARD;
  return QUALITY.AGAIN;
}

// ---------------------------------------------------------------------------
// Scheduling. Instead of a fixed FIFO queue (which made every word march through
// the same exercise type in lockstep — flashcard, flashcard, …), each card has a
// virtual "due turn". New words are introduced staggered, and after each answer
// the card's next due time is pushed out by a RANDOMIZED gap, so words desync and
// exercise types interleave. `pickNext` then also avoids showing the same word or
// the same exercise type twice in a row when a comparably-due alternative exists.
// ---------------------------------------------------------------------------

/** A pending (not-yet-introduced) word parks its `due` here until activated. */
export const PENDING_DUE = 1e9;
/** Max brand-new / early-stage (level 0–1) words in play at once. New words are
 *  only introduced as earlier ones progress, so you never hit a long run of
 *  back-to-back "Từ mới" flashcards. */
export const INTRO_CAP = 3;

export function buildLearnQueue(
  words: VocabWord[],
  startLevel = 0
): LearnCard[] {
  return words.map((w, i) => ({
    word: w,
    level: startLevel,
    seen: 0,
    due: i < INTRO_CAP ? i : PENDING_DUE,
  }));
}

/**
 * Introduce pending words as capacity frees — keeping at most `cap` early-stage
 * (level 0–1) words active — so new-word flashcards trickle in between practice
 * of words already seen instead of arriving all at once.
 */
export function activatePending(
  cards: LearnCard[],
  clock: number,
  cap = INTRO_CAP
): LearnCard[] {
  const early = cards.filter((c) => c.due < PENDING_DUE && c.level < 2).length;
  if (early >= cap) return cards;
  let need = cap - early;
  const next = cards.slice();
  let changed = false;
  for (let i = 0; i < next.length && need > 0; i++) {
    if (next[i].due >= PENDING_DUE) {
      next[i] = { ...next[i], due: clock };
      need--;
      changed = true;
    }
  }
  return changed ? next : cards;
}

/** Randomized spacing (in turns) before a card is shown again. */
export function nextGap(advanced: boolean, rand: () => number = Math.random): number {
  return advanced
    ? 3 + Math.floor(rand() * 3) // remembered → 3..5 turns away
    : 1 + Math.floor(rand() * 2); // forgot → 1..2 turns away (comes back soon)
}

/**
 * Choose which active card to show next: the earliest-due card, but preferring
 * one that differs from the last shown word AND exercise type when another card
 * is due within a small window — so the same word / same type never repeats
 * back-to-back unless nothing else is ready.
 */
export function pickNext(
  cards: LearnCard[],
  lastWordId: string | null,
  lastType: ExerciseType | null = null
): number {
  if (cards.length === 0) return -1;
  const order = cards
    .map((c, i) => ({ i, due: c.due }))
    .sort((a, b) => a.due - b.due || a.i - b.i);

  // 1) different word AND a type that would differ from the last shown — reach a
  //    little past the next-due card. This also spaces out "Từ mới" flashcards:
  //    a level-0 card can only yield flashcard, so after a flashcard we prefer a
  //    practice card when one is available.
  const reach = Math.min(order.length, 6);
  for (let k = 0; k < reach; k++) {
    const c = cards[order[k].i];
    if (
      c.word.id !== lastWordId &&
      chooseType(c.level, c.seen, lastType) !== lastType
    ) {
      return order[k].i;
    }
  }
  // 2) at least a different word, staying close to due order
  const near = Math.min(order.length, 4);
  for (let k = 0; k < near; k++) {
    if (cards[order[k].i].word.id !== lastWordId) return order[k].i;
  }
  return order[0].i;
}

/**
 * Apply a computed new level to the card at `idx`. Mastered cards leave the set;
 * others get a new randomized `due` (advanced → later, dropped → sooner).
 */
export function applyResultAt(
  cards: LearnCard[],
  idx: number,
  newLevel: number,
  clock: number,
  rand: () => number = Math.random
): { cards: LearnCard[]; mastered: boolean } {
  if (idx < 0 || idx >= cards.length) return { cards, mastered: false };
  const card = cards[idx];
  if (newLevel >= MASTER_LEVEL) {
    return { cards: cards.filter((_, i) => i !== idx), mastered: true };
  }
  const advanced = newLevel > card.level;
  const updated: LearnCard = {
    ...card,
    level: newLevel,
    seen: card.seen + 1,
    due: clock + nextGap(advanced, rand),
  };
  const next = cards.slice();
  next[idx] = updated;
  return { cards: next, mastered: false };
}
