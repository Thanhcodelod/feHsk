// =============================================================================
// Frontend API client. Talks to same-origin Next.js route handlers under /api,
// which proxy to the Express backend (behsk). Keeps the browser CORS-free.
// Requests carry the JWT (when logged in) via authHeaders().
// =============================================================================

import type {
  HSKLevel,
  Question,
  QuestionCategory,
  QuestionType,
  Radical,
  SentencePattern,
  SubmissionResult,
  Translation,
  VocabWord,
} from "@/lib/types";
import { authHeaders } from "@/lib/token";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface CategoryStat {
  attempts: number;
  correct: number;
}

export interface GridCell {
  attempts: number;
  correct: number;
  covered: number;
  total: number;
  done: boolean;
}

export interface ProgressResponse {
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
  streakDays: number;
  practicedToday: boolean;
  byCategory: Record<string, CategoryStat>;
  byLevel: Record<string, CategoryStat>;
  grid: Record<string, Record<string, GridCell>>;
  last14Days: { date: string; attempts: number; correct: number }[];
  recent: unknown[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  attempts: number;
  correct: number;
  accuracy: number;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Yêu cầu thất bại (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(msg, res.status);
  }
  return res.json() as Promise<T>;
}

function jsonHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", ...authHeaders() };
}

// ---------------------------------------------------------------------------
// Static-content cache. Vocab / patterns / radicals / translations are
// user-independent and only change on a re-seed, so we cache them in memory for
// the session: repeat navigation (landing → lesson → mode → back) reuses the
// same data instantly, and concurrent requests for the same URL are deduped.
// The browser HTTP cache (force-cache + backend Cache-Control) covers reloads.
// Progress / auth / submissions / exam are NEVER cached here.
// ---------------------------------------------------------------------------
const contentCache = new Map<string, Promise<unknown>>();

async function cachedJson<T>(url: string): Promise<T> {
  const hit = contentCache.get(url);
  if (hit) return hit as Promise<T>;
  // `cache: "default"` (not "force-cache") respects the backend's
  // `Cache-Control: max-age=300`, so successful content still caches for 5 min,
  // but the browser never serves a *stale error* the way force-cache does
  // (which could pin a "backend down" failure long after the backend recovers).
  const p = fetch(url, { cache: "default" })
    .then((res) => asJson<T>(res))
    .catch((err) => {
      contentCache.delete(url); // never cache a failure
      throw err;
    });
  contentCache.set(url, p);
  return p as Promise<T>;
}

/** Drop the in-memory content cache (e.g. after a re-seed in dev). */
export function clearContentCache(): void {
  contentCache.clear();
}

// ---- Questions -------------------------------------------------------------

export interface QuestionQuery {
  level?: HSKLevel;
  category?: QuestionCategory;
  type?: QuestionType;
  limit?: number;
}

export async function apiGetQuestions(
  query: QuestionQuery = {}
): Promise<Question[]> {
  const params = new URLSearchParams();
  if (query.level) params.set("level", query.level);
  if (query.category) params.set("category", query.category);
  if (query.type) params.set("type", query.type);
  if (query.limit) params.set("limit", String(query.limit));
  const res = await fetch(`/api/questions?${params.toString()}`, {
    cache: "no-store",
  });
  const data = await asJson<{ count: number; questions: Question[] }>(res);
  return data.questions;
}

export async function apiGetQuestion(id: string): Promise<Question> {
  const res = await fetch(`/api/questions/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  return asJson<Question>(res);
}

export async function apiSubmit(
  questionId: string,
  userAnswer: string
): Promise<SubmissionResult> {
  const res = await fetch(`/api/submissions`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ questionId, userAnswer }),
  });
  return asJson<SubmissionResult>(res);
}

// Per-account question-lesson progress (server-backed when logged in).
export interface QuestionProgressDTO {
  questionId: string;
  attempts: number;
  correct: boolean;
  saved: boolean;
}

export async function apiGetQuestionProgress(): Promise<QuestionProgressDTO[]> {
  const res = await fetch(`/api/question-progress`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const data = await asJson<{ states: QuestionProgressDTO[] }>(res);
  return data.states;
}

export async function apiQuestionSave(
  questionId: string,
  saved: boolean
): Promise<QuestionProgressDTO> {
  const res = await fetch(`/api/questions/save`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ questionId, saved }),
  });
  return asJson<QuestionProgressDTO>(res);
}

// ---- Auth ------------------------------------------------------------------

export async function apiRegister(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return asJson(res);
}

export async function apiLogin(input: {
  email: string;
  password: string;
}): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return asJson(res);
}

export async function apiMe(): Promise<AuthUser> {
  const res = await fetch(`/api/auth/me`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const data = await asJson<{ user: AuthUser }>(res);
  return data.user;
}

// ---- Progress / stats / leaderboard ----------------------------------------

export async function apiGetProgress(): Promise<ProgressResponse> {
  const res = await fetch(`/api/progress`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  return asJson<ProgressResponse>(res);
}

export async function apiGetLeaderboard(
  limit = 10
): Promise<LeaderboardEntry[]> {
  const res = await fetch(`/api/leaderboard?limit=${limit}`, {
    cache: "no-store",
  });
  const data = await asJson<{ leaders: LeaderboardEntry[] }>(res);
  return data.leaders;
}

// ---- Vocabulary ------------------------------------------------------------

export interface VocabQuery {
  source?: string;
  group?: string;
  level?: HSKLevel;
}

export async function apiGetVocab(q: VocabQuery = {}): Promise<VocabWord[]> {
  const params = new URLSearchParams();
  if (q.source) params.set("source", q.source);
  if (q.group) params.set("group", q.group);
  if (q.level) params.set("level", q.level);
  const data = await cachedJson<{ count: number; words: VocabWord[] }>(
    `/api/vocab?${params.toString()}`
  );
  return data.words;
}

export interface VocabSourceSummary {
  source: string;
  total: number;
  groups: { group: string; count: number }[];
}

export async function apiGetVocabSources(): Promise<VocabSourceSummary[]> {
  const data = await cachedJson<{ sources: VocabSourceSummary[] }>(
    `/api/vocab/sources`
  );
  return data.sources;
}

export async function apiGetPatterns(
  topic?: string
): Promise<{ topics: string[]; patterns: SentencePattern[] }> {
  const q = topic ? `?topic=${encodeURIComponent(topic)}` : "";
  return cachedJson<{
    count: number;
    topics: string[];
    patterns: SentencePattern[];
  }>(`/api/sentence-patterns${q}`);
}

export async function apiGetRadicals(): Promise<Radical[]> {
  const data = await cachedJson<{ count: number; radicals: Radical[] }>(
    `/api/radicals`
  );
  return data.radicals;
}

// ---- Translation practice (luyện dịch) -------------------------------------

export interface TranslationLevelSummary {
  level: HSKLevel;
  total: number;
  lessons: { lesson: number; count: number }[];
}

export async function apiGetTranslations(query: {
  level: HSKLevel;
  lesson?: number;
}): Promise<Translation[]> {
  const params = new URLSearchParams();
  params.set("level", query.level);
  if (query.lesson) params.set("lesson", String(query.lesson));
  const data = await cachedJson<{ count: number; items: Translation[] }>(
    `/api/translations?${params.toString()}`
  );
  return data.items;
}

export async function apiGetTranslationLevels(): Promise<
  TranslationLevelSummary[]
> {
  const data = await cachedJson<{ levels: TranslationLevelSummary[] }>(
    `/api/translations/levels`
  );
  return data.levels;
}

/** Pinyin → Chinese-character candidates for the virtual keyboard (IME). */
export async function apiGetPinyin(
  q: string
): Promise<{ candidates: string[]; lengths: number[] }> {
  const key = q.toLowerCase().replace(/[^a-z]/g, "");
  if (!key) return { candidates: [], lengths: [] };
  return cachedJson<{ candidates: string[]; lengths: number[] }>(
    `/api/pinyin?q=${encodeURIComponent(key)}`
  );
}

// Per-account luyện dịch progress (server-backed when logged in).
export interface TranslationAttemptDTO {
  itemId: string;
  attempts: number;
  correct: boolean;
  saved: boolean;
}

export async function apiGetTranslationProgress(): Promise<
  TranslationAttemptDTO[]
> {
  const res = await fetch(`/api/translations/progress`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const data = await asJson<{ states: TranslationAttemptDTO[] }>(res);
  return data.states;
}

export async function apiTranslationAttempt(
  itemId: string,
  correct: boolean
): Promise<TranslationAttemptDTO> {
  const res = await fetch(`/api/translations/attempt`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ itemId, correct }),
  });
  return asJson<TranslationAttemptDTO>(res);
}

export async function apiTranslationSave(
  itemId: string,
  saved: boolean
): Promise<TranslationAttemptDTO> {
  const res = await fetch(`/api/translations/save`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ itemId, saved }),
  });
  return asJson<TranslationAttemptDTO>(res);
}

// ---- SRS (SM-2, per account) -----------------------------------------------

export interface SrsCardDTO {
  cardId: string;
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReviewDate: string; // ISO
  lastReviewDate: string | null;
}

export async function apiGetSrsStates(): Promise<SrsCardDTO[]> {
  const res = await fetch(`/api/srs/states`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const data = await asJson<{ states: SrsCardDTO[] }>(res);
  return data.states;
}

export async function apiSrsReview(
  cardId: string,
  quality: number
): Promise<SrsCardDTO> {
  const res = await fetch(`/api/srs/review`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ cardId, quality }),
  });
  return asJson<SrsCardDTO>(res);
}

// ---- Mock exam (đề thi thử) -------------------------------------------------

export interface ExamDTO {
  level: HSKLevel;
  durationSeconds: number;
  sections: { category: QuestionCategory; count: number }[];
  questions: Question[];
}

export interface ExamResultDTO {
  total: number;
  correct: number;
  scoreSum: number;
  percent: number;
  passed: boolean;
  sections: Record<string, { correct: number; total: number; scoreSum: number }>;
  results: Record<string, SubmissionResult>;
}

export async function apiGetExam(level: HSKLevel): Promise<ExamDTO> {
  const res = await fetch(`/api/exam?level=${level}`, { cache: "no-store" });
  return asJson<ExamDTO>(res);
}

export async function apiSubmitExam(
  answers: { questionId: string; userAnswer: string }[]
): Promise<ExamResultDTO> {
  const res = await fetch(`/api/exam/submit`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ answers }),
  });
  return asJson<ExamResultDTO>(res);
}
