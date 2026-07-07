"use client";

import * as React from "react";
import Link from "next/link";
import {
  Loader2,
  Home,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Check,
  Bookmark,
  Flag,
  ListChecks,
  Type as TypeIcon,
  Languages,
} from "lucide-react";
import { QuestionRenderer } from "@/components/practice/QuestionRenderer";
import { FeedbackPanel } from "@/components/practice/FeedbackPanel";
import { apiGetQuestions, apiSubmit, ApiError } from "@/lib/api";
import { recordAttempt } from "@/lib/storage";
import { useAuth } from "@/lib/auth";
import {
  loadQ,
  applyAttempt,
  persistQAttempt,
  persistQSaved,
  type QMap,
} from "@/lib/question-lessons-store";
import {
  LESSON_SIZE,
  lessonSlice,
  lessonCount,
  lessonRange,
  type FunctionExerciseConfig,
} from "@/lib/function-exercises";
import { LEVEL_LABELS, TYPE_LABELS, TYPE_HANZI } from "@/lib/labels";
import type { HSKLevel, Question, SubmissionResult } from "@/lib/types";
import { cn } from "@/lib/utils";

function levelFromParam(p?: string): HSKLevel | null {
  const n = Number(p);
  return n >= 1 && n <= 6 ? (`HSK${n}` as HSKLevel) : null;
}
function levelNum(l: HSKLevel): number {
  return Number(l.replace("HSK", ""));
}

export function FunctionLessonExercise({
  config,
  levelParam,
  lessonParam,
  startAt,
  fixedLevel,
}: {
  config: FunctionExerciseConfig;
  levelParam?: string;
  lessonParam?: string;
  startAt?: number;
  /** When set, the level is locked (from the URL) — used by /practice. */
  fixedLevel?: HSKLevel;
}) {
  const level = fixedLevel ?? levelFromParam(levelParam);
  const lesson = Number(lessonParam);
  const fixed = !!fixedLevel;
  const { user } = useAuth();
  const scope = user?.id ?? "guest";
  const base = config.basePath;
  const typeLabel = config.type ? TYPE_LABELS[config.type] : "Luyện tổng hợp";
  const typeHanzi = config.type ? TYPE_HANZI[config.type] : "";

  const [all, setAll] = React.useState<Question[] | null>(null);
  const [error, setError] = React.useState("");
  const [index, setIndex] = React.useState(Math.max(0, (startAt ?? 1) - 1));
  const [answer, setAnswer] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<SubmissionResult | null>(null);
  const [checking, setChecking] = React.useState(false);
  const [prog, setProg] = React.useState<QMap>({});
  const [saved, setSaved] = React.useState<string[]>([]);
  const [showPinyin, setShowPinyin] = React.useState(true);
  const [showTranslation, setShowTranslation] = React.useState(false);
  const [reported, setReported] = React.useState(false);

  React.useEffect(() => {
    if (!level || !lesson) {
      setError("Bài học không hợp lệ.");
      return;
    }
    let active = true;
    apiGetQuestions({ level, category: config.category, type: config.type })
      .then((d) => active && setAll(d))
      .catch(
        (e) =>
          active &&
          setError(e instanceof ApiError ? e.message : "Không tải được dữ liệu.")
      );
    return () => {
      active = false;
    };
  }, [level, lesson, config.category, config.type]);

  React.useEffect(() => {
    let active = true;
    loadQ(!!user, scope).then(({ prog, saved }) => {
      if (!active) return;
      setProg(prog);
      setSaved(saved);
    });
    return () => {
      active = false;
    };
  }, [user, scope]);

  const lessons = React.useMemo(() => {
    if (!all) return [];
    const total = all.length;
    const count = lessonCount(total, LESSON_SIZE);
    return Array.from({ length: count }, (_, i) => {
      const n = i + 1;
      const { from, to } = lessonRange(n, total, LESSON_SIZE);
      return { num: n, from, to };
    });
  }, [all]);

  const items = React.useMemo(
    () => (all ? lessonSlice(all, lesson, LESSON_SIZE) : []),
    [all, lesson]
  );

  React.useEffect(() => {
    if (items.length) setIndex((i) => Math.min(Math.max(0, i), items.length - 1));
  }, [items.length]);

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }
  if (!all || !level) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" /> Đang tải bài học…
      </div>
    );
  }
  if (!items.length) {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        Không tìm thấy bài {lesson}.
      </div>
    );
  }

  const num = levelNum(level);
  const lessonHref = (l: number) => (fixed ? `${base}/${l}` : `${base}/${num}/${l}`);
  const levelLandingHref = fixed ? base : `${base}/${num}`;
  const cur = items[index];
  const isSaved = saved.includes(cur.id);
  const isLast = index >= items.length - 1;

  const goto = (i: number) => {
    setIndex(Math.min(Math.max(0, i), items.length - 1));
    setAnswer(null);
    setResult(null);
    setReported(false);
  };

  const check = async () => {
    if (!cur || answer === null || checking || result) return;
    setChecking(true);
    try {
      const res = await apiSubmit(cur.id, answer);
      setResult(res);
      recordAttempt({
        questionId: cur.id,
        level: cur.level,
        category: cur.category,
        type: cur.type,
        isCorrect: res.isCorrect,
        score: res.score,
      });
      setProg((p) => applyAttempt(p, cur.id, res.isCorrect)); // optimistic
      void persistQAttempt(!!user, scope, cur.id, res.isCorrect);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Không chấm được bài. Thử lại nhé."
      );
    } finally {
      setChecking(false);
    }
  };

  const toggleSave = () => {
    const willSave = !isSaved;
    setSaved((s) =>
      willSave ? [...s, cur.id] : s.filter((x) => x !== cur.id)
    );
    void persistQSaved(!!user, scope, cur.id, willSave);
  };

  const stepState = (i: number): "current" | "ok" | "bad" | "todo" => {
    if (i === index) return "current";
    const rec = prog[items[i].id];
    if (rec?.ok === 1) return "ok";
    if (rec?.a) return "bad";
    return "todo";
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground">
          <Home className="size-3.5" /> Trang chủ
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={base} className="hover:text-foreground">
          {config.title}
        </Link>
        {!fixed ? (
          <>
            <ChevronRight className="size-3.5" />
            <Link href={`${base}/${num}`} className="hover:text-foreground">
              {LEVEL_LABELS[level]}
            </Link>
          </>
        ) : null}
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">Bài {lesson}</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* Main */}
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border bg-card p-4">
            <div>
              <h1 className="text-xl font-bold">
                {LEVEL_LABELS[level]} · Bài {lesson}
              </h1>
              <p className="text-sm text-muted-foreground">
                {items.length} câu · {typeLabel}{" "}
                {typeHanzi ? <span className="hanzi">{typeHanzi}</span> : null}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Toggle
                active={showPinyin}
                onClick={() => setShowPinyin((v) => !v)}
                icon={<TypeIcon className="size-3.5" />}
                label="Phiên âm"
              />
              <Toggle
                active={showTranslation}
                onClick={() => setShowTranslation((v) => !v)}
                icon={<Languages className="size-3.5" />}
                label="Dịch nghĩa"
              />
            </div>
          </div>

          {/* Progress + stepper */}
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">
                Câu {index + 1}/{items.length}
              </span>
              <span className="text-muted-foreground">Bài {lesson}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${((index + 1) / items.length) * 100}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {items.map((_, i) => {
                const st = stepState(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goto(i)}
                    className={cn(
                      "size-8 rounded-lg border text-xs font-semibold transition-colors",
                      st === "current" &&
                        "border-primary bg-primary text-primary-foreground",
                      st === "ok" &&
                        "border-success/50 bg-success/15 text-success",
                      st === "bad" &&
                        "border-destructive/50 bg-destructive/10 text-destructive",
                      st === "todo" &&
                        "border-border text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question card */}
          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-3 flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={toggleSave}
                className={cn(
                  "rounded-full p-1.5 hover:bg-secondary",
                  isSaved
                    ? "text-amber-500"
                    : "text-muted-foreground hover:text-primary"
                )}
                aria-label="Lưu câu"
                title="Lưu câu"
              >
                <Bookmark className={cn("size-4", isSaved && "fill-current")} />
              </button>
              <button
                type="button"
                onClick={() => setReported(true)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                  reported
                    ? "border-success/40 text-success"
                    : "text-muted-foreground hover:bg-secondary"
                )}
              >
                <Flag className="size-3" /> {reported ? "Đã báo" : "Báo lỗi"}
              </button>
            </div>

            <QuestionRenderer
              key={cur.id}
              question={cur}
              onAnswerChange={setAnswer}
              result={result}
              showPinyin={showPinyin}
              showTranslation={showTranslation}
            />

            <div className="mt-4">
              <FeedbackPanel result={result} />
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between gap-2">
              {!result ? (
                <button
                  type="button"
                  onClick={check}
                  disabled={answer === null || checking}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {checking ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  Kiểm tra
                </button>
              ) : (
                <span className="text-sm font-medium text-muted-foreground">
                  {index + 1}/{items.length} câu
                </span>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goto(index - 1)}
                  disabled={index === 0}
                  className="inline-flex items-center rounded-lg border p-2 text-muted-foreground hover:bg-secondary disabled:opacity-40"
                  aria-label="Câu trước"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {isLast ? (
                  <Link
                    href={levelLandingHref}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-secondary"
                  >
                    Hoàn thành bài <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => goto(index + 1)}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-secondary"
                  >
                    Tiếp tục <ArrowRight className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar — Danh sách bài */}
        <aside className="space-y-3 lg:sticky lg:top-32 lg:self-start">
          <div className="flex items-center gap-2 rounded-t-xl bg-primary px-4 py-3 text-primary-foreground">
            <ListChecks className="size-4" />
            <span className="font-bold">Danh sách bài</span>
          </div>
          <div className="scroll-thin max-h-[70vh] space-y-1.5 overflow-y-auto pr-1">
            {lessons.map((l) => {
              const active = l.num === lesson;
              return (
                <Link
                  key={l.num}
                  href={lessonHref(l.num)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 text-sm transition-colors",
                    active
                      ? "border-primary/50 bg-primary/5"
                      : "hover:border-primary/40 hover:bg-secondary"
                  )}
                >
                  <span>
                    <span
                      className={cn("font-semibold", active && "text-primary")}
                    >
                      Bài {l.num}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      Câu {l.from}–{l.to}
                    </span>
                  </span>
                  <ChevronRight
                    className={cn(
                      "size-4",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </Link>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Toggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:bg-secondary"
      )}
      aria-pressed={active}
    >
      {icon}
      {label}
    </button>
  );
}
