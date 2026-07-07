import type { HSKLevel, QuestionCategory, QuestionType } from "@/lib/types";

// =============================================================================
// Nhãn hiển thị tiếng Việt (kèm chữ Hán) cho toàn ứng dụng.
// =============================================================================

export const LEVEL_LABELS: Record<HSKLevel, string> = {
  HSK1: "HSK 1",
  HSK2: "HSK 2",
  HSK3: "HSK 3",
  HSK4: "HSK 4",
  HSK5: "HSK 5",
  HSK6: "HSK 6",
};

/** Short tier label per level (hihsk-style: Sơ cấp / Trung cấp / Cao cấp). */
export const LEVEL_TIER: Record<HSKLevel, string> = {
  HSK1: "Sơ cấp 1",
  HSK2: "Sơ cấp 2",
  HSK3: "Trung cấp 1",
  HSK4: "Trung cấp 2",
  HSK5: "Cao cấp 1",
  HSK6: "Cao cấp 2",
};

export const LEVEL_DESCRIPTIONS: Record<HSKLevel, string> = {
  HSK1: "150 từ · Sơ cấp nhập môn",
  HSK2: "300 từ · Giao tiếp cơ bản",
  HSK3: "600 từ · Trung cấp đời sống",
  HSK4: "1200 từ · Giao tiếp trôi chảy",
  HSK5: "2500 từ · Đọc nâng cao & báo chí",
  HSK6: "5000+ từ · Trình độ gần bản ngữ",
};

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  LISTENING: "Nghe",
  READING: "Đọc",
  WRITING: "Viết & Ngữ pháp",
  SPEAKING: "Nói",
  VOCAB_PRONUNCIATION: "Từ vựng & Phát âm",
};

export const CATEGORY_HANZI: Record<QuestionCategory, string> = {
  LISTENING: "听力",
  READING: "阅读",
  WRITING: "书写",
  SPEAKING: "口语",
  VOCAB_PRONUNCIATION: "词汇",
};

export const CATEGORY_ICON: Record<QuestionCategory, string> = {
  LISTENING: "Headphones",
  READING: "BookOpen",
  WRITING: "PenLine",
  SPEAKING: "Mic",
  VOCAB_PRONUNCIATION: "Languages",
};

export const CATEGORY_COLOR: Record<QuestionCategory, string> = {
  LISTENING: "#3b82f6",
  READING: "#10b981",
  WRITING: "#f59e0b",
  SPEAKING: "#8b5cf6",
  VOCAB_PRONUNCIATION: "#ef4444",
};

export const TYPE_LABELS: Record<QuestionType, string> = {
  LISTEN_CHOOSE_PICTURE: "Nghe & chọn hình",
  LISTEN_TRUE_FALSE: "Nghe & phán đoán Đúng/Sai",
  LISTEN_CONVERSATION_QA: "Nghe hội thoại trả lời",
  LISTEN_PASSAGE_QA: "Nghe đoạn văn trả lời",
  READ_MATCH_PICTURE: "Nối hình với từ",
  READ_FILL_BLANK: "Chọn từ điền vào chỗ trống",
  READ_REORDER_PARAGRAPH: "Sắp xếp thành đoạn văn",
  READ_PASSAGE_QA: "Đọc hiểu",
  READ_ERROR_DETECTION: "Tìm câu sai (病句)",
  WRITE_REORDER_SENTENCE: "Sắp xếp thành câu (连词成句)",
  WRITE_PICTURE_PROMPT: "Nhìn hình viết câu",
  WRITE_CORRECT_ERROR: "Sửa câu sai",
  WRITE_ESSAY: "Viết đoạn văn",
  SPEAK_REPEAT: "Nghe & nói theo",
  SPEAK_DESCRIBE_PICTURE: "Nhìn hình diễn đạt",
  SPEAK_OPINION: "Trình bày quan điểm",
  VOCAB_WRITE_PINYIN_HANZI: "Nghe viết pinyin / Hán tự",
  VOCAB_RADICAL_ANALYSIS: "Phân tích bộ thủ",
  VOCAB_SYNONYM_DIFF: "Phân biệt từ gần nghĩa",
};

export const TYPE_HANZI: Record<QuestionType, string> = {
  LISTEN_CHOOSE_PICTURE: "听和选择图片",
  LISTEN_TRUE_FALSE: "听和判断对错",
  LISTEN_CONVERSATION_QA: "听对话回答问题",
  LISTEN_PASSAGE_QA: "听短文回答问题",
  READ_MATCH_PICTURE: "图片词句匹配",
  READ_FILL_BLANK: "选词填空",
  READ_REORDER_PARAGRAPH: "排列顺序",
  READ_PASSAGE_QA: "阅读理解",
  READ_ERROR_DETECTION: "找病句",
  WRITE_REORDER_SENTENCE: "连词成句",
  WRITE_PICTURE_PROMPT: "看图写句子",
  WRITE_CORRECT_ERROR: "改错句",
  WRITE_ESSAY: "写短文",
  SPEAK_REPEAT: "听读跟读",
  SPEAK_DESCRIBE_PICTURE: "看图表达",
  SPEAK_OPINION: "口头表达",
  VOCAB_WRITE_PINYIN_HANZI: "拼音汉字听写",
  VOCAB_RADICAL_ANALYSIS: "部首拆解",
  VOCAB_SYNONYM_DIFF: "近义词辨析",
};

export const TYPE_DESC: Record<QuestionType, string> = {
  LISTEN_CHOOSE_PICTURE: "Nghe và chọn hình đúng.",
  LISTEN_TRUE_FALSE: "Nghe rồi phán đoán Đúng / Sai.",
  LISTEN_CONVERSATION_QA: "Nghe hội thoại, trả lời câu hỏi.",
  LISTEN_PASSAGE_QA: "Nghe đoạn văn dài, trả lời nhiều câu.",
  READ_MATCH_PICTURE: "Nối từ / cụm từ với hình.",
  READ_FILL_BLANK: "Chọn từ điền vào chỗ trống.",
  READ_REORDER_PARAGRAPH: "Sắp xếp câu thành đoạn văn.",
  READ_PASSAGE_QA: "Đọc đoạn văn, trả lời câu hỏi.",
  READ_ERROR_DETECTION: "Tìm câu có lỗi ngữ pháp (病句).",
  WRITE_REORDER_SENTENCE: "Sắp xếp từ thành câu (连词成句).",
  WRITE_PICTURE_PROMPT: "Nhìn hình viết câu với từ khoá.",
  WRITE_CORRECT_ERROR: "Sửa câu sai.",
  WRITE_ESSAY: "Viết đoạn văn theo đề.",
  SPEAK_REPEAT: "Nghe và nói theo.",
  SPEAK_DESCRIBE_PICTURE: "Nhìn hình diễn đạt / trả lời.",
  SPEAK_OPINION: "Trình bày quan điểm.",
  VOCAB_WRITE_PINYIN_HANZI: "Nghe viết pinyin / Hán tự.",
  VOCAB_RADICAL_ANALYSIS: "Phân tích bộ thủ.",
  VOCAB_SYNONYM_DIFF: "Phân biệt từ gần nghĩa.",
};

export const CATEGORY_TYPES: Record<QuestionCategory, QuestionType[]> = {
  LISTENING: [
    "LISTEN_CHOOSE_PICTURE",
    "LISTEN_TRUE_FALSE",
    "LISTEN_CONVERSATION_QA",
    "LISTEN_PASSAGE_QA",
  ],
  READING: [
    "READ_MATCH_PICTURE",
    "READ_FILL_BLANK",
    "READ_REORDER_PARAGRAPH",
    "READ_PASSAGE_QA",
    "READ_ERROR_DETECTION",
  ],
  WRITING: [
    "WRITE_REORDER_SENTENCE",
    "WRITE_PICTURE_PROMPT",
    "WRITE_CORRECT_ERROR",
    "WRITE_ESSAY",
  ],
  SPEAKING: ["SPEAK_REPEAT", "SPEAK_DESCRIBE_PICTURE", "SPEAK_OPINION"],
  VOCAB_PRONUNCIATION: [
    "VOCAB_WRITE_PINYIN_HANZI",
    "VOCAB_RADICAL_ANALYSIS",
    "VOCAB_SYNONYM_DIFF",
  ],
};

export function categoryOfType(type: QuestionType): QuestionCategory {
  for (const [cat, types] of Object.entries(CATEGORY_TYPES)) {
    if (types.includes(type)) return cat as QuestionCategory;
  }
  return "READING";
}

/** Route prefix per vocab source (hihsk-style URLs). */
export const SOURCE_PATH: Record<string, string> = {
  HSK: "/vocab-hsk",
  HSK30: "/vocab-hsk30",
  MAJOR: "/vocab-major",
  BOYA: "/vocab-boya",
  TOCFL: "/vocab-tocfl",
  THEME: "/vocab-topic",
};

/** Per-level accent (border + soft bg + text) for level pills. Dark-aware. */
export const LEVEL_ACCENT: Record<HSKLevel, string> = {
  HSK1: "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300",
  HSK2: "border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500/50 dark:bg-sky-500/10 dark:text-sky-300",
  HSK3: "border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-500/50 dark:bg-pink-500/10 dark:text-pink-300",
  HSK4: "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-300",
  HSK5: "border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-500/50 dark:bg-violet-500/10 dark:text-violet-300",
  HSK6: "border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/10 dark:text-rose-300",
};

/** Colored tone cycled across level/lesson cards. */
export const CARD_TONES = [
  "from-rose-500 to-red-500",
  "from-sky-500 to-blue-500",
  "from-violet-500 to-purple-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-teal-500 to-cyan-500",
  "from-indigo-500 to-blue-600",
  "from-emerald-500 to-green-600",
  "from-fuchsia-500 to-pink-600",
  "from-slate-500 to-slate-700",
];

/** Vocabulary source metadata for the multi-source vocab hub (hihsk-style). */
export const VOCAB_SOURCE_META: Record<
  string,
  { label: string; description: string; emoji: string }
> = {
  HSK: {
    label: "Từ vựng HSK",
    description: "Học từ vựng theo bài và cấp độ",
    emoji: "📘",
  },
  HSK30: {
    label: "Từ vựng HSK 3.0",
    description: "Bộ lesson mới chuẩn HSK 3.0 (9 bậc)",
    emoji: "🔥",
  },
  MAJOR: {
    label: "Từ vựng chuyên ngành",
    description: "Chia theo chuyên ngành, 15 từ một bài",
    emoji: "💼",
  },
  BOYA: {
    label: "Từ vựng Boya",
    description: "Học từ vựng giáo trình Boya",
    emoji: "📗",
  },
  TOCFL: {
    label: "Từ vựng TOCFL",
    description: "Học từ vựng phồn thể (Đài Loan)",
    emoji: "🏆",
  },
  THEME: {
    label: "Từ vựng chủ đề",
    description: "Học từ vựng theo chủ đề giao tiếp",
    emoji: "📚",
  },
};

/** Common UI strings (Vietnamese). */
export const UI = {
  appName: "HSK Master",
  appTagline: "Luyện thi HSK cho người Việt",
  nav: {
    dashboard: "Trang chủ",
    practice: "Luyện tập",
    progress: "Tiến độ",
  },
  actions: {
    check: "Kiểm tra",
    next: "Câu tiếp theo",
    finish: "Hoàn thành",
    retry: "Làm lại",
    start: "Bắt đầu",
    listen: "Nghe",
    stop: "Dừng",
    record: "Ghi âm",
    play: "Nghe lại",
    submit: "Nộp bài",
    back: "Quay lại",
  },
  toggles: {
    pinyin: "Phiên âm",
    translation: "Dịch nghĩa",
  },
  feedback: {
    correct: "Chính xác!",
    incorrect: "Chưa đúng",
    answer: "Đáp án",
    explanation: "Giải thích",
    yourAnswer: "Câu trả lời của bạn",
  },
} as const;
