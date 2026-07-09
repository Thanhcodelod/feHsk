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
}

/** Which exercise confirms the CURRENT level (harder as the level rises). */
export function exerciseForLevel(level: number, seen: number): ExerciseType {
  switch (level) {
    case 0:
      return "flashcard";
    case 1:
      return "truefalse";
    case 2:
      return seen % 2 === 0 ? "choose-meaning" : "listen-meaning";
    case 3:
      return seen % 2 === 0 ? "choose-word" : "listen-word";
    default: // level 4 (last gate before mastery)
      return seen % 2 === 0 ? "typing" : "meaning-audio";
  }
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

/**
 * Apply a computed new level to the front card. Mastered cards leave the queue;
 * others are re-inserted `gap` positions back — sooner when the level dropped
 * (needs another look), later when it rose.
 */
export function applyResult(
  queue: LearnCard[],
  newLevel: number
): { queue: LearnCard[]; mastered: boolean } {
  if (queue.length === 0) return { queue, mastered: false };
  const [head, ...rest] = queue;
  if (newLevel >= MASTER_LEVEL) {
    return { queue: rest, mastered: true };
  }
  const card: LearnCard = { ...head, level: newLevel, seen: head.seen + 1 };
  const advanced = newLevel > head.level;
  const gap = Math.min(advanced ? 6 : 2, rest.length);
  const next = rest.slice();
  next.splice(gap, 0, card);
  return { queue: next, mastered: false };
}

export function buildLearnQueue(words: VocabWord[]): LearnCard[] {
  return words.map((w) => ({ word: w, level: 0, seen: 0 }));
}
