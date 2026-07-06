"use client";

// LISTEN_TRUE_FALSE — nghe đoạn âm thanh rồi xác định câu khẳng định là
// Đúng hay Sai. Đáp án được mã hoá dưới dạng "true" | "false".
// Trạng thái ôn tập (khi `result` khác null) chỉ suy ra từ result.correctAnswer,
// không bao giờ đọc đáp án từ chính câu hỏi.

import * as React from "react";
import { Check, X } from "lucide-react";
import type { QuestionComponentProps } from "@/lib/types";
import { AudioButton } from "@/components/practice/AudioButton";
import { OptionCard, type OptionState } from "@/components/practice/OptionCard";
import { PinyinText } from "@/components/practice/PinyinText";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";
import { cn } from "@/lib/utils";

type TF = "true" | "false";

const CHOICES: { value: TF; label: string }[] = [
  { value: "true", label: "Đúng" },
  { value: "false", label: "Sai" },
];

export function ListenTrueFalse({
  question,
  onAnswerChange,
  result,
  showPinyin,
  showTranslation,
}: QuestionComponentProps) {
  const [selected, setSelected] = React.useState<TF | null>(null);
  const locked = result !== null;

  const pick = (value: TF) => {
    if (locked) return;
    setSelected(value);
    onAnswerChange(value);
  };

  const stateFor = (value: TF): OptionState => {
    if (!locked) return selected === value ? "selected" : "idle";
    if (value === result?.correctAnswer) return "correct";
    if (value === selected) return "incorrect";
    return "idle";
  };

  return (
    <div className="space-y-6">
      {/* Nghe đoạn âm thanh */}
      <div className="flex flex-col items-center gap-3">
        <AudioButton text={question.audioText ?? ""} label="Nghe" />
        {showTranslation && question.meta?.translation ? (
          <p className="max-w-prose text-center text-sm italic text-muted-foreground">
            {question.meta.translation}
          </p>
        ) : null}
      </div>

      {/* Câu khẳng định cần đánh giá */}
      <div className="rounded-xl border bg-card p-5 text-center">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Câu khẳng định — Đúng hay Sai?
        </p>
        <QuestionPrompt className="hanzi">
          {question.questionText}
        </QuestionPrompt>
      </div>

      {/* Hai lựa chọn Đúng / Sai */}
      <div className="grid grid-cols-2 gap-3">
        {CHOICES.map(({ value, label }) => {
          const isTrue = value === "true";
          return (
            <OptionCard
              key={value}
              emphasis
              state={stateFor(value)}
              disabled={locked}
              onClick={() => pick(value)}
            >
              <span className="flex flex-col items-center gap-2 py-1">
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-full",
                    isTrue
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  )}
                >
                  {isTrue ? (
                    <Check className="size-7" strokeWidth={3} />
                  ) : (
                    <X className="size-7" strokeWidth={3} />
                  )}
                </span>
                <span className="text-lg font-bold">{label}</span>
              </span>
            </OptionCard>
          );
        })}
      </div>

      {/* Ôn tập: lộ nội dung đoạn nghe sau khi đã trả lời */}
      {locked && question.audioText ? (
        <div className="rounded-xl border border-dashed bg-muted/30 p-4">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Nội dung đoạn nghe
          </p>
          <PinyinText
            text={question.audioText}
            pinyin={question.pinyinGuide}
            showPinyin={showPinyin}
            size="base"
          />
        </div>
      ) : null}
    </div>
  );
}
