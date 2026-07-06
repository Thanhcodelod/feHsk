"use client";

// VOCAB_WRITE_PINYIN_HANZI (拼音汉字听写) — dictation: the user hears a word
// (audioText) and types it back as hanzi OR pinyin. The answer (meta.hanzi /
// meta.pinyin) must NOT be shown before submit. Answer encoding = the typed
// string; report it while non-empty, else null. Review state derives only from
// `result` (never from the question, which has answer fields stripped).

import * as React from "react";
import type { QuestionComponentProps } from "@/lib/types";
import { AudioButton } from "@/components/practice/AudioButton";
import { PinyinText } from "@/components/practice/PinyinText";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function VocabWritePinyinHanzi({
  question,
  onAnswerChange,
  result,
  showPinyin,
  showTranslation,
}: QuestionComponentProps) {
  const [text, setText] = React.useState("");
  const locked = result !== null;

  const hanzi = question.meta?.hanzi ?? "";
  const pinyin = question.meta?.pinyin ?? null;
  const translation = question.meta?.translation ?? null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (locked) return;
    const value = e.target.value;
    setText(value);
    onAnswerChange(value.trim().length > 0 ? value : null);
  };

  return (
    <div className="space-y-6">
      <QuestionPrompt>{question.questionText}</QuestionPrompt>

      {/* Audio prompt — the word is only ever heard, never shown before submit */}
      <div className="flex flex-col items-center gap-3">
        <AudioButton text={question.audioText ?? ""} label="Nghe từ" />
        {showTranslation && translation ? (
          <p className="text-sm italic text-muted-foreground">
            Gợi ý nghĩa: {translation}
          </p>
        ) : null}
      </div>

      {/* Answer input */}
      <div className="space-y-2">
        <label
          htmlFor="vocab-write-answer"
          className="block text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          Đáp án của bạn
        </label>
        <Input
          id="vocab-write-answer"
          value={text}
          onChange={handleChange}
          disabled={locked}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="Gõ chữ Hán hoặc pinyin…"
          className={cn(
            "hanzi h-12 text-center text-xl",
            locked &&
              result?.isCorrect &&
              "border-success text-success focus-visible:ring-success",
            locked &&
              !result?.isCorrect &&
              "border-destructive text-destructive focus-visible:ring-destructive"
          )}
        />
        <p className="text-xs text-muted-foreground">
          Gõ chữ Hán hoặc pinyin (có dấu hoặc không, ví dụ: laoshi)
        </p>
      </div>

      {/* Review — reveal the canonical hanzi with pinyin once graded */}
      {locked && hanzi ? (
        <div className="space-y-2 rounded-xl border bg-secondary/30 p-5 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Đáp án đúng
          </p>
          <div className="flex justify-center">
            <PinyinText
              text={hanzi}
              pinyin={pinyin}
              translation={translation}
              showPinyin={showPinyin}
              showTranslation={showTranslation}
              size="2xl"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
