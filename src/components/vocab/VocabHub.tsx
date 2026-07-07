"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, ArrowRight, Languages, Layers, BookOpen } from "lucide-react";
import { apiGetVocabSources, ApiError, type VocabSourceSummary } from "@/lib/api";
import { VOCAB_SOURCE_META, SOURCE_PATH, CARD_TONES } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function VocabHub() {
  const [sources, setSources] = React.useState<VocabSourceSummary[] | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    apiGetVocabSources()
      .then(setSources)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Không tải được dữ liệu.")
      );
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }
  if (!sources) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" /> Đang tải…
      </div>
    );
  }

  const totalWords = sources.reduce((a, s) => a + s.total, 0);
  const totalGroups = sources.reduce((a, s) => a + s.groups.length, 0);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-6 text-white shadow-elevated sm:p-8 dark:from-slate-900 dark:via-black dark:to-slate-900">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/30">
              <Languages className="size-3.5" /> Từ vựng đa nguồn
            </span>
            <h1 className="mt-3 text-3xl font-bold">Từ Vựng Tiếng Trung</h1>
            <p className="mt-2 max-w-xl text-slate-300">
              Học theo nhiều nguồn — HSK, chuyên ngành, Boya, TOCFL, chủ đề. Mỗi bộ
              đều có flashcard và ôn tập lặp lại ngắt quãng (SM-2).
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-white/5 p-4 text-center ring-1 ring-white/10">
            <div className="px-2">
              <p className="text-2xl font-bold leading-none">{sources.length}</p>
              <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-white/70">
                Nguồn
              </p>
            </div>
            <div className="px-2">
              <p className="text-2xl font-bold leading-none">
                {totalWords.toLocaleString("vi-VN")}
              </p>
              <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-white/70">
                Từ vựng
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Source cards */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Chọn nguồn từ vựng</h2>
          <span className="text-sm text-muted-foreground">
            {sources.length} nguồn · {totalGroups} bộ
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((s, i) => {
            const meta =
              VOCAB_SOURCE_META[s.source] ?? {
                label: s.source,
                description: "",
                emoji: "📖",
              };
            return (
              <Link
                key={s.source}
                href={SOURCE_PATH[s.source] ?? `/tu-vung/${s.source}`}
                className="group overflow-hidden rounded-2xl border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div
                  className={cn(
                    "flex items-center justify-between bg-gradient-to-br p-4 text-white",
                    CARD_TONES[i % CARD_TONES.length]
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold">{meta.label}</p>
                    <p className="text-xs text-white/80">{s.total} từ vựng</p>
                  </div>
                  <span className="text-3xl">{meta.emoji}</span>
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {meta.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="flex gap-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="size-3.5" /> {s.groups.length} bộ
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="size-3.5" />{" "}
                        {Math.ceil(s.total / 15)} bài
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-0.5 font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Học ngay <ArrowRight className="size-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
