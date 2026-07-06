import type { VocabWord } from "@/lib/types";

export const LESSON_SIZE = 15;

export interface Lesson {
  num: number;
  words: VocabWord[];
}

/** Split a group's words into fixed-size lessons (bài) of ~15 words. */
export function chunkLessons(
  words: VocabWord[],
  size = LESSON_SIZE
): Lesson[] {
  const out: Lesson[] = [];
  for (let i = 0; i < words.length; i += size) {
    out.push({ num: out.length + 1, words: words.slice(i, i + size) });
  }
  return out;
}
