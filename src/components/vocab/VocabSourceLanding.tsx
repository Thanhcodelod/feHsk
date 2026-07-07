"use client";

import * as React from "react";
import Link from "next/link";
import {
  Loader2,
  Play,
  ArrowRight,
  Layers,
  LineChart,
  Zap,
  Headphones,
  Type as TypeIcon,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiGetVocabSources, ApiError, type VocabSourceSummary } from "@/lib/api";
import { VOCAB_SOURCE_META, CARD_TONES } from "@/lib/labels";
import { LESSON_SIZE } from "@/lib/lessons";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Layers, text: "Flashcard, chọn nghĩa, luyện nghe" },
  { icon: LineChart, text: "Theo dõi tiến độ từng bộ" },
  { icon: Zap, text: `Lesson ngắn ~${LESSON_SIZE} từ, học nhanh, ôn đều` },
  { icon: Headphones, text: "Audio & phát âm đầy đủ" },
];

export function VocabSourceLanding({
  source,
  basePath,
}: {
  source: string;
  basePath: string;
}) {
  const [data, setData] = React.useState<VocabSourceSummary | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    apiGetVocabSources()
      .then((all) => {
        const found = all.find((s) => s.source === source);
        if (!found) setError("Không tìm thấy nguồn từ vựng này.");
        else setData(found);
      })
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Không tải được dữ liệu.")
      );
  }, [source]);

  const meta =
    VOCAB_SOURCE_META[source] ?? { label: source, description: "", emoji: "📖" };

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" /> Đang tải…
      </div>
    );
  }

  const firstGroup = data.groups[0]?.group;
  const totalWords = data.groups.reduce((a, g) => a + g.count, 0);
  const totalLessons = data.groups.reduce(
    (a, g) => a + Math.ceil(g.count / LESSON_SIZE),
    0
  );
  const totalGroups = data.groups.length;

  return (
    <div className="space-y-8">
      {/* Hero banner */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-6 text-white sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/30">
              <span>{meta.emoji}</span> {meta.label} · Lesson
            </span>
            <h1 className="mt-3 text-3xl font-bold">
              {meta.label.replace(/^Từ vựng /, "Từ Vựng ")}
            </h1>
            <p className="mt-3 max-w-xl text-slate-300">
              {meta.description}. Chia nhỏ thành các bài ngắn ~{LESSON_SIZE} từ, giữ
              nguyên audio, flashcard và ôn tập lặp lại ngắt quãng.
            </p>
            {firstGroup ? (
              <Link
                href={`${basePath}/${encodeURIComponent(firstGroup)}/1`}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Play className="size-4 fill-current" /> Bắt đầu từ{" "}
                {firstGroup}
              </Link>
            ) : null}
          </div>
          <div className="space-y-3">
            {/* Aggregate stats (hihsk-style) */}
            <div className="grid grid-cols-3 divide-x divide-white/10 rounded-xl bg-white/5 p-4 text-center ring-1 ring-white/10">
              <HeroStat value={totalGroups} label="BỘ HỌC" />
              <HeroStat value={totalLessons} label="BÀI HỌC" />
              <HeroStat value={totalWords} label="TỪ VỰNG" />
            </div>
            {/* Feature list */}
            <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="space-y-2.5">
                {FEATURES.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.text} className="flex items-center gap-3 text-sm">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-white/10">
                        <Icon className="size-4 text-primary" />
                      </span>
                      <span className="text-slate-200">{f.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Level / group cards */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-xl font-bold">Chọn bộ học</h2>
          <Badge variant="secondary">{data.groups.length} bộ</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.groups.map((g, i) => {
            const lessons = Math.ceil(g.count / LESSON_SIZE);
            return (
              <Link
                key={g.group}
                href={`${basePath}/${encodeURIComponent(g.group)}`}
                className="group overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className={cn(
                    "flex items-center justify-between bg-gradient-to-br p-4 text-white",
                    CARD_TONES[i % CARD_TONES.length]
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold">{g.group}</p>
                    <p className="text-xs uppercase tracking-wide text-white/80">
                      {meta.label}
                    </p>
                  </div>
                  <BookOpen className="size-8 shrink-0 opacity-80" />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <TypeIcon className="size-3.5" /> {g.count} từ
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="size-3.5" /> {lessons} bài
                    </span>
                  </div>
                  <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-1">
      <p className="text-2xl font-bold leading-none">
        {value.toLocaleString("vi-VN")}
      </p>
      <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-white/70">
        {label}
      </p>
    </div>
  );
}
