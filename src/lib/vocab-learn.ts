// =============================================================================
// In-session "learn mode" for flashcards (Lingoland-style mastery gate).
//
// On top of the long-term SM-2 SRS (lib/vocab-srs), a study session tracks a
// short-term "memory level" per word and only lets the learner COMPLETE the
// lesson once every word has reached a minimum level. Words recalled poorly are
// re-queued with in-session spacing (spaced repetition within the session) so
// they come back before the learner forgets them again.
//
// Pure functions only — no React/DOM — so the rules are unit-testable.
// =============================================================================

import type { VocabWord } from "@/lib/types";
import { QUALITY } from "@/lib/sm2";

/** Memory level a word must reach (in this session) before the lesson can end. */
export const STEPS_TO_MASTER = 2;

export interface LearnCard {
  word: VocabWord;
  level: number; // in-session memory level, 0..STEPS_TO_MASTER
  seen: number; // how many times shown this session
}

/** New in-session memory level after a rating (quality q ∈ [0,5]). */
export function nextLevel(level: number, quality: number): number {
  if (quality <= QUALITY.AGAIN) return 0; // Quên → học lại từ đầu
  if (quality >= QUALITY.EASY) return STEPS_TO_MASTER; // Dễ → thuộc ngay
  return Math.min(level + 1, STEPS_TO_MASTER); // Khó / Tốt → +1 mức
}

export function isMasteredLevel(level: number): boolean {
  return level >= STEPS_TO_MASTER;
}

/** Cards to wait before this word is shown again (shorter when less confident). */
export function requeueGap(quality: number): number {
  if (quality <= QUALITY.AGAIN) return 2; // forgot → comes back soon
  if (quality === QUALITY.HARD) return 4;
  return 6; // remembered but not yet mastered → later
}

/**
 * Apply a rating to the FRONT card of the queue. Mastered cards leave the queue;
 * others are re-inserted `requeueGap` positions back (clamped to the queue
 * length) so the learner meets them again after some spacing.
 */
export function applyRating(
  queue: LearnCard[],
  quality: number
): { queue: LearnCard[]; mastered: boolean } {
  if (queue.length === 0) return { queue, mastered: false };
  const [head, ...rest] = queue;
  const level = nextLevel(head.level, quality);
  if (isMasteredLevel(level)) {
    return { queue: rest, mastered: true };
  }
  const card: LearnCard = { ...head, level, seen: head.seen + 1 };
  const gap = Math.min(requeueGap(quality), rest.length);
  const next = rest.slice();
  next.splice(gap, 0, card);
  return { queue: next, mastered: false };
}

export function buildLearnQueue(words: VocabWord[]): LearnCard[] {
  return words.map((w) => ({ word: w, level: 0, seen: 0 }));
}
