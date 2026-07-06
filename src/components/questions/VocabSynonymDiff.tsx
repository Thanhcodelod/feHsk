"use client";

// VOCAB_SYNONYM_DIFF (近义词辨析) — teaches the difference between two near-
// synonyms via a side-by-side comparison, then asks the user to pick the right
// word for each blank. Answer = JSON string[] (chosen word per blank, in order).
// Review coloring derives from `result.breakdown` (keyed by blank index) and the
// per-blank correct word comes from `result.correctAnswer` (words joined " / ").

import * as React from "react";
import type { BlankSpec, QuestionComponentProps } from "@/lib/types";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** One synonym entry in the comparison panel (matches the seed data shape). */
interface ComparisonItem {
  word: string;
  pinyin: string;
  meaning: string;
  usage: string;
}

interface SynonymOptions {
  comparison: ComparisonItem[];
  blanks: BlankSpec[];
}

export function VocabSynonymDiff({
  question,
  onAnswerChange,
  result,
  showPinyin,
  showTranslation,
}: QuestionComponentProps) {
  const opts = (question.options as SynonymOptions | undefined) ?? {
    comparison: [],
    blanks: [],
  };
  const comparison = opts.comparison ?? [];
  const blanks = opts.blanks ?? [];
  const locked = result !== null;

  // selections[blank] = chosen word ("" when nothing picked yet).
  const [selections, setSelections] = React.useState<string[]>(() =>
    new Array(blanks.length).fill("")
  );

  React.useEffect(() => {
    const allChosen =
      blanks.length > 0 && selections.every((s) => s !== "");
    onAnswerChange(allChosen ? JSON.stringify(selections) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections]);

  const setSelection = (blank: number, word: string) => {
    if (locked) return;
    setSelections((prev) => {
      const next = [...prev];
      next[blank] = word;
      return next;
    });
  };

  const blankState = (blank: number): "idle" | "correct" | "incorrect" => {
    if (!locked || !result?.breakdown) return "idle";
    return result.breakdown[String(blank)] ? "correct" : "incorrect";
  };

  // result.correctAnswer = correct words joined by " / " — one per blank in order.
  const correctWords = React.useMemo(
    () => (result?.correctAnswer ? result.correctAnswer.split(" / ") : []),
    [result?.correctAnswer]
  );

  return (
    <div className="space-y-6">
      <QuestionPrompt>{question.questionText}</QuestionPrompt>

      {showTranslation && question.meta?.translation ? (
        <p className="text-sm italic text-muted-foreground">
          {question.meta.translation}
        </p>
      ) : null}

      {/* Comparison panel — the teaching aid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {comparison.map((item, i) => (
          <Card key={`${item.word}-${i}`} className="p-4">
            <div className="flex items-baseline gap-2">
              <span className="hanzi text-3xl font-semibold leading-none">
                {item.word}
              </span>
              <span className="text-sm text-primary/80">{item.pinyin}</span>
            </div>
            <p className="mt-3 text-sm">
              <span className="font-medium text-muted-foreground">Nghĩa: </span>
              {item.meaning}
            </p>
            <p className="mt-1 text-sm">
              <span className="font-medium text-muted-foreground">
                Cách dùng:{" "}
              </span>
              {item.usage}
            </p>
          </Card>
        ))}
      </div>

      {/* Blanks — pick the correct word for each sentence */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Chọn từ đúng cho mỗi câu
        </p>
        {blanks.map((blank, i) => {
          const st = blankState(i);
          return (
            <div
              key={blank.id}
              className="rounded-xl border bg-secondary/30 p-4"
            >
              <div className="hanzi flex flex-wrap items-center gap-x-1 gap-y-2 text-xl leading-loose">
                <span>{blank.before}</span>
                <span className="inline-block w-28 align-middle sm:w-32">
                  <Select
                    aria-label={`Chỗ trống ${i + 1}`}
                    placeholder="chọn"
                    value={selections[i]}
                    disabled={locked}
                    onChange={(e) => setSelection(i, e.target.value)}
                    className={cn(
                      "text-lg",
                      st === "correct" && "border-success ring-1 ring-success",
                      st === "incorrect" &&
                        "border-destructive ring-1 ring-destructive"
                    )}
                  >
                    {blank.choices.map((choice) => (
                      <option key={choice} value={choice}>
                        {choice}
                      </option>
                    ))}
                  </Select>
                </span>
                <span>{blank.after}</span>
              </div>

              {showPinyin && blank.pinyin ? (
                <p className="mt-2 text-sm text-primary/80">{blank.pinyin}</p>
              ) : null}

              {locked ? (
                <div className="mt-3">
                  {st === "correct" ? (
                    <Badge variant="success">Chính xác</Badge>
                  ) : (
                    <Badge variant="destructive">
                      Đáp án đúng: {correctWords[i] ?? "—"}
                    </Badge>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
