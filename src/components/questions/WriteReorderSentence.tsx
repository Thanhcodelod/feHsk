"use client";

// WRITE_REORDER_SENTENCE (连词成句) — assemble scrambled tokens into one sentence.
// Answer = the placed tokens concatenated with NO spaces (see ANSWER FORMAT REFERENCE).
// Review coloring derives only from `result` (isCorrect); the correct sentence is
// shown by the parent FeedbackPanel via result.correctAnswer.

import * as React from "react";
import type { QuestionComponentProps } from "@/lib/types";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";
import { Chip } from "@/components/practice/Chip";
import { Button } from "@/components/ui/button";
import { cn, shuffleClient } from "@/lib/utils";

export function WriteReorderSentence({
  question,
  onAnswerChange,
  result,
  showPinyin,
  showTranslation,
}: QuestionComponentProps) {
  const locked = result !== null;

  // Stable shuffled display order of the token bank (indices below refer to this).
  const [bank] = React.useState<string[]>(() =>
    shuffleClient(question.wordBank ?? [])
  );

  // Ordered list of bank indices the user has placed into the sentence.
  const [placed, setPlaced] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (bank.length > 0 && placed.length === bank.length) {
      onAnswerChange(placed.map((i) => bank[i]).join(""));
    } else {
      onAnswerChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed]);

  const isUsed = (bankIdx: number) => placed.includes(bankIdx);

  const appendToken = (bankIdx: number) => {
    if (locked || isUsed(bankIdx)) return;
    setPlaced((prev) => [...prev, bankIdx]);
  };

  const removeToken = (bankIdx: number) => {
    if (locked) return;
    setPlaced((prev) => prev.filter((i) => i !== bankIdx));
  };

  const resetAll = () => {
    if (locked) return;
    setPlaced([]);
  };

  const allPlaced = bank.length > 0 && placed.length === bank.length;

  return (
    <div className="space-y-6">
      <QuestionPrompt>{question.questionText}</QuestionPrompt>

      {showPinyin && question.pinyinGuide ? (
        <p className="text-sm text-primary/80">{question.pinyinGuide}</p>
      ) : null}

      {showTranslation && question.meta?.translation ? (
        <p className="text-sm italic text-muted-foreground">
          {question.meta.translation}
        </p>
      ) : null}

      {/* Sentence area — the assembled answer. */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Câu của bạn
          </p>
          {!locked && placed.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetAll}
              className="h-7 text-xs"
            >
              Làm lại
            </Button>
          ) : null}
        </div>

        <div
          className={cn(
            "hanzi flex min-h-[76px] flex-wrap items-center gap-2 rounded-xl border-2 border-dashed p-4 transition-colors",
            !locked && "border-primary/40 bg-secondary/30",
            locked &&
              result?.isCorrect &&
              "border-success bg-success/10",
            locked &&
              !result?.isCorrect &&
              "border-destructive bg-destructive/10"
          )}
        >
          {placed.length === 0 ? (
            <span className="text-base font-normal text-muted-foreground">
              Nhấn các từ bên dưới để ghép thành câu.
            </span>
          ) : (
            placed.map((bankIdx) => (
              <Chip
                key={bankIdx}
                state="placed"
                disabled={locked}
                onClick={() => removeToken(bankIdx)}
                title={locked ? undefined : "Nhấn để bỏ khỏi câu"}
              >
                {bank[bankIdx]}
              </Chip>
            ))
          )}
        </div>
      </div>

      {/* Token bank — remaining scrambled tokens. */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Ngân hàng từ — nhấn để thêm vào câu
        </p>
        <div className="flex flex-wrap gap-2">
          {bank.map((token, idx) => (
            <Chip
              key={idx}
              used={isUsed(idx)}
              disabled={locked}
              onClick={() => appendToken(idx)}
            >
              {token}
            </Chip>
          ))}
        </div>
      </div>

      {!locked ? (
        <p className="text-xs text-muted-foreground">
          {allPlaced
            ? "Đã ghép xong tất cả các từ."
            : `Còn ${bank.length - placed.length} từ chưa dùng.`}
        </p>
      ) : null}
    </div>
  );
}
