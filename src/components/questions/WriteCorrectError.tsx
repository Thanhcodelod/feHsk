"use client";

// WRITE_CORRECT_ERROR (改错句) — the user rewrites an incorrect Chinese sentence.
// Contract: QuestionComponentProps. questionText holds the WRONG sentence (shown
// prominently with a red "câu sai" label), passageText holds the instruction.
// Answer = the corrected sentence typed by the user (free text). We report the
// text via onAnswerChange when non-empty, else null. Review coloring derives
// only from `result` (the parent FeedbackPanel shows the correct sentence).

import * as React from "react";
import type { QuestionComponentProps } from "@/lib/types";
import { PinyinText } from "@/components/practice/PinyinText";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function WriteCorrectError({
  question,
  onAnswerChange,
  result,
  showPinyin,
  showTranslation,
}: QuestionComponentProps) {
  const [text, setText] = React.useState("");
  const locked = result !== null;

  const handleChange = (value: string) => {
    if (locked) return;
    setText(value);
    onAnswerChange(value.trim().length > 0 ? value : null);
  };

  return (
    <div className="space-y-5">
      <QuestionPrompt>Câu dưới đây có lỗi. Hãy viết lại cho đúng:</QuestionPrompt>

      {question.passageText ? (
        <p className="text-sm text-muted-foreground">{question.passageText}</p>
      ) : null}

      {/* The incorrect sentence */}
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
        <Badge variant="destructive" className="mb-3">
          Câu sai
        </Badge>
        <PinyinText
          text={question.questionText}
          pinyin={question.pinyinGuide}
          showPinyin={showPinyin}
          size="xl"
          className="text-destructive"
        />
        {showTranslation && question.meta?.translation ? (
          <p className="mt-2 text-sm italic text-muted-foreground">
            {question.meta.translation}
          </p>
        ) : null}
      </div>

      {/* The user's corrected sentence */}
      <div className="space-y-2">
        <label
          htmlFor="corrected-sentence"
          className="block text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          Câu đã sửa của bạn
        </label>
        <Textarea
          id="corrected-sentence"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          disabled={locked}
          placeholder="Nhập câu đúng bằng tiếng Trung…"
          className={cn(
            "hanzi text-xl leading-relaxed",
            locked && result?.isCorrect && "border-success focus-visible:ring-success",
            locked && !result?.isCorrect && "border-destructive focus-visible:ring-destructive"
          )}
        />
      </div>
    </div>
  );
}
