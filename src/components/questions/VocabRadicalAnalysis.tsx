"use client";

// VOCAB_RADICAL_ANALYSIS (部首拆解) — single-choice MCQ over a character's
// radical/component breakdown. Answer = chosen Option.id.
// Shows the big character + a decomposition strip of meta.parts (char — meaning),
// hiding each part's `role` until locked (role reveals which piece is the radical).
// Review coloring derives from `result.correctAnswer` (never from the question).

import * as React from "react";
import type {
  Option,
  QuestionComponentProps,
  RadicalPart,
} from "@/lib/types";
import { OptionCard, type OptionState } from "@/components/practice/OptionCard";
import { PinyinText } from "@/components/practice/PinyinText";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";
import { Badge } from "@/components/ui/badge";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function VocabRadicalAnalysis({
  question,
  onAnswerChange,
  result,
  showPinyin,
  showTranslation,
}: QuestionComponentProps) {
  const options = (question.options as Option[]) ?? [];
  const parts = (question.meta?.parts as RadicalPart[] | undefined) ?? [];
  const char = (question.meta?.char as string | undefined) ?? "";
  const pinyin = (question.meta?.pinyin as string | undefined) ?? null;
  const translation = question.meta?.translation ?? null;

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

  // After locked we always reveal pinyin + translation, regardless of toggles.
  const revealPinyin = showPinyin || locked;
  const revealTranslation = showTranslation || locked;

  const isRadicalRole = (role?: string) =>
    !!role && role.toLowerCase().includes("bộ thủ");

  return (
    <div className="space-y-6">
      <QuestionPrompt>{question.questionText}</QuestionPrompt>

      {/* Big character with pinyin + meaning */}
      <div className="flex flex-col items-center gap-1 rounded-2xl border bg-secondary/30 p-6">
        {char ? (
          <span className="hanzi text-7xl font-semibold leading-none">
            {char}
          </span>
        ) : null}
        {revealPinyin && pinyin ? (
          <span className="mt-2 text-lg text-primary/80">{pinyin}</span>
        ) : null}
        {revealTranslation && translation ? (
          <span className="text-sm italic text-muted-foreground">
            {translation}
          </span>
        ) : null}
      </div>

      {/* Decomposition strip — role hidden until locked */}
      {parts.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Cấu tạo chữ
          </p>
          <div className="flex flex-wrap items-stretch justify-center gap-2">
            {parts.map((part, i) => {
              const radical = locked && isRadicalRole(part.role);
              return (
                <React.Fragment key={`${part.char}-${i}`}>
                  {i > 0 ? (
                    <span className="self-center text-2xl font-light text-muted-foreground">
                      +
                    </span>
                  ) : null}
                  <div className="flex min-w-[96px] flex-col items-center rounded-xl border-2 border-border bg-card px-4 py-3 text-center">
                    <PinyinText
                      text={part.char}
                      showPinyin={false}
                      size="lg"
                    />
                    <span className="mt-1 text-sm text-muted-foreground">
                      {part.meaning}
                    </span>
                    {locked && part.role ? (
                      <Badge
                        variant={radical ? "accent" : "secondary"}
                        className="mt-2"
                      >
                        {part.role}
                      </Badge>
                    ) : null}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Radical choices */}
      <div className="space-y-2">
        {options.map((opt, i) => (
          <OptionCard
            key={opt.id}
            state={stateFor(opt)}
            disabled={locked}
            marker={LETTERS[i] ?? String(i + 1)}
            onClick={() => pick(opt.id)}
          >
            <span className="hanzi text-2xl font-medium">{opt.text}</span>
            {revealPinyin && opt.pinyin ? (
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {opt.pinyin}
              </span>
            ) : null}
          </OptionCard>
        ))}
      </div>
    </div>
  );
}
