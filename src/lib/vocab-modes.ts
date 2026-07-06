// =============================================================================
// Vocabulary study modes (hihsk-style): generate practice questions from the
// bundled data (hanzi / pinyin / vi) — no extra content needed.
// =============================================================================

import type { VocabWord } from "@/lib/types";
import { shuffleClient } from "@/lib/utils";

export type ModeKind =
  | "list"
  | "meaning"
  | "pinyin"
  | "word"
  | "listening"
  | "flashcard"
  | "typing"
  | "matching"
  | "mixed"
  | "soon";

export interface ModeDef {
  slug: string;
  label: string;
  kind: ModeKind;
}

/** The lesson study-mode menu (right sidebar), in hihsk order. */
export const MODES: ModeDef[] = [
  { slug: "vocab", label: "Từ vựng", kind: "list" },
  { slug: "meaning", label: "Chọn nghĩa", kind: "meaning" },
  { slug: "pinyin", label: "Chọn phiên âm", kind: "pinyin" },
  { slug: "word", label: "Chọn từ tiếng Trung", kind: "word" },
  { slug: "fill-blank", label: "Điền từ vào chỗ trống", kind: "soon" },
  { slug: "listening", label: "Luyện nghe", kind: "listening" },
  { slug: "flashcard", label: "Flashcard", kind: "flashcard" },
  { slug: "typing", label: "Nhập từ vựng", kind: "typing" },
  { slug: "stroke", label: "Luyện thứ tự nét", kind: "soon" },
  { slug: "matching", label: "Nối từ", kind: "matching" },
  { slug: "radical", label: "Chọn bộ thủ", kind: "soon" },
  { slug: "mixed", label: "Tổng hợp", kind: "mixed" },
];

export function modeBySlug(slug: string): ModeDef | undefined {
  return MODES.find((m) => m.slug === slug);
}

// ---------------------------------------------------------------------------
// Pinyin distractor generation (for "Chọn phiên âm")
// ---------------------------------------------------------------------------

const TONE_MARKS: Record<string, string[]> = {
  a: ["ā", "á", "ǎ", "à"],
  e: ["ē", "é", "ě", "è"],
  i: ["ī", "í", "ǐ", "ì"],
  o: ["ō", "ó", "ǒ", "ò"],
  u: ["ū", "ú", "ǔ", "ù"],
  ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
};
// reverse: toned char -> { base, tone(1-4) }
const TONED: Record<string, { base: string; tone: number }> = {};
for (const [base, marks] of Object.entries(TONE_MARKS)) {
  marks.forEach((m, i) => (TONED[m] = { base, tone: i + 1 }));
}

function shiftTone(pinyin: string): string {
  const chars = [...pinyin];
  for (let i = 0; i < chars.length; i++) {
    const t = TONED[chars[i]];
    if (t) {
      const nextTone = (t.tone % 4) + 1; // 1->2->3->4->1
      chars[i] = TONE_MARKS[t.base][nextTone - 1];
      return chars.join("");
    }
  }
  return pinyin;
}

function stripTones(pinyin: string): string {
  return [...pinyin]
    .map((c) => (TONED[c] ? TONED[c].base : c))
    .join("");
}

function swapInitial(pinyin: string): string {
  const swaps: [RegExp, string][] = [
    [/^zh/, "z"],
    [/^ch/, "c"],
    [/^sh/, "s"],
    [/^z(?!h)/, "zh"],
    [/^c(?!h)/, "ch"],
    [/^s(?!h)/, "sh"],
    [/^n/, "l"],
    [/^l/, "n"],
  ];
  for (const [re, rep] of swaps) {
    if (re.test(pinyin)) return pinyin.replace(re, rep);
  }
  return shiftTone(shiftTone(pinyin));
}

/** 3 plausible-but-wrong pinyin options for `correct`. */
export function pinyinDistractors(correct: string, pool: string[]): string[] {
  const set = new Set<string>();
  for (const cand of [shiftTone(correct), stripTones(correct), swapInitial(correct)]) {
    if (cand && cand !== correct) set.add(cand);
  }
  // Fill from other words' pinyin if we have fewer than 3.
  for (const p of shuffleClient(pool)) {
    if (set.size >= 3) break;
    if (p !== correct) set.add(p);
  }
  return [...set].slice(0, 3);
}

// ---------------------------------------------------------------------------
// MCQ question builders
// ---------------------------------------------------------------------------

export interface McqQuestion {
  id: string;
  promptMain?: string; // big prompt text (hanzi or meaning)
  promptMainHanzi?: boolean; // render promptMain with .hanzi font
  promptSub?: string; // small text under the prompt (pinyin)
  instruction: string; // grey line under the card
  tag?: string; // pill above the big text
  audioText?: string; // TTS on load (listening)
  hiddenPrompt?: boolean; // hide the prompt (listening) until answered
  options: string[];
  answer: string;
  revealAfter?: string; // shown once answered (e.g. hanzi for listening)
  optionsHanzi?: boolean; // render options with .hanzi font (word mode)
}

function pick3<T>(all: T[], exclude: T): T[] {
  return shuffleClient(all.filter((x) => x !== exclude)).slice(0, 3);
}

export function buildQuestions(
  kind: ModeKind,
  lessonWords: VocabWord[],
  poolWords: VocabWord[]
): McqQuestion[] {
  const viPool = poolWords.map((w) => w.vi);
  const hanziPool = poolWords.map((w) => w.hanzi);
  const pinyinPool = poolWords.map((w) => w.pinyin);

  const make = (w: VocabWord): McqQuestion | null => {
    switch (kind) {
      case "meaning":
        return {
          id: w.id,
          promptMain: w.hanzi,
          promptMainHanzi: true,
          promptSub: w.pinyin,
          tag: "Chọn nghĩa đúng",
          instruction: "Nhìn từ tiếng Trung và chọn đúng nghĩa tiếng Việt phù hợp nhất.",
          options: shuffleClient([w.vi, ...pick3(viPool, w.vi)]),
          answer: w.vi,
        };
      case "pinyin":
        return {
          id: w.id,
          promptMain: w.hanzi,
          promptMainHanzi: true,
          instruction: `Pinyin đúng của từ '${w.hanzi}' là gì?`,
          options: shuffleClient([w.pinyin, ...pinyinDistractors(w.pinyin, pinyinPool)]),
          answer: w.pinyin,
        };
      case "word":
        return {
          id: w.id,
          promptMain: w.vi,
          promptSub: w.pinyin,
          tag: "Chọn từ tiếng Trung đúng",
          instruction: `Từ tiếng Trung của "${w.vi}" là gì?`,
          options: shuffleClient([w.hanzi, ...pick3(hanziPool, w.hanzi)]),
          answer: w.hanzi,
          optionsHanzi: true,
        };
      case "listening":
        return {
          id: w.id,
          promptMain: w.hanzi,
          promptMainHanzi: true,
          hiddenPrompt: true,
          audioText: w.hanzi,
          tag: "Nghe và chọn nghĩa",
          instruction: "Nhấn loa để nghe, rồi chọn nghĩa tiếng Việt đúng.",
          options: shuffleClient([w.vi, ...pick3(viPool, w.vi)]),
          answer: w.vi,
          revealAfter: `${w.hanzi} · ${w.pinyin}`,
        };
      default:
        return null;
    }
  };

  if (kind === "mixed") {
    const kinds: ModeKind[] = ["meaning", "pinyin", "word"];
    return shuffleClient(lessonWords).map((w, i) => {
      const k = kinds[i % kinds.length];
      return buildQuestions(k, [w], poolWords)[0];
    });
  }

  return shuffleClient(lessonWords)
    .map((w) => make(w))
    .filter((q): q is McqQuestion => q !== null);
}
