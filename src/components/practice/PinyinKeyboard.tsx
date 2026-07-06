"use client";

import * as React from "react";
import { Delete, CornerDownLeft, Languages } from "lucide-react";
import { apiGetPinyin } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PinyinKeyboardProps {
  /** Append committed Chinese text (a character/word or punctuation) to the draft. */
  onCommit: (text: string) => void;
  /** Delete the last character of the draft (when the pinyin buffer is empty). */
  onBackspace: () => void;
  className?: string;
}

const KEY_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

// Chinese punctuation the learner may need for full sentences.
const PUNCT = ["，", "。", "？", "！", "、", "：", "；"];

/**
 * A pinyin IME ("bàn phím ảo tiếng Trung"): the user types pinyin, gets Chinese
 * candidates from /api/pinyin, and picks one (click, or number keys 1-9) to
 * insert it into the answer. Works with a physical keyboard or the on-screen
 * keys, so Chinese can be typed without an OS-level IME.
 */
export function PinyinKeyboard({
  onCommit,
  onBackspace,
  className,
}: PinyinKeyboardProps) {
  const [buffer, setBuffer] = React.useState("");
  const [candidates, setCandidates] = React.useState<string[]>([]);
  const [lengths, setLengths] = React.useState<number[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Fetch candidates whenever the pinyin buffer changes (debounced, race-safe).
  React.useEffect(() => {
    const q = buffer.trim();
    if (!q) {
      setCandidates([]);
      setLengths([]);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      apiGetPinyin(q)
        .then((r) => {
          if (!active) return;
          setCandidates(r.candidates);
          setLengths(r.lengths);
        })
        .catch(() => {
          if (active) {
            setCandidates([]);
            setLengths([]);
          }
        });
    }, 140);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [buffer]);

  const focusInput = () => inputRef.current?.focus();

  const select = (i: number) => {
    const hanzi = candidates[i];
    if (!hanzi) return;
    onCommit(hanzi);
    const consumed = lengths[i] ?? buffer.length;
    setBuffer(buffer.slice(consumed)); // keep any un-consumed pinyin for the next syllable
    focusInput();
  };

  const appendLetter = (ch: string) => setBuffer((b) => b + ch);

  const handleBackspace = () => {
    if (buffer) setBuffer((b) => b.slice(0, -1));
    else onBackspace();
    focusInput();
  };

  const handleSpace = () => {
    if (candidates.length) select(0);
    else focusInput();
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key >= "1" && e.key <= "9" && candidates.length) {
      const i = Number(e.key) - 1;
      if (i < candidates.length) {
        e.preventDefault();
        select(i);
      }
      return;
    }
    if (e.key === " ") {
      e.preventDefault();
      handleSpace();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (candidates.length) select(0);
      return;
    }
    if (e.key === "Backspace" && buffer === "") {
      e.preventDefault();
      onBackspace();
    }
  };

  // On-screen keys must not steal focus from the composition input.
  const noBlur = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className={cn("rounded-xl border bg-card p-3", className)}>
      {/* Composition + candidate bar */}
      <div className="flex items-center gap-2">
        <Languages className="size-4 shrink-0 text-primary" />
        <input
          ref={inputRef}
          value={buffer}
          onChange={(e) =>
            setBuffer(e.target.value.toLowerCase().replace(/[^a-z]/g, ""))
          }
          onKeyDown={onInputKeyDown}
          placeholder="Gõ pinyin… (vd: nihao)"
          className="min-w-0 flex-1 rounded-md border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Nhập pinyin"
        />
      </div>

      <div className="mt-2 flex min-h-9 items-center gap-1.5 overflow-x-auto scroll-thin">
        {candidates.length ? (
          candidates.map((c, i) => (
            <button
              key={`${c}-${i}`}
              type="button"
              onMouseDown={noBlur}
              onClick={() => select(i)}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border bg-background px-2.5 py-1 hover:border-primary hover:bg-primary/5"
            >
              {i < 9 ? (
                <span className="text-[10px] text-muted-foreground">
                  {i + 1}
                </span>
              ) : null}
              <span className="hanzi text-lg leading-none">{c}</span>
            </button>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">
            {buffer
              ? "Không có gợi ý — kiểm tra lại pinyin"
              : "Gõ pinyin rồi chọn chữ Hán (phím 1–9 hoặc bấm chọn)."}
          </span>
        )}
      </div>

      {/* On-screen keyboard */}
      <div className="mt-2 space-y-1.5">
        {KEY_ROWS.map((row, r) => (
          <div key={r} className="flex justify-center gap-1">
            {row.map((k) => (
              <button
                key={k}
                type="button"
                onMouseDown={noBlur}
                onClick={() => appendLetter(k)}
                className="h-9 flex-1 rounded-md border bg-background text-sm font-medium hover:bg-secondary active:bg-primary/10 sm:min-w-8 sm:flex-none sm:px-3"
              >
                {k}
              </button>
            ))}
          </div>
        ))}
        <div className="flex justify-center gap-1">
          <button
            type="button"
            onMouseDown={noBlur}
            onClick={handleBackspace}
            className="inline-flex h-9 items-center justify-center gap-1 rounded-md border bg-background px-3 text-sm hover:bg-secondary"
            aria-label="Xóa"
          >
            <Delete className="size-4" />
          </button>
          <button
            type="button"
            onMouseDown={noBlur}
            onClick={handleSpace}
            className="h-9 flex-1 rounded-md border bg-background text-sm hover:bg-secondary"
          >
            {candidates.length ? "Chọn (dấu cách)" : "Dấu cách"}
          </button>
          <button
            type="button"
            onMouseDown={noBlur}
            onClick={() => {
              if (candidates.length) select(0);
            }}
            className="inline-flex h-9 items-center justify-center gap-1 rounded-md border bg-background px-3 text-sm hover:bg-secondary"
            aria-label="Xác nhận"
          >
            <CornerDownLeft className="size-4" />
          </button>
        </div>
        <div className="flex justify-center gap-1">
          {PUNCT.map((p) => (
            <button
              key={p}
              type="button"
              onMouseDown={noBlur}
              onClick={() => {
                onCommit(p);
                focusInput();
              }}
              className="hanzi h-8 min-w-8 rounded-md border bg-background text-sm hover:bg-secondary"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
