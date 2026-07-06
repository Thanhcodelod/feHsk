"use client";

// READ_ERROR_DETECTION (找病句) — pick the sentence that contains the error.
// Contract: QuestionComponentProps. Manages local selection, reports the chosen
// Option.id via onAnswerChange, and switches to read-only review once `result`
// is set. In review, result.correctAnswer is the id of the WRONG sentence, so
// that card is state="correct" (it is the right choice) and the user's pick, if
// different, is state="incorrect". Review coloring derives only from `result`.

import * as React from "react";
import type { Option, QuestionComponentProps } from "@/lib/types";
import { OptionCard, type OptionState } from "@/components/practice/OptionCard";
import { PinyinText } from "@/components/practice/PinyinText";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";

const MARKERS = ["A", "B", "C", "D", "E", "F"];

export function ReadErrorDetection({
  question,
  onAnswerChange,
  result,
  showPinyin,
  showTranslation,
}: QuestionComponentProps) {
  const options = (question.options as Option[]) ?? [];
  const [selected, setSelected] = React.useState<string | null>(null);
  const locked = result !== null;

  const pick = (id: string) => {
    if (locked) return;
    setSelected(id);
    onAnswerChange(id);
  };

  const stateFor = (opt: Option): OptionState => {
    if (!locked) return selected === opt.id ? "selected" : "idle";
    // In review: the correct answer is the id of the sentence that has the error.
    if (opt.id === result?.correctAnswer) return "correct";
    if (opt.id === selected) return "incorrect";
    return "idle";
  };

  return (
    <div className="space-y-5">
      <QuestionPrompt>{question.questionText}</QuestionPrompt>

      {showTranslation && question.meta?.translation ? (
        <p className="text-sm italic text-muted-foreground">
          {question.meta.translation}
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Chọn câu có lỗi ngữ pháp.
      </p>

      <div className="flex flex-col gap-3">
        {options.map((opt, i) => (
          <OptionCard
            key={opt.id}
            marker={MARKERS[i] ?? String(i + 1)}
            state={stateFor(opt)}
            disabled={locked}
            onClick={() => pick(opt.id)}
          >
            <PinyinText
              text={opt.text}
              pinyin={opt.pinyin}
              showPinyin={showPinyin}
              size="base"
            />
          </OptionCard>
        ))}
      </div>
    </div>
  );
}
