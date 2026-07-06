"use client";

import * as React from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSeconds } from "@/lib/utils";

export interface CountdownTimerProps {
  seconds: number;
  running: boolean;
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
  label?: string;
  className?: string;
}

/** A simple mm:ss countdown that fires onComplete at zero. */
export function CountdownTimer({
  seconds,
  running,
  onComplete,
  onTick,
  label,
  className,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = React.useState(seconds);
  const completeRef = React.useRef(onComplete);
  const tickRef = React.useRef(onTick);
  completeRef.current = onComplete;
  tickRef.current = onTick;

  // Reset when the target changes or when (re)started.
  React.useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  React.useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      completeRef.current?.();
      return;
    }
    const id = setTimeout(() => {
      setRemaining((r) => {
        const next = r - 1;
        tickRef.current?.(next);
        if (next <= 0) completeRef.current?.();
        return next;
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [running, remaining]);

  const pct = seconds > 0 ? remaining / seconds : 0;
  const danger = remaining <= 5 && running;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-lg tabular-nums",
        danger
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border bg-secondary text-foreground",
        className
      )}
    >
      <Timer className={cn("size-4", danger && "animate-pulse")} />
      {label ? <span className="font-sans text-sm">{label}</span> : null}
      <span>{formatSeconds(Math.max(0, remaining))}</span>
      <span className="sr-only">{Math.round(pct * 100)}% remaining</span>
    </div>
  );
}
