"use client";

// WRITE_ESSAY (写短文) — free-text essay against a bilingual prompt.
// Answer = the essay text itself (heuristic grade on length + keyword coverage).
// Report onAnswerChange(text) once the essay is non-empty, otherwise null.
// Review state (feedback + model essay) comes from `result`; the question
// payload carries no correct answer.

import * as React from "react";
import type { QuestionComponentProps } from "@/lib/types";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";
import { PinyinText } from "@/components/practice/PinyinText";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { cn, countHanzi, clamp } from "@/lib/utils";

export function WriteEssay({
  question,
  onAnswerChange,
  result,
  showPinyin,
  showTranslation,
}: QuestionComponentProps) {
  const locked = result !== null;
  const keywords = question.meta?.keywords ?? [];
  const minWords = question.meta?.minWords ?? 0;
  const maxWords = question.meta?.maxWords ?? 0;

  const [text, setText] = React.useState("");

  React.useEffect(() => {
    if (locked) return;
    onAnswerChange(text.trim().length > 0 ? text : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const count = countHanzi(text);
  const reachedMin = minWords > 0 && count >= minWords;
  const overMax = maxWords > 0 && count > maxWords;
  const progressValue =
    minWords > 0
      ? clamp((count / minWords) * 100, 0, 100)
      : count > 0
        ? 100
        : 0;

  const hasKeyword = (kw: string) => text.includes(kw);

  return (
    <div className="space-y-5">
      <QuestionPrompt>{question.questionText}</QuestionPrompt>

      {showPinyin && question.pinyinGuide ? (
        <p className="text-sm text-primary/80">{question.pinyinGuide}</p>
      ) : null}

      {showTranslation && question.meta?.translation ? (
        <p className="text-sm italic text-muted-foreground">
          {question.meta.translation}
        </p>
      ) : null}

      {/* Required keywords — green once present in the essay */}
      {keywords.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Từ khoá bắt buộc
          </p>
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => {
              const present = hasKeyword(kw);
              return (
                <Badge
                  key={kw}
                  variant={present ? "success" : "outline"}
                  className="gap-1 text-sm"
                >
                  <span aria-hidden>{present ? "✓" : "○"}</span>
                  <span className="hanzi">{kw}</span>
                </Badge>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Essay input */}
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={locked}
        placeholder="Viết bài của bạn ở đây…"
        className="min-h-[220px] hanzi text-xl leading-loose"
        aria-label="Bài viết"
      />

      {/* Live counter + progress toward the minimum length */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span
            className={cn(
              "font-medium tabular-nums",
              overMax
                ? "text-destructive"
                : reachedMin
                  ? "text-success"
                  : "text-muted-foreground"
            )}
          >
            {count}
            {minWords > 0 ? ` / ${minWords}` : ""} chữ
          </span>
          {maxWords > 0 ? (
            <span
              className={cn(
                "tabular-nums",
                overMax ? "font-medium text-destructive" : "text-muted-foreground"
              )}
            >
              {overMax ? "Vượt quá tối đa " : "Tối đa "}
              {maxWords} chữ
            </span>
          ) : null}
        </div>
        <Progress
          value={progressValue}
          indicatorClassName={cn(
            overMax
              ? "bg-destructive"
              : reachedMin
                ? "bg-success"
                : "bg-primary"
          )}
        />
      </div>

      {/* Model essay (revealed after grading) */}
      {locked && result?.correctAnswer ? (
        <Card className="border-success/40 bg-success/5 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-success">
            Bài mẫu
          </p>
          <PinyinText
            text={result.correctAnswer}
            showPinyin={showPinyin}
            size="base"
            className="leading-loose"
          />
        </Card>
      ) : null}
    </div>
  );
}
