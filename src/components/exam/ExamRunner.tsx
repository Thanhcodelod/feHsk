"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertTriangle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Flag,
  Timer,
  Send,
  Trophy,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Type as TypeIcon,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionRenderer } from "@/components/practice/QuestionRenderer";
import {
  apiGetExam,
  apiSubmitExam,
  ApiError,
  type ExamDTO,
  type ExamResultDTO,
} from "@/lib/api";
import { CATEGORY_HANZI, CATEGORY_LABELS, LEVEL_LABELS } from "@/lib/labels";
import type { HSKLevel, QuestionCategory } from "@/lib/types";
import { cn, formatSeconds } from "@/lib/utils";

type Phase = "loading" | "error" | "running" | "result";

interface SecRange {
  category: QuestionCategory;
  from: number;
  to: number;
}

export function ExamRunner({ level }: { level: HSKLevel }) {
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [exam, setExam] = React.useState<ExamDTO | null>(null);
  const [answers, setAnswers] = React.useState<Record<string, string | null>>({});
  const [flags, setFlags] = React.useState<Set<string>>(new Set());
  const [index, setIndex] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(0);
  const [result, setResult] = React.useState<ExamResultDTO | null>(null);
  const [reviewing, setReviewing] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [showPinyin, setShowPinyin] = React.useState(true);
  const [showTranslation, setShowTranslation] = React.useState(false);

  const load = React.useCallback(async () => {
    setPhase("loading");
    try {
      const e = await apiGetExam(level);
      setExam(e);
      setTimeLeft(e.durationSeconds);
      setAnswers({});
      setFlags(new Set());
      setIndex(0);
      setResult(null);
      setReviewing(false);
      setPhase("running");
    } catch (e) {
      setErrorMsg(
        e instanceof ApiError ? e.message : "Không tạo được đề thi."
      );
      setPhase("error");
    }
  }, [level]);

  React.useEffect(() => {
    load();
  }, [load]);

  const submit = React.useCallback(async () => {
    if (!exam || submitting) return;
    setSubmitting(true);
    try {
      const payload = exam.questions.map((q) => ({
        questionId: q.id,
        userAnswer: answers[q.id] ?? "",
      }));
      const res = await apiSubmitExam(payload);
      setResult(res);
      setPhase("result");
      setReviewing(false);
      window.dispatchEvent(new Event("hsk-progress-updated"));
    } catch (e) {
      setErrorMsg(
        e instanceof ApiError ? e.message : "Không nộp được bài. Thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  }, [exam, answers, submitting]);

  // Countdown timer (only while actively taking the exam).
  React.useEffect(() => {
    if (phase !== "running") return;
    if (timeLeft <= 0) {
      void submit();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft, submit]);

  const secRanges: SecRange[] = React.useMemo(() => {
    if (!exam) return [];
    let offset = 0;
    return exam.sections.map((s) => {
      const from = offset;
      offset += s.count;
      return { category: s.category, from, to: offset };
    });
  }, [exam]);

  // ---- Loading / error ------------------------------------------------------
  if (phase === "loading") {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" /> Đang tạo đề thi…
      </div>
    );
  }
  if (phase === "error" || !exam) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center">
        <AlertTriangle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{errorMsg}</p>
        <div className="flex gap-2">
          <Button onClick={load}>
            <RotateCcw /> Thử lại
          </Button>
          <Link href="/thi-thu">
            <Button variant="outline">Đổi cấp độ</Button>
          </Link>
        </div>
      </div>
    );
  }

  const total = exam.questions.length;
  const answeredCount = exam.questions.filter(
    (q) => answers[q.id] != null && answers[q.id] !== ""
  ).length;
  const current = exam.questions[index];
  const currentSection = secRanges.find(
    (s) => index >= s.from && index < s.to
  );

  const showSummary = phase === "result" && !reviewing;
  const showQuestionView = phase === "running" || reviewing;

  // ---- Result summary -------------------------------------------------------
  const summary =
    result && showSummary ? (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="mx-auto max-w-xl text-center">
          <CardContent className="p-8">
            <div
              className={cn(
                "mx-auto flex size-16 items-center justify-center rounded-full",
                result.passed ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
              )}
            >
              {result.passed ? <Trophy className="size-8" /> : <ClipboardList className="size-8" />}
            </div>
            <h2 className="mt-4 text-3xl font-bold">{result.percent}%</h2>
            <Badge
              variant={result.passed ? "success" : "destructive"}
              className="mt-2 text-sm"
            >
              {result.passed ? "ĐẠT ✓" : "CHƯA ĐẠT"}
            </Badge>
            <p className="mt-2 text-muted-foreground">
              Đúng {result.correct}/{result.total} câu · {LEVEL_LABELS[level]}
            </p>

            <div className="mt-6 space-y-3 text-left">
              {Object.entries(result.sections).map(([cat, s]) => {
                const pct = s.total ? Math.round((s.scoreSum / s.total) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">
                        {CATEGORY_LABELS[cat as QuestionCategory]}{" "}
                        <span className="hanzi text-xs text-muted-foreground">
                          {CATEGORY_HANZI[cat as QuestionCategory]}
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        {s.correct}/{s.total} · {pct}%
                      </span>
                    </div>
                    <Progress value={pct} />
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button onClick={() => setReviewing(true)}>
                <ClipboardList /> Xem lại bài
              </Button>
              <Button variant="outline" onClick={load}>
                <RotateCcw /> Làm đề khác
              </Button>
              <Link href="/thi-thu">
                <Button variant="ghost">Đổi cấp độ</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    ) : null;

  return (
    <div className="space-y-4">
      {summary}

      {/* Question view — kept mounted (hidden during summary) so answers persist. */}
      <div className={showQuestionView ? "space-y-4" : "hidden"}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge>{LEVEL_LABELS[level]}</Badge>
            {reviewing ? (
              <Badge variant="secondary">Xem lại</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">
                Đã trả lời {answeredCount}/{total}
              </span>
            )}
            {currentSection ? (
              <Badge variant="outline">
                {CATEGORY_LABELS[currentSection.category]}
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {!reviewing ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-sm tabular-nums",
                  timeLeft <= 60
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "bg-secondary"
                )}
              >
                <Timer className={cn("size-4", timeLeft <= 60 && "animate-pulse")} />
                {formatSeconds(timeLeft)}
              </span>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setReviewing(false)}>
                <ChevronLeft className="size-4" /> Về kết quả
              </Button>
            )}
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2">
          <MiniToggle active={showPinyin} onClick={() => setShowPinyin((v) => !v)} icon={<TypeIcon className="size-3.5" />} label="Phiên âm" />
          <MiniToggle active={showTranslation} onClick={() => setShowTranslation((v) => !v)} icon={<Languages className="size-3.5" />} label="Dịch nghĩa" />
        </div>

        {/* Navigator */}
        <Card>
          <CardContent className="space-y-2 p-3">
            {secRanges.map((sec) => (
              <div key={sec.category} className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 w-14 shrink-0 text-xs font-medium text-muted-foreground">
                  {CATEGORY_LABELS[sec.category]}
                </span>
                {exam.questions.slice(sec.from, sec.to).map((q, k) => {
                  const i = sec.from + k;
                  const answered = answers[q.id] != null && answers[q.id] !== "";
                  const flagged = flags.has(q.id);
                  const r = result?.results[q.id];
                  let cls = "border-border bg-card text-muted-foreground hover:bg-secondary";
                  if (result) {
                    cls = r?.isCorrect
                      ? "border-success bg-success/15 text-success"
                      : "border-destructive bg-destructive/15 text-destructive";
                  } else if (i === index) {
                    cls = "border-primary bg-primary text-primary-foreground";
                  } else if (answered) {
                    cls = "border-primary/40 bg-primary/10 text-primary";
                  }
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      className={cn(
                        "relative size-8 rounded-md border text-xs font-semibold transition-colors",
                        cls,
                        i === index && result && "ring-2 ring-primary"
                      )}
                    >
                      {i + 1}
                      {flagged && !result ? (
                        <Flag className="absolute -right-1 -top-1 size-3 fill-accent text-accent" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Question body — all mounted, only current visible */}
        <Card>
          <CardContent className="p-5 sm:p-6">
            {exam.questions.map((q, i) => (
              <div key={q.id} className={i === index ? "" : "hidden"}>
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  Câu {i + 1}/{total}
                </div>
                <QuestionRenderer
                  question={q}
                  onAnswerChange={(ans) =>
                    setAnswers((a) => ({ ...a, [q.id]: ans }))
                  }
                  result={result ? result.results[q.id] ?? null : null}
                  showPinyin={showPinyin}
                  showTranslation={showTranslation}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action bar */}
        <div className="sticky bottom-4 z-10">
          <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            >
              <ChevronLeft /> Trước
            </Button>
            {!reviewing ? (
              <Button
                variant={flags.has(current.id) ? "accent" : "ghost"}
                size="sm"
                onClick={() =>
                  setFlags((f) => {
                    const n = new Set(f);
                    if (n.has(current.id)) n.delete(current.id);
                    else n.add(current.id);
                    return n;
                  })
                }
              >
                <Flag /> {flags.has(current.id) ? "Bỏ đánh dấu" : "Đánh dấu"}
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
              disabled={index === total - 1}
            >
              Sau <ChevronRight />
            </Button>
            <div className="flex-1" />
            {!reviewing ? (
              <Button
                onClick={() => {
                  const missing = total - answeredCount;
                  if (
                    missing === 0 ||
                    confirm(
                      `Bạn còn ${missing} câu chưa trả lời. Vẫn nộp bài?`
                    )
                  ) {
                    void submit();
                  }
                }}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="animate-spin" /> : <Send />}
                Nộp bài
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setReviewing(false)}>
                Kết thúc xem lại
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniToggle({
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
