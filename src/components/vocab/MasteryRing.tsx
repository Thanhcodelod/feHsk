"use client";

import * as React from "react";
import { MASTER_LEVEL, LEVELS } from "@/lib/smart-learn";
import { cn } from "@/lib/utils";

// Plant grows from seed → sprout → flower as the memory level climbs, matching
// the Lingoland "gieo hạt → tưới nước → nở hoa" metaphor.
const PLANT_BY_LEVEL = ["🌰", "🌱", "🌿", "🪴", "🌷", "🌸"];

export function levelName(level: number): string {
  return (LEVELS[Math.max(0, Math.min(level, MASTER_LEVEL))] ?? LEVELS[0]).name;
}

/**
 * Circular mastery indicator: a ring that fills green as the word climbs the 5
 * memory levels, with a plant emoji that grows inside. Level 0 shows a dashed
 * (not-yet-planted) ring.
 */
export function MasteryRing({
  level,
  size = 56,
  className,
}: {
  level: number;
  size?: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(level, MASTER_LEVEL));
  const stroke = Math.max(3, Math.round(size * 0.08));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = clamped / MASTER_LEVEL;
  const arc = c * frac;
  const emoji = PLANT_BY_LEVEL[clamped] ?? PLANT_BY_LEVEL[0];
  const mastered = clamped >= MASTER_LEVEL;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      title={`${levelName(clamped)} (${clamped}/${MASTER_LEVEL})`}
      aria-label={`Mức nhớ: ${levelName(clamped)}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-secondary"
          strokeDasharray={clamped === 0 ? "4 5" : undefined}
        />
        {/* progress */}
        {clamped > 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            className={cn(mastered ? "stroke-amber-400" : "stroke-success")}
            strokeDasharray={`${arc} ${c - arc}`}
          />
        ) : null}
      </svg>
      <span
        className="absolute leading-none"
        style={{ fontSize: size * 0.42 }}
      >
        {emoji}
      </span>
    </div>
  );
}
