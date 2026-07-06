import * as React from "react";
import { toRuby } from "@/lib/pinyin";
import { cn } from "@/lib/utils";

export interface PinyinTextProps {
  /** Chinese text to render. */
  text: string;
  /** Optional space-separated pinyin aligned one syllable per Chinese char. */
  pinyin?: string | null;
  /** Optional English translation shown beneath when showTranslation. */
  translation?: string | null;
  showPinyin?: boolean;
  showTranslation?: boolean;
  className?: string;
  /** Visual size of the Chinese characters. */
  size?: "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
}

const SIZE: Record<NonNullable<PinyinTextProps["size"]>, string> = {
  sm: "text-base",
  base: "text-lg",
  lg: "text-2xl",
  xl: "text-3xl",
  "2xl": "text-4xl",
  "3xl": "text-5xl",
};

/**
 * Renders Chinese text with an optional ruby-style pinyin annotation above each
 * character, plus an optional translation line. This is the canonical component
 * for showing any hanzi in the app so the pinyin/translation toggles behave
 * consistently everywhere.
 */
export function PinyinText({
  text,
  pinyin,
  translation,
  showPinyin = false,
  showTranslation = false,
  className,
  size = "lg",
}: PinyinTextProps) {
  const pairs = React.useMemo(
    () => (showPinyin ? toRuby(text, pinyin) : null),
    [text, pinyin, showPinyin]
  );

  return (
    <span className={cn("inline-block hanzi leading-relaxed", className)}>
      <span className={cn("inline-flex flex-wrap items-end", SIZE[size])}>
        {pairs
          ? pairs.map((p, i) => (
              <ruby key={i} className="mx-[1px] leading-tight">
                {p.char}
                <rt className="text-[0.5em] font-normal text-primary/80">
                  {p.pinyin}
                </rt>
              </ruby>
            ))
          : text}
      </span>
      {showTranslation && translation ? (
        <span className="mt-1 block text-sm font-normal italic text-muted-foreground">
          {translation}
        </span>
      ) : null}
    </span>
  );
}
