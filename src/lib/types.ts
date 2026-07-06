// =============================================================================
// Core domain types + the ANSWER ENCODING CONTRACT
// =============================================================================
// This file is the single source of truth shared by:
//   - the seed data (src/data/*)          -> produces `options` / `correctAnswer`
//   - the question components (src/components/questions/*) -> read a Question,
//        collect the user's answer, and call onAnswerChange(answerString)
//   - the grader (src/lib/grading.ts)      -> compares answerString vs question
//
// Every question type encodes its user answer as a STRING (see ANSWER FORMAT
// comments on each type below). Complex answers are JSON.stringify'd.
// =============================================================================

export type HSKLevel = "HSK1" | "HSK2" | "HSK3" | "HSK4" | "HSK5" | "HSK6";

export const HSK_LEVELS: HSKLevel[] = [
  "HSK1",
  "HSK2",
  "HSK3",
  "HSK4",
  "HSK5",
  "HSK6",
];

export type QuestionCategory =
  | "LISTENING"
  | "READING"
  | "WRITING"
  | "SPEAKING"
  | "VOCAB_PRONUNCIATION";

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  "LISTENING",
  "READING",
  "WRITING",
  "SPEAKING",
  "VOCAB_PRONUNCIATION",
];

export type QuestionType =
  // Listening
  | "LISTEN_CHOOSE_PICTURE"
  | "LISTEN_TRUE_FALSE"
  | "LISTEN_CONVERSATION_QA"
  | "LISTEN_PASSAGE_QA"
  // Reading
  | "READ_MATCH_PICTURE"
  | "READ_FILL_BLANK"
  | "READ_REORDER_PARAGRAPH"
  | "READ_PASSAGE_QA"
  | "READ_ERROR_DETECTION"
  // Writing
  | "WRITE_REORDER_SENTENCE"
  | "WRITE_PICTURE_PROMPT"
  | "WRITE_CORRECT_ERROR"
  | "WRITE_ESSAY"
  // Speaking
  | "SPEAK_REPEAT"
  | "SPEAK_DESCRIBE_PICTURE"
  | "SPEAK_OPINION"
  // Vocab & Pronunciation
  | "VOCAB_WRITE_PINYIN_HANZI"
  | "VOCAB_RADICAL_ANALYSIS"
  | "VOCAB_SYNONYM_DIFF";

// ---------------------------------------------------------------------------
// Structured option shapes stored in Question.options (Json)
// ---------------------------------------------------------------------------

/** A single selectable choice. `imageUrl` may be an emoji used as a picture. */
export interface Option {
  id: string;
  text: string;
  pinyin?: string;
  imageUrl?: string;
}

/** One sub-question inside a passage/conversation Q&A. */
export interface SubQuestion {
  id: string;
  questionText: string;
  pinyin?: string;
  options: Option[];
  /** Stripped from client payloads by the backend; correctness comes via `result`. */
  correctId?: string;
}

/** Options for a matching task: connect each left item to a right item. */
export interface MatchOptions {
  left: Option[]; // words / phrases
  right: Option[]; // pictures (emoji in imageUrl)
}

/** A blank inside a fill-in / synonym task. */
export interface BlankSpec {
  id: string;
  before: string;
  after: string;
  choices: string[];
  /** Stripped from client payloads by the backend; correctness comes via `result`. */
  answer?: string;
  pinyin?: string;
}

/** Radical / component breakdown for a character. */
export interface RadicalPart {
  char: string;
  meaning: string;
  role?: string; // e.g. "radical (semantic)" | "phonetic"
}

// ---------------------------------------------------------------------------
// The canonical Question shape (mirrors Prisma model + typed `options`/`meta`)
// ---------------------------------------------------------------------------

export interface Question {
  id: string;
  level: HSKLevel;
  category: QuestionCategory;
  type: QuestionType;
  audioUrl?: string | null;
  audioText?: string | null;
  passageText?: string | null;
  questionText: string;
  pinyinGuide?: string | null;
  imageUrl?: string | null;
  wordBank: string[];
  /** Structured, type-specific — see per-type ANSWER FORMAT notes. */
  options?: unknown;
  /**
   * Present only in backend/seed data. Client payloads have this stripped —
   * components must derive review state from `SubmissionResult` after grading,
   * never from the question itself.
   */
  correctAnswer?: string;
  explanation?: string | null;
  /** Extra type-specific data (essay limits, radical parts, translations...). */
  meta?: QuestionMeta | null;
}

export interface QuestionMeta {
  translation?: string; // English translation of prompt/passage
  keywords?: string[]; // required keywords (essay / picture prompt)
  minWords?: number;
  maxWords?: number;
  pinyin?: string; // canonical pinyin (vocab dictation)
  hanzi?: string; // canonical hanzi (vocab dictation)
  parts?: RadicalPart[]; // radical decomposition
  prepSeconds?: number; // speaking prep countdown
  recordSeconds?: number; // speaking record window
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------

export interface SubmissionResult {
  isCorrect: boolean;
  score: number; // 0..1
  feedback?: string;
  correctAnswer: string; // human-readable correct answer for display
  explanation?: string | null;
  /** Per-part correctness for multi-part answers (match / blanks / sub-Qs). */
  breakdown?: Record<string, boolean>;
}

// ---------------------------------------------------------------------------
// The contract every question component in src/components/questions implements.
// The parent (PracticeSession) remounts the component per question via `key`,
// so components manage their own local working state and simply report the
// current answer up through `onAnswerChange`. When `result` becomes non-null
// the component switches to read-only review mode (highlight correct/incorrect).
// ---------------------------------------------------------------------------

export interface QuestionComponentProps {
  question: Question;
  /** Report the current answer string (or null when not ready to submit). */
  onAnswerChange: (answer: string | null) => void;
  /** Null until the user checks; then the grade is shown. */
  result: SubmissionResult | null;
  showPinyin: boolean;
  showTranslation: boolean;
}

// ---------------------------------------------------------------------------
// API DTOs
// ---------------------------------------------------------------------------

export interface SubmitRequest {
  questionId: string;
  userAnswer: string;
}

export interface StatsResponse {
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
  streakDays: number;
  byCategory: Record<QuestionCategory, { attempts: number; correct: number }>;
  byLevel: Record<HSKLevel, { attempts: number; correct: number }>;
}

// ===========================================================================
// ANSWER FORMAT REFERENCE (authoritative — components & grader MUST agree)
// ===========================================================================
// LISTEN_CHOOSE_PICTURE   answer = Option.id            correctAnswer = Option.id
// LISTEN_TRUE_FALSE       answer = "true" | "false"     correctAnswer = "true"|"false"
// LISTEN_CONVERSATION_QA  answer = Option.id            correctAnswer = Option.id
// LISTEN_PASSAGE_QA       options = SubQuestion[]        answer = JSON {subQId: optId}
//                         correctAnswer = JSON {subQId: correctId}
// READ_MATCH_PICTURE      options = MatchOptions         answer = JSON {leftId: rightId}
//                         correctAnswer = JSON {leftId: rightId}
// READ_FILL_BLANK         passageText has ___ blanks; wordBank = draggable words
//                         answer = JSON string[] (word per blank, in order)
//                         correctAnswer = JSON string[]
// READ_REORDER_PARAGRAPH  options = Option[] (sentences) answer = JSON string[] (ids in order)
//                         correctAnswer = JSON string[] (correct id order)
// READ_PASSAGE_QA         options = SubQuestion[]         answer = JSON {subQId: optId}
//                         correctAnswer = JSON {subQId: correctId}
// READ_ERROR_DETECTION    options = Option[]             answer = Option.id (the wrong sentence)
//                         correctAnswer = Option.id
// WRITE_REORDER_SENTENCE  wordBank = scrambled tokens    answer = assembled string
//                         correctAnswer = target sentence (compared normalized)
// WRITE_PICTURE_PROMPT    meta.keywords required         answer = free text (heuristic grade)
// WRITE_CORRECT_ERROR     questionText = wrong sentence  answer = corrected text
//                         correctAnswer = correct sentence (compared normalized)
// WRITE_ESSAY             meta.keywords/minWords/maxWords answer = essay text (heuristic grade)
// SPEAK_REPEAT            audioText = target sentence     answer = recognized transcript
//                         correctAnswer = target sentence (similarity grade)
// SPEAK_DESCRIBE_PICTURE  answer = transcript|"__recorded__" (lenient, always credited)
// SPEAK_OPINION           answer = transcript|"__recorded__" (lenient, always credited)
// VOCAB_WRITE_PINYIN_HANZI audioText = word; meta.hanzi/pinyin
//                         answer = typed hanzi OR pinyin; correctAnswer = hanzi
// VOCAB_RADICAL_ANALYSIS  options = Option[]; meta.parts  answer = Option.id
//                         correctAnswer = Option.id
// VOCAB_SYNONYM_DIFF      options = { comparison: Option[], blanks: BlankSpec[] }
//                         answer = JSON string[] (choice per blank)
//                         correctAnswer = JSON string[]
// ===========================================================================

export const RECORDED_MARKER = "__recorded__";

export type VocabSource =
  | "HSK"
  | "HSK30"
  | "MAJOR"
  | "BOYA"
  | "TOCFL"
  | "THEME";

/** A vocabulary entry for the flashcard / review feature. */
export interface VocabWord {
  id: string;
  source?: VocabSource;
  group?: string;
  level?: HSKLevel;
  hanzi: string;
  traditional?: string;
  pinyin: string;
  vi: string; // Vietnamese meaning
  topic?: string;
}

/** A sentence pattern (mẫu câu) organised by topic. */
export interface SentencePattern {
  id: string;
  topic: string;
  pattern: string;
  pinyin: string;
  meaning: string;
  example: string;
  examplePinyin: string;
  exampleVi: string;
}

/** A Kangxi radical (bộ thủ) — the 214 standard radicals. */
export interface Radical {
  number: number;
  radical: string;
  variants?: string;
  pinyin: string;
  strokes: number;
  hanViet: string;
  meaning: string;
  examples: string;
}

/** A translation-practice item (luyện dịch) — Vietnamese ↔ Chinese. */
export interface Translation {
  id: string; // e.g. "tr-h1-1-1"
  level: HSKLevel; // HSK1..HSK6
  lesson: number; // 1..10
  index: number; // 1..20 within the lesson
  vi: string; // Vietnamese sentence
  zh: string; // simplified-Chinese translation (primary answer)
  pinyin: string; // Hanyu Pinyin of zh
  zhVariants?: string[]; // acceptable alternative Chinese answers
}
