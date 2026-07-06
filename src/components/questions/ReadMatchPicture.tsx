"use client";

// READ_MATCH_PICTURE — connect each left word to its matching picture (emoji).
// Contract: QuestionComponentProps. Answer = JSON.stringify({ [leftId]: rightId })
// reported only when EVERY left item is matched (bijective, each right used once).
// Review coloring derives from `result` only: result.breakdown[leftId] (boolean per
// left row) and result.correctAnswer = JSON { leftId: correctRightId }.

import * as React from "react";
import { Check, X } from "lucide-react";
import type {
  MatchOptions,
  Option,
  QuestionComponentProps,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { PinyinText } from "@/components/practice/PinyinText";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";

// Distinct per-pair colors: a solid badge (shared by the connected left row and
// right card) plus a soft tint for the connected cards. Full literal class
// strings so Tailwind's scanner keeps them.
const PALETTE: { solid: string; soft: string }[] = [
  { solid: "bg-rose-500 text-white", soft: "border-rose-400 bg-rose-500/10" },
  { solid: "bg-sky-500 text-white", soft: "border-sky-400 bg-sky-500/10" },
  { solid: "bg-amber-500 text-white", soft: "border-amber-400 bg-amber-500/10" },
  { solid: "bg-violet-500 text-white", soft: "border-violet-400 bg-violet-500/10" },
  { solid: "bg-emerald-500 text-white", soft: "border-emerald-400 bg-emerald-500/10" },
  { solid: "bg-orange-500 text-white", soft: "border-orange-400 bg-orange-500/10" },
  { solid: "bg-teal-500 text-white", soft: "border-teal-400 bg-teal-500/10" },
  { solid: "bg-pink-500 text-white", soft: "border-pink-400 bg-pink-500/10" },
];

export function ReadMatchPicture({
  question,
  onAnswerChange,
  result,
  showPinyin,
  showTranslation,
}: QuestionComponentProps) {
  const opts = (question.options as MatchOptions) ?? { left: [], right: [] };
  const left = opts.left ?? [];
  const right = opts.right ?? [];
  const locked = result !== null;

  // pairs[leftId] = rightId
  const [pairs, setPairs] = React.useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = React.useState<string | null>(null);

  const leftIndexById = React.useMemo(() => {
    const m: Record<string, number> = {};
    left.forEach((l, i) => (m[l.id] = i));
    return m;
  }, [left]);

  const rightById = React.useMemo(() => {
    const m: Record<string, Option> = {};
    for (const r of right) m[r.id] = r;
    return m;
  }, [right]);

  const correctMap = React.useMemo<Record<string, string>>(() => {
    if (!result?.correctAnswer) return {};
    try {
      return JSON.parse(result.correctAnswer) as Record<string, string>;
    } catch {
      return {};
    }
  }, [result]);

  // Report the answer up whenever the pairing changes: a full bijective map when
  // every left is matched, otherwise null (not ready).
  React.useEffect(() => {
    if (left.length > 0 && left.every((l) => pairs[l.id])) {
      const ordered: Record<string, string> = {};
      for (const l of left) ordered[l.id] = pairs[l.id];
      onAnswerChange(JSON.stringify(ordered));
    } else {
      onAnswerChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairs]);

  const selectLeft = (leftId: string) => {
    if (locked) return;
    setSelectedLeft((cur) => (cur === leftId ? null : leftId));
  };

  const pickRight = (rightId: string) => {
    if (locked || !selectedLeft) return;
    const target = selectedLeft;
    setPairs((prev) => {
      const next = { ...prev };
      // Bijective: free this picture from whichever left currently holds it.
      for (const lid of Object.keys(next)) {
        if (next[lid] === rightId) delete next[lid];
      }
      next[target] = rightId;
      // Auto-advance to the next still-unmatched word for a smooth flow.
      const nextUnmatched = left.find((l) => l.id !== target && !next[l.id]);
      setSelectedLeft(nextUnmatched ? nextUnmatched.id : null);
      return next;
    });
  };

  const clearLeft = (leftId: string) => {
    if (locked) return;
    setPairs((prev) => {
      if (!(leftId in prev)) return prev;
      const next = { ...prev };
      delete next[leftId];
      return next;
    });
  };

  // Reverse lookup: which left owns each picture (for the right-card badges).
  const rightToLeft: Record<string, string> = {};
  for (const l of left) {
    const r = pairs[l.id];
    if (r) rightToLeft[r] = l.id;
  }

  const matchedCount = left.filter((l) => pairs[l.id]).length;

  return (
    <div className="space-y-5">
      <QuestionPrompt>{question.questionText}</QuestionPrompt>

      {showPinyin && question.pinyinGuide ? (
        <p className="text-sm text-primary/80">{question.pinyinGuide}</p>
      ) : null}

      {showTranslation && question.meta?.translation ? (
        <p className="text-sm italic text-muted-foreground">
          {question.meta.translation}
        </p>
      ) : null}

      {!locked ? (
        <p className="text-xs text-muted-foreground">
          Chọn một từ ở cột trái, rồi chọn hình tương ứng ở cột phải để nối.{" "}
          <span className="font-medium text-foreground">
            Đã nối {matchedCount}/{left.length}
          </span>
          {selectedLeft ? " — hãy chọn hình cho từ đang chọn." : "."}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* LEFT column — words */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Từ vựng
          </p>
          {left.map((l, idx) => {
            const pal = PALETTE[idx % PALETTE.length];
            const assignedRightId = pairs[l.id];
            const assigned = Boolean(assignedRightId);
            const isSelected = selectedLeft === l.id;
            const correct = result?.breakdown?.[l.id] === true;
            const chosen = assignedRightId ? rightById[assignedRightId] : undefined;
            const correctRight = locked
              ? rightById[correctMap[l.id]]
              : undefined;

            return (
              <div
                key={l.id}
                className={cn(
                  "rounded-xl border-2 p-2 transition-all",
                  locked
                    ? correct
                      ? "border-success bg-success/10"
                      : "border-destructive bg-destructive/10"
                    : isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : assigned
                        ? pal.soft
                        : "border-border bg-card"
                )}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={locked}
                    aria-pressed={isSelected}
                    onClick={() => selectLeft(l.id)}
                    className={cn(
                      "flex flex-1 items-center gap-3 rounded-lg p-1 text-left transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      !locked && "hover:bg-secondary/40",
                      locked && "cursor-default"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        assigned
                          ? pal.solid
                          : "border-2 border-dashed border-muted-foreground/40 text-muted-foreground"
                      )}
                    >
                      {idx + 1}
                    </span>
                    <PinyinText
                      text={l.text}
                      pinyin={l.pinyin}
                      showPinyin={showPinyin}
                      size="lg"
                    />
                  </button>

                  {locked ? (
                    <span className="flex items-center gap-1 px-1">
                      <span className="text-3xl leading-none">
                        {chosen?.imageUrl ?? "—"}
                      </span>
                      {correct ? (
                        <Check className="size-5 shrink-0 text-success" />
                      ) : (
                        <X className="size-5 shrink-0 text-destructive" />
                      )}
                    </span>
                  ) : assigned ? (
                    <button
                      type="button"
                      title="Bỏ nối"
                      onClick={() => clearLeft(l.id)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <span className="text-3xl leading-none">
                        {chosen?.imageUrl}
                      </span>
                      <X className="size-4" />
                    </button>
                  ) : (
                    <span className="px-2 text-xs text-muted-foreground">
                      Chưa nối
                    </span>
                  )}
                </div>

                {locked && !correct ? (
                  <div className="mt-1 flex items-center gap-2 pl-11 text-sm text-muted-foreground">
                    <span>Đáp án đúng:</span>
                    <span className="text-2xl leading-none">
                      {correctRight?.imageUrl}
                    </span>
                    <span>{correctRight?.text}</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* RIGHT column — pictures */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Hình ảnh
          </p>
          <div className="grid grid-cols-2 gap-2">
            {right.map((r) => {
              const ownerLeftId = rightToLeft[r.id];
              const ownerIdx =
                ownerLeftId !== undefined
                  ? leftIndexById[ownerLeftId]
                  : undefined;
              const pal =
                ownerIdx !== undefined
                  ? PALETTE[ownerIdx % PALETTE.length]
                  : null;

              return (
                <button
                  key={r.id}
                  type="button"
                  disabled={locked}
                  onClick={() => pickRight(r.id)}
                  className={cn(
                    "relative flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-xl border-2 p-3 text-center transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    pal ? pal.soft : "border-border bg-card",
                    !locked && "hover:border-primary/60 hover:bg-secondary/40",
                    !locked &&
                      selectedLeft &&
                      !pal &&
                      "border-primary/50 ring-1 ring-primary/30",
                    locked && "cursor-default"
                  )}
                >
                  {pal && ownerIdx !== undefined ? (
                    <span
                      className={cn(
                        "absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full text-xs font-bold",
                        pal.solid
                      )}
                    >
                      {ownerIdx + 1}
                    </span>
                  ) : null}
                  <span className="text-5xl leading-none">{r.imageUrl}</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {r.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
