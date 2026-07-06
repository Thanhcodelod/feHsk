"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Check,
  ArrowRight,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Trophy,
  Languages,
  Type as TypeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionRenderer } from "@/components/practice/QuestionRenderer";
import { FeedbackPanel } from "@/components/practice/FeedbackPanel";
import { apiGetQuestions, apiSubmit, ApiError } from "@/lib/api";
import { recordAttempt } from "@/lib/storage";
import {
  CATEGORY_HANZI,
  CATEGORY_LABELS,
  LEVEL_LABELS,
  TYPE_HANZI,
  TYPE_LABELS,
} from "@/lib/labels";
import type {
  HSKLevel,
  Question,
  QuestionCategory,
  QuestionType,
  SubmissionResult,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  level: HSKLevel;
  category: QuestionCategory;
  /** When set, practice only this dạng bài; otherwise all types (mixed). */
  type?: QuestionType;
  /** Where "exit / change" links go (defaults to the category type-picker). */
  exitHref?: string;
  exitLabel?: string;
}

type Status = "loading" | "error" | "ready" | "empty";

export function PracticeSession({
  level,
  category,
  type,
  exitHref,
  exitLabel,
}: Props) {
  const backHref = exitHref ?? `/practice/${level}/${category}`;
  const backLabel = exitLabel ?? "Đổi dạng bài";
  const [status, setStatus] = React.useState<Status>("loading");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [index, setIndex] = React.useState(0);

  const [answer, setAnswer] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<SubmissionResult | null>(null);
  const [checking, setChecking] = React.useState(false);

  const [showPinyin, setShowPinyin] = React.useState(true);
  const [showTranslation, setShowTranslation] = React.useState(false);

  // Session score accumulation.
  const [answered, setAnswered] = React.useState(0);
  const [scoreSum, setScoreSum] = React.useState(0);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [finished, setFinished] = React.useState(false);

  const load = React.useCallback(async () => {
    setStatus("loading");
    try {
      const qs = await apiGetQuestions({ level, category, type });
      if (!qs.length) {
        setStatus("empty");
        return;
      }
      setQuestions(qs);
      setStatus("ready");
    } catch (e) {
      setErrorMsg(
        e instanceof ApiError ? e.message : "Đã xảy ra lỗi khi tải câu hỏi."
      );
      setStatus("error");
    }
  }, [level, category, type]);

  React.useEffect(() => {
    load();
  }, [load]);

  const current = questions[index];

  const handleCheck = async () => {
    if (!current || answer === null || checking) return;
    setChecking(true);
    try {
      const res = await apiSubmit(current.id, answer);
      setResult(res);
      recordAttempt({
        questionId: current.id,
        level: current.level,
        category: current.category,
        type: current.type,
        isCorrect: res.isCorrect,
        score: res.score,
      });
      setAnswered((n) => n + 1);
      setScoreSum((s) => s + res.score);
      if (res.isCorrect) setCorrectCount((c) => c + 1);
    } catch (e) {
      setErrorMsg(
        e instanceof ApiError ? e.message : "Không chấm được bài. Thử lại nhé."
      );
    } finally {
      setChecking(false);
    }
  };

  const handleNext = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setAnswer(null);
    setResult(null);
  };

  const restart = () => {
    setIndex(0);
    setAnswer(null);
    setResult(null);
    setAnswered(0);
    setScoreSum(0);
    setCorrectCount(0);
    setFinished(false);
  };

  // ---- Loading / error / empty states --------------------------------------
  if (status === "loading") {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" />
        Đang tải câu hỏi…
      </div>
    );
  }
  if (status === "error") {
    return (
      <SessionMessage
        icon={<AlertTriangle className="size-8 text-destructive" />}
        title="Không tải được câu hỏi"
        body={errorMsg}
        action={
          <Button onClick={load}>
            <RotateCcw /> Thử lại
          </Button>
        }
      />
    );
  }
  if (status === "empty") {
    return (
      <SessionMessage
        icon={<AlertTriangle className="size-8 text-accent" />}
        title="Chưa có câu hỏi"
        body={`Chưa có câu hỏi cho ${LEVEL_LABELS[level]} · ${CATEGORY_LABELS[category]}${
          type ? ` · ${TYPE_LABELS[type]}` : ""
        }.`}
        action={
          <Link href={backHref}>
            <Button variant="outline">
              <ChevronLeft /> {backLabel}
            </Button>
          </Link>
        }
      />
    );
  }

  // ---- Finished summary -----------------------------------------------------
  if (finished) {
    const avg = answered ? Math.round((scoreSum / answered) * 100) : 0;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="mx-auto max-w-lg text-center">
          <CardContent className="p-8">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Trophy className="size-8" />
            </div>
            <h2 className="mt-4 text-2xl font-bold">Hoàn thành! 🎉</h2>
            <p className="mt-1 text-muted-foreground">
              {LEVEL_LABELS[level]} · {CATEGORY_LABELS[category]}
              {type ? ` · ${TYPE_LABELS[type]}` : ""}
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <SummaryStat label="Số câu" value={answered.toString()} />
              <SummaryStat label="Câu đúng" value={correctCount.toString()} />
              <SummaryStat label="Điểm TB" value={`${avg}%`} />
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button onClick={restart}>
                <RotateCcw /> Làm lại
              </Button>
              <Link href={backHref}>
                <Button variant="outline">{backLabel}</Button>
              </Link>
              <Link href="/">
                <Button variant="ghost">Về trang chủ</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ---- Active question ------------------------------------------------------
  const progressPct = ((index + (result ? 1 : 0)) / questions.length) * 100;
  const isLast = index + 1 >= questions.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" /> {backLabel}
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{LEVEL_LABELS[level]}</Badge>
            <Badge variant="outline" className="hidden sm:inline-flex">
              {CATEGORY_LABELS[category]}{" "}
              <span className="hanzi ml-1">{CATEGORY_HANZI[category]}</span>
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Progress value={progressPct} className="h-2 flex-1" />
          <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
            {index + 1}/{questions.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {TYPE_LABELS[current.type]}
            </span>
            <span className="hanzi text-xs text-muted-foreground">
              {TYPE_HANZI[current.type]}
            </span>
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
      </div>

      {/* Question body */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <QuestionRenderer
            key={current.id}
            question={current}
            onAnswerChange={setAnswer}
            result={result}
            showPinyin={showPinyin}
            showTranslation={showTranslation}
          />
        </CardContent>
      </Card>

      <FeedbackPanel result={result} />

      {/* Action bar */}
      <div className="sticky bottom-4 z-10">
        <div className="mx-auto flex max-w-2xl items-center justify-end gap-2 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur">
          {!result ? (
            <Button
              size="lg"
              onClick={handleCheck}
              disabled={answer === null || checking}
              className="min-w-40"
            >
              {checking ? <Loader2 className="animate-spin" /> : <Check />}
              Kiểm tra
            </Button>
          ) : (
            <Button
              size="lg"
              variant={result.isCorrect ? "success" : "default"}
              onClick={handleNext}
              className="min-w-40"
            >
              {isLast ? "Hoàn thành" : "Câu tiếp theo"} <ArrowRight />
            </Button>
          )}
        </div>
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

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 p-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SessionMessage({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center">
      {icon}
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}
