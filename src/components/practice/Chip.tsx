"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChipProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  used?: boolean;
  state?: "idle" | "correct" | "incorrect" | "placed";
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  className?: string;
  title?: string;
}

/**
 * A word-bank token. Click to place/remove, or drag onto a blank. Reused by
 * fill-in-the-blank and "reorder words into a sentence" (连词成句).
 */
export function Chip({
  children,
  onClick,
  disabled,
  used,
  state = "idle",
  draggable,
  onDragStart,
  className,
  title,
}: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || used}
      draggable={draggable && !used && !disabled}
      onDragStart={onDragStart}
      title={title}
      className={cn(
        "hanzi inline-flex select-none items-center rounded-lg border-2 px-3.5 py-2 text-xl font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        state === "idle" &&
          !used &&
          "border-border bg-card hover:border-primary/60 hover:bg-secondary active:scale-95",
        state === "placed" && "border-primary bg-primary/10 text-primary",
        state === "correct" && "border-success bg-success/10 text-success",
        state === "incorrect" && "border-destructive bg-destructive/10 text-destructive",
        used && "cursor-default border-dashed border-border bg-secondary/50 text-muted-foreground opacity-50",
        draggable && !used && "cursor-grab active:cursor-grabbing",
        className
      )}
    >
      {children}
    </button>
  );
}

/** A drop target blank for fill-in / sentence assembly. */
export interface BlankSlotProps {
  filled?: string | null;
  onClick?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  state?: "idle" | "correct" | "incorrect";
  placeholder?: string;
  className?: string;
}

export function BlankSlot({
  filled,
  onClick,
  onDrop,
  state = "idle",
  placeholder = "____",
  className,
}: BlankSlotProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={cn(
        "hanzi mx-1 inline-flex min-w-[68px] items-center justify-center rounded-md border-b-2 px-2 py-0.5 align-middle text-xl font-medium transition-colors",
        !filled && "border-dashed border-primary/50 text-muted-foreground",
        filled && state === "idle" && "border-primary bg-primary/10 text-primary",
        state === "correct" && "border-success bg-success/10 text-success",
        state === "incorrect" && "border-destructive bg-destructive/10 text-destructive",
        className
      )}
    >
      {filled ?? placeholder}
    </button>
  );
}
