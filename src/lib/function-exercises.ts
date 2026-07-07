// =============================================================================
// Function-exercise config — the single source of truth for the lesson-based
// (hihsk / luyện-dịch style) practice pages. Each entry maps a route slug to a
// question type + category and the display copy for its landing/runner.
// Questions have no `lesson` field in the DB, so lessons are synthesized here by
// chunking the flat question list into fixed-size groups (see LESSON_SIZE).
// =============================================================================

import type { HSKLevel, QuestionCategory, QuestionType } from "@/lib/types";
import {
  CATEGORY_HANZI,
  CATEGORY_LABELS,
  TYPE_DESC,
  TYPE_HANZI,
  TYPE_LABELS,
} from "@/lib/labels";

export interface FunctionExerciseConfig {
  slug: string; // route base name, e.g. "sap-xep-cau"
  basePath: string; // "/sap-xep-cau"
  /** Single question type. Omit for a whole-category ("luyện tất cả") drill. */
  type?: QuestionType;
  category: QuestionCategory;
  title: string; // page title (Vietnamese)
  hanzi: string; // Chinese label
  desc: string; // short description under the title
}

/** Questions per synthesized "lesson" (matches hihsk's 10-per-bài grid). */
export const LESSON_SIZE = 10;

export const FUNCTION_EXERCISES: Record<string, FunctionExerciseConfig> = {
  "sap-xep-cau": {
    slug: "sap-xep-cau",
    basePath: "/sap-xep-cau",
    type: "WRITE_REORDER_SENTENCE",
    category: "WRITING",
    title: "Sắp xếp câu tiếng Trung",
    hanzi: "连词成句",
    desc: "Sắp xếp các từ thành câu hoàn chỉnh theo đúng ngữ pháp tiếng Trung",
  },
  "sua-cau-sai": {
    slug: "sua-cau-sai",
    basePath: "/sua-cau-sai",
    type: "WRITE_CORRECT_ERROR",
    category: "WRITING",
    title: "Sửa câu sai (改错句)",
    hanzi: "改错句",
    desc: "Tìm và sửa lỗi ngữ pháp trong câu tiếng Trung",
  },
  "dien-tu": {
    slug: "dien-tu",
    basePath: "/dien-tu",
    type: "READ_FILL_BLANK",
    category: "READING",
    title: "Điền từ vào chỗ trống",
    hanzi: "选词填空",
    desc: "Chọn từ thích hợp điền vào chỗ trống để hoàn thành câu",
  },
  "hoi-dap": {
    slug: "hoi-dap",
    basePath: "/hoi-dap",
    type: "LISTEN_CONVERSATION_QA",
    category: "LISTENING",
    title: "Nghe hội thoại trả lời",
    hanzi: "听对话回答",
    desc: "Nghe đoạn hội thoại rồi chọn đáp án đúng",
  },
  "doc-hieu": {
    slug: "doc-hieu",
    basePath: "/doc-hieu",
    type: "READ_PASSAGE_QA",
    category: "READING",
    title: "Đọc hiểu tiếng Trung",
    hanzi: "阅读理解",
    desc: "Đọc đoạn văn rồi trả lời các câu hỏi bên dưới",
  },
};

export function getFunctionExercise(
  slug: string
): FunctionExerciseConfig | null {
  return FUNCTION_EXERCISES[slug] ?? null;
}

/**
 * Build an on-the-fly config for the generic /practice drill, where the level +
 * category + type are already baked into the URL. `type === "all"` → a
 * whole-category mixed drill (no single type).
 */
export function buildPracticeConfig(
  level: HSKLevel,
  category: QuestionCategory,
  type: string
): FunctionExerciseConfig {
  const basePath = `/practice/${level}/${category}/${type}`;
  if (type === "all") {
    return {
      slug: `practice-${category}-all`,
      basePath,
      category,
      title: `${CATEGORY_LABELS[category]} — Luyện tất cả`,
      hanzi: CATEGORY_HANZI[category],
      desc: "Làm lẫn lộn mọi dạng bài của kỹ năng này.",
    };
  }
  const t = type as QuestionType;
  return {
    slug: `practice-${t}`,
    basePath,
    type: t,
    category,
    title: TYPE_LABELS[t],
    hanzi: TYPE_HANZI[t],
    desc: TYPE_DESC[t],
  };
}

/** Number of synthesized lessons for a given question count. */
export function lessonCount(total: number, size = LESSON_SIZE): number {
  return Math.max(1, Math.ceil(total / size));
}

/** 1-based question range covered by a lesson (given the total & lesson size). */
export function lessonRange(
  lesson: number,
  total: number,
  size = LESSON_SIZE
): { from: number; to: number } {
  const from = (lesson - 1) * size + 1;
  const to = Math.min(lesson * size, total);
  return { from, to };
}

/** The slice of questions belonging to a 1-based lesson. */
export function lessonSlice<T>(items: T[], lesson: number, size = LESSON_SIZE): T[] {
  return items.slice((lesson - 1) * size, lesson * size);
}
