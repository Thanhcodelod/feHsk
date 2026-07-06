"use client";

// LISTEN_CONVERSATION_QA — listen to a two-speaker dialogue, then answer a
// single follow-up multiple-choice question. Answer = chosen Option.id.
// Review coloring derives only from `result` (correctAnswer / isCorrect).

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import type { Option, QuestionComponentProps } from "@/lib/types";
import { AudioButton } from "@/components/practice/AudioButton";
import { OptionCard, type OptionState } from "@/components/practice/OptionCard";
import { PinyinText } from "@/components/practice/PinyinText";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MARKERS = ["A", "B", "C", "D"];

/** Split a script line like "A：你想喝点儿什么？" into speaker + content. */
function parseLine(line: string): { speaker: string | null; content: string } {
  const m = line.match(/^\s*([A-Za-z])\s*[:：]\s*([\s\S]*)$/);
  if (m) return { speaker: m[1], content: m[2] };
  return { speaker: null, content: line };
}

export function ListenConversationQA({
  question,
  onAnswerChange,
  result,
  showPinyin,
  showTranslation,
}: QuestionComponentProps) {
  const options = (question.options as Option[]) ?? [];
  const [selected, setSelected] = React.useState<string | null>(null);
  const [showScript, setShowScript] = React.useState(false);
  const locked = result !== null;

  const lines = React.useMemo(
    () =>
      (question.passageText ?? "")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0),
    [question.passageText]
  );

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

  // In review mode always reveal the script so the learner can check.
  const scriptVisible = showScript || locked;

  return (
    <div className="space-y-5">
      <QuestionPrompt>{question.questionText}</QuestionPrompt>

      <div className="flex flex-col items-center gap-3">
        <AudioButton
          text={question.audioText ?? ""}
          dialogue
          label="Nghe hội thoại"
        />
        {lines.length > 0 && !locked ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowScript((s) => !s)}
          >
            {showScript ? <EyeOff /> : <Eye />}
            {showScript ? "Ẩn lời thoại" : "Xem lời thoại"}
          </Button>
        ) : null}
      </div>

      {showTranslation && question.meta?.translation ? (
        <p className="text-center text-sm italic text-muted-foreground">
          {question.meta.translation}
        </p>
      ) : null}

      {scriptVisible && lines.length > 0 ? (
        <div className="rounded-xl border bg-secondary/30 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Lời thoại
          </p>
          <div className="space-y-2">
            {lines.map((line, i) => {
              const { speaker, content } = parseLine(line);
              return (
                <div key={i} className="flex items-start gap-2">
                  {speaker ? (
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {speaker}
                    </span>
                  ) : null}
                  <PinyinText text={content} showPinyin={showPinyin} size="base" />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
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

      {locked && result?.explanation ? (
        <div
          className={cn(
            "rounded-xl border p-4 text-sm",
            result.isCorrect
              ? "border-success/40 bg-success/5"
              : "border-destructive/40 bg-destructive/5"
          )}
        >
          <p className="mb-1 font-semibold text-foreground">
            {result.isCorrect ? "Chính xác!" : "Chưa đúng"}
          </p>
          <p className="text-muted-foreground">{result.explanation}</p>
        </div>
      ) : null}
    </div>
  );
}
