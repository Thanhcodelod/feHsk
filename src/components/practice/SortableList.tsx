"use client";

import * as React from "react";
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SortableListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  disabled?: boolean;
  /** Per-item state color after grading: index -> "correct" | "incorrect". */
  itemState?: (index: number) => "idle" | "correct" | "incorrect";
  className?: string;
}

/**
 * Vertical reorderable list. Supports HTML5 drag-and-drop AND up/down buttons
 * (so it works on touch / keyboard too). Used by "reorder into paragraph" and
 * anywhere a logical ordering must be built.
 */
export function SortableList<T>({
  items,
  getKey,
  onReorder,
  renderItem,
  disabled = false,
  itemState,
  className,
}: SortableListProps<T>) {
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [overIndex, setOverIndex] = React.useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  };

  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item, index) => {
        const st = itemState?.(index) ?? "idle";
        return (
          <li
            key={getKey(item)}
            draggable={!disabled}
            onDragStart={() => setDragIndex(index)}
            onDragEnter={() => setOverIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={() => {
              if (dragIndex !== null && overIndex !== null) {
                move(dragIndex, overIndex);
              }
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={cn(
              "flex items-center gap-2 rounded-lg border-2 bg-card p-3 transition-all",
              !disabled && "cursor-grab active:cursor-grabbing",
              st === "idle" && "border-border",
              st === "correct" && "border-success bg-success/10",
              st === "incorrect" && "border-destructive bg-destructive/10",
              overIndex === index &&
                dragIndex !== null &&
                "border-primary ring-2 ring-primary/40"
            )}
          >
            {!disabled ? (
              <GripVertical className="size-5 shrink-0 text-muted-foreground" />
            ) : null}
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
            {!disabled ? (
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  aria-label="Move up"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  className="rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  onClick={() => move(index, index + 1)}
                  disabled={index === items.length - 1}
                  className="rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="size-4" />
                </button>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
