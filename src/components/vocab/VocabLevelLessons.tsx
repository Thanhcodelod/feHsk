"use client";

import * as React from "react";
import Link from "next/link";
import {
  Loader2,
  ChevronRight,
  GraduationCap,
  Type as TypeIcon,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Home,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiGetVocab, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { loadSrs, isMastered, type SrsMap } from "@/lib/vocab-srs";
import { chunkLessons } from "@/lib/lessons";
import { VOCAB_SOURCE_META, CARD_TONES } from "@/lib/labels";
import type { VocabWord } from "@/lib/types";
import { cn } from "@/lib/utils";

type Status = "done" | "doing" | "todo";
interface LessonInfo {
  num: number;
  words: VocabWord[];
  mastered: number;
  status: Status;
  pct: number;
}

function toneFor(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i)) % CARD_TONES.length;
  return CARD_TONES[h];
}

export function VocabLevelLessons({
  source,
  group,
  basePath,
}: {
  source: string;
  group: string;
  basePath: string;
}) {
  const { user } = useAuth();
  const [words, setWords] = React.useState<VocabWord[] | null>(null);
  const [srs, setSrs] = React.useState<SrsMap>({});
  const [error, setError] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | Status>("all");

  React.useEffect(() => {
    let active = true;
    Promise.all([apiGetVocab({ source, group }), loadSrs(!!user).catch(() => ({}))])
      .then(([w, map]) => {
        if (!active) return;
        setWords(w);
        setSrs(map as SrsMap);
      })
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Không tải được từ vựng.")
      );
    return () => {
      active = false;
    };
  }, [source, group, user]);

  const meta =
    VOCAB_SOURCE_META[source] ?? { label: source, description: "", emoji: "📖" };

  const lessons: LessonInfo[] = React.useMemo(() => {
    if (!words) return [];
    return chunkLessons(words).map((l) => {
      const mastered = l.words.filter((w) => isMastered(srs[w.id])).length;
      const touched = l.words.filter((w) => srs[w.id]).length;
      const status: Status =
        mastered === l.words.length ? "done" : touched > 0 ? "doing" : "todo";
      return {
        num: l.num,
        words: l.words,
        mastered,
        status,
        pct: Math.round((mastered / l.words.length) * 100),
      };
    });
  }, [words, srs]);

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }
  if (!words) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" /> Đang tải bài học…
      </div>
    );
  }

  const doneCount = lessons.filter((l) => l.status === "done").length;
  const doingCount = lessons.filter((l) => l.status === "doing").length;
  const todoCount = lessons.filter((l) => l.status === "todo").length;
  const shown = lessons.filter((l) => filter === "all" || l.status === filter);

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground">
          <Home className="size-3.5" /> Trang chủ
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={basePath} className="hover:text-foreground">
          {meta.label}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">{group}</span>
      </nav>

      {/* Hero card */}
      <div
        className={cn(
          "flex flex-col gap-4 rounded-2xl bg-gradient-to-br p-5 text-white sm:flex-row sm:items-center sm:justify-between",
          toneFor(group)
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-white/15">
            <GraduationCap className="size-8" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/80">
              {meta.label}
            </p>
            <h1 className="text-2xl font-bold">{group}</h1>
            <p className="text-sm text-white/85">
              Học từng bài để chinh phục toàn bộ từ vựng
            </p>
          </div>
        </div>
        <div className="flex gap-4 rounded-xl bg-white/10 px-4 py-3 text-center">
          <Stat label="BÀI HỌC" value={lessons.length} />
          <Stat label="TỪ VỰNG" value={words.length} />
          <Stat label="ĐÃ XONG" value={doneCount} />
        </div>
      </div>

      {/* Lesson list */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Danh sách bài học</h2>
        <Badge variant="secondary">{lessons.length} bài</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Tab active={filter === "all"} onClick={() => setFilter("all")}>
          Tất cả {lessons.length}
        </Tab>
        <Tab active={filter === "done"} onClick={() => setFilter("done")}>
          Đã xong {doneCount}
        </Tab>
        <Tab active={filter === "doing"} onClick={() => setFilter("doing")}>
          Đang làm {doingCount}
        </Tab>
        <Tab active={filter === "todo"} onClick={() => setFilter("todo")}>
          Chưa làm {todoCount}
        </Tab>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((l) => (
          <Link
            key={l.num}
            href={`${basePath}/${encodeURIComponent(group)}/${l.num}`}
            className={cn(
              "group rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm",
              l.status === "done" && "border-success/50 bg-success/5"
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-full text-lg font-bold",
                  l.status === "done"
                    ? "bg-success text-success-foreground"
                    : l.status === "doing"
                      ? "bg-primary/15 text-primary ring-2 ring-primary"
                      : "bg-secondary text-muted-foreground"
                )}
              >
                {l.status === "done" ? <CheckCircle2 className="size-5" /> : l.num}
              </span>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </div>
            <p className="mt-3 font-semibold">Bài {l.num}</p>
            <p className="text-xs text-muted-foreground">≈ {l.words.length} từ</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full",
                  l.status === "done" ? "bg-success" : "bg-primary"
                )}
                style={{ width: `${l.pct}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {l.status === "done"
                ? "Đã thuộc"
                : l.status === "doing"
                  ? `${l.pct}% · đang học`
                  : "Chưa làm"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-1">
      <p className="text-xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-white/80">
        {label}
      </p>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:bg-secondary"
      )}
    >
      {children}
    </button>
  );
}
