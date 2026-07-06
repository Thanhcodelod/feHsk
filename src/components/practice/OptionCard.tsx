"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type OptionState = "idle" | "selected" | "correct" | "incorrect";

export interface OptionCardProps {
  onClick?: () => void;
  state?: OptionState;
  disabled?: boolean;
  /** Larger padding + centered layout for picture/emoji options. */
  emphasis?: boolean;
  className?: string;
  children: React.ReactNode;
  /** Optional leading label like "A"/"B"/"1". */
  marker?: string;
}

/**
 * The canonical selectable card used across MCQ, true/false, picture-choice and
 * error-detection questions. `state` drives the review coloring after grading:
 *   idle | selected | correct | incorrect
 */
export function OptionCard({
  onClick,
  state = "idle",
  disabled = false,
  emphasis = false,
  className,
  children,
  marker,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={state === "selected"}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-xl border-2 text-left transition-all",
        emphasis ? "flex-col justify-center p-5 text-center" : "p-4",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !disabled && "hover:border-primary/60 hover:bg-secondary/60",
        state === "idle" && "border-border bg-card",
        state === "selected" && "border-primary bg-primary/5 ring-1 ring-primary",
        state === "correct" && "border-success bg-success/10",
        state === "incorrect" && "border-destructive bg-destructive/10",
        disabled && "cursor-default",
        className
      )}
    >
      {marker ? (
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
            state === "correct"
              ? "bg-success text-success-foreground"
              : state === "incorrect"
                ? "bg-destructive text-destructive-foreground"
                : state === "selected"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
          )}
        >
          {marker}
        </span>
      ) : null}
      <span className="flex-1">{children}</span>
      {state === "correct" ? (
        <Check className="size-5 shrink-0 text-success" />
      ) : state === "incorrect" ? (
        <X className="size-5 shrink-0 text-destructive" />
      ) : null}
    </button>
  );
}
