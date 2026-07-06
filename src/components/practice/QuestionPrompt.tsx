import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The instruction / prompt line shown at the top of a question. Each question
 * component renders this with `question.questionText` so prompt placement stays
 * consistent across all 19 types.
 */
export function QuestionPrompt({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-lg font-semibold leading-snug text-foreground sm:text-xl",
        className
      )}
    >
      {children}
    </h2>
  );
}
