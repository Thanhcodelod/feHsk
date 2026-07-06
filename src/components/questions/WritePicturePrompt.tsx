"use client";

// WRITE_PICTURE_PROMPT (看图写句子) — free-text sentence answer.
// Contract: QuestionComponentProps. The user writes one sentence describing the
// emoji picture, using the required grammar keyword(s). Answer = the raw text
// (reported when non-empty, else null). Review coloring derives only from
// `result`; the parent FeedbackPanel shows the feedback + model answer.

import * as React from "react";
import type { QuestionComponentProps } from "@/lib/types";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";
import { PinyinText } from "@/components/practice/PinyinText";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn, countHanzi } from "@/lib/utils";

export function WritePicturePrompt({
  question,
  onAnswerChange,
  result,
  showPinyin,
  showTranslation,
}: QuestionComponentProps) {
  const locked = result !== null;
  const keywords = question.meta?.keywords ?? [];
  const [text, setText] = React.useState("");

  const handleChange = (value: string) => {
    if (locked) return;
    setText(value);
    onAnswerChange(value.length > 0 ? value : null);
  };

  const hanziCount = countHanzi(text);

  return (
    <div className="space-y-5">
      <QuestionPrompt>{question.questionText}</QuestionPrompt>

      {/* Emoji picture — rendered very large and centered */}
      {question.imageUrl ? (
        <div className="flex justify-center">
          <div
            role="img"
            aria-label="Hình minh hoạ"
            className="flex h-44 w-44 select-none items-center justify-center rounded-2xl border bg-secondary/30 text-8xl leading-none"
          >
            {question.imageUrl}
          </div>
        </div>
      ) : null}

      {showTranslation && question.meta?.translation ? (
        <p className="text-center text-sm italic text-muted-foreground">
          {question.meta.translation}
        </p>
      ) : null}

      {/* Required grammar keyword(s) — turn success-green once used in the text */}
      {keywords.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Từ khoá bắt buộc:
          </span>
          {keywords.map((kw) => {
            const used = text.includes(kw);
            return (
              <Badge
                key={kw}
                variant={used ? "success" : "outline"}
                className="gap-1 text-sm"
              >
                {used ? <span aria-hidden="true">✓</span> : null}
                <PinyinText text={kw} showPinyin={showPinyin} size="sm" />
              </Badge>
            );
          })}
        </div>
      ) : null}

      {/* Answer sentence */}
      <div className="space-y-1.5">
        <Textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          disabled={locked}
          placeholder="Viết câu của bạn tại đây…"
          className={cn(
            "hanzi min-h-[140px] text-lg leading-loose",
            locked && result?.isCorrect && "border-success focus-visible:ring-success",
            locked && result && !result.isCorrect && "border-destructive focus-visible:ring-destructive"
          )}
        />
        <div className="flex justify-end">
          <span className="text-xs text-muted-foreground">{hanziCount} chữ Hán</span>
        </div>
      </div>
    </div>
  );
}
