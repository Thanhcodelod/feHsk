"use client";

// REFERENCE COMPONENT — canonical pattern for single-choice questions.
// Contract: QuestionComponentProps. Manages local selection, reports via
// onAnswerChange, and switches to read-only review once `result` is set,
// deriving correctness from `result.correctAnswer` (never from the question).

import * as React from "react";
import type { Option, QuestionComponentProps } from "@/lib/types";
import { AudioButton } from "@/components/practice/AudioButton";
import { OptionCard, type OptionState } from "@/components/practice/OptionCard";
import { PinyinText } from "@/components/practice/PinyinText";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";

export function ListenChoosePicture({
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
    if (opt.id === result?.correctAnswer) return "correct";
    if (opt.id === selected) return "incorrect";
    return "idle";
  };

  return (
    <div className="space-y-5">
      <QuestionPrompt>{question.questionText}</QuestionPrompt>

      <div className="flex flex-col items-center gap-2">
        <AudioButton text={question.audioText ?? ""} label="Nghe" />
        {showTranslation && question.meta?.translation ? (
          <p className="text-sm italic text-muted-foreground">
            {question.meta.translation}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {options.map((opt) => (
          <OptionCard
            key={opt.id}
            emphasis
            state={stateFor(opt)}
            disabled={locked}
            onClick={() => pick(opt.id)}
          >
            <span className="mb-1 block text-5xl">{opt.imageUrl}</span>
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
