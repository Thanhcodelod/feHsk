import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner (shadcn convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Fisher–Yates shuffle that returns a new array (does not mutate input). */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    // Deterministic-enough shuffle seeded by index+content length; avoids
    // Math.random so it is stable across SSR/CSR hydration for a given input.
    const seed = (i * 2654435761 + a.length * 40503) % (i + 1);
    const j = Math.abs(seed) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Client-side shuffle for interactive display (true randomness, browser only). */
export function shuffleClient<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Count CJK characters (ignores spaces/punctuation) — used for essay counters. */
export function countHanzi(text: string): number {
  const matches = text.match(/[一-鿿]/g);
  return matches ? matches.length : 0;
}

export function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

let idCounter = 0;
/** Stable-ish unique id for client interactions (not for persistence). */
export function localId(prefix = "id"): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}
