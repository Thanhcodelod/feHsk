"use client";

// REFERENCE COMPONENT — canonical pattern for ordered-array answers built from
// a word bank (click OR drag-and-drop). Answer = JSON string[] (word per blank).
// Review coloring derives from `result.breakdown` (keyed by blank index).

import * as React from "react";
import type { QuestionComponentProps } from "@/lib/types";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";
import { Chip, BlankSlot } from "@/components/practice/Chip";

export function ReadFillBlank({
  question,
  onAnswerChange,
  result,
  showPinyin,
  showTranslation,
}: QuestionComponentProps) {
  const segments = React.useMemo(
    () => (question.passageText ?? "").split("___"),
    [question.passageText]
  );
  const blankCount = Math.max(0, segments.length - 1);
  const wordBank = question.wordBank ?? [];
  const locked = result !== null;

  // filledIdx[blank] = index into wordBank (or null).
  const [filledIdx, setFilledIdx] = React.useState<(number | null)[]>(() =>
    new Array(blankCount).fill(null)
  );

  React.useEffect(() => {
    const allFilled =
      blankCount > 0 && filledIdx.every((x) => x !== null);
    if (allFilled) {
      onAnswerChange(
        JSON.stringify(filledIdx.map((i) => wordBank[i as number]))
      );
    } else {
      onAnswerChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filledIdx]);

  const isUsed = (bankIdx: number) => filledIdx.includes(bankIdx);
  const nextEmpty = () => filledIdx.findIndex((x) => x === null);

  const placeWord = (bankIdx: number) => {
    if (locked || isUsed(bankIdx)) return;
    const slot = nextEmpty();
    if (slot === -1) return;
    setFilledIdx((prev) => {
      const next = [...prev];
      next[slot] = bankIdx;
      return next;
    });
  };

  const setBlank = (blank: number, bankIdx: number) => {
    if (locked || isUsed(bankIdx)) return;
    setFilledIdx((prev) => {
      const next = [...prev];
      next[blank] = bankIdx;
      return next;
    });
  };

  const clearBlank = (blank: number) => {
    if (locked) return;
    setFilledIdx((prev) => {
      const next = [...prev];
      next[blank] = null;
      return next;
    });
  };

  const blankState = (blank: number): "idle" | "correct" | "incorrect" => {
    if (!locked || !result?.breakdown) return "idle";
    return result.breakdown[String(blank)] ? "correct" : "incorrect";
  };

  return (
    <div className="space-y-6">
      <QuestionPrompt>{question.questionText}</QuestionPrompt>

      {showPinyin && question.pinyinGuide ? (
        <p className="text-sm text-primary/80">{question.pinyinGuide}</p>
      ) : null}

      {/* Passage with inline blanks */}
      <div className="hanzi rounded-xl border bg-secondary/30 p-5 text-xl leading-loose">
        {segments.map((seg, i) => (
          <React.Fragment key={i}>
            <span>{seg}</span>
            {i < blankCount ? (
              <BlankSlot
                filled={
                  filledIdx[i] !== null ? wordBank[filledIdx[i] as number] : null
                }
                state={blankState(i)}
                onClick={() => clearBlank(i)}
                onDrop={(e) => {
                  const bankIdx = Number(e.dataTransfer.getData("text/plain"));
                  if (!Number.isNaN(bankIdx)) setBlank(i, bankIdx);
                }}
              />
            ) : null}
          </React.Fragment>
        ))}
      </div>

      {showTranslation && question.meta?.translation ? (
        <p className="text-sm italic text-muted-foreground">
          {question.meta.translation}
        </p>
      ) : null}

      {/* Word bank */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Ngân hàng từ — nhấn hoặc kéo vào chỗ trống
        </p>
        <div className="flex flex-wrap gap-2">
          {wordBank.map((word, idx) => (
            <Chip
              key={`${word}-${idx}`}
              used={isUsed(idx)}
              disabled={locked}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("text/plain", String(idx))
              }
              onClick={() => placeWord(idx)}
            >
              {word}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
