"use client";

import * as React from "react";
import Link from "next/link";
import {
  Loader2,
  ChevronRight,
  Home,
  Volume2,
  Layers,
  Brain,
  Play,
  Square,
  ChevronLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { VocabStudy } from "@/components/vocab/VocabStudy";
import { LessonSidebar } from "@/components/vocab/LessonSidebar";
import { apiGetVocab, ApiError } from "@/lib/api";
import { speak, stopSpeaking } from "@/lib/speech";
import { chunkLessons } from "@/lib/lessons";
import { VOCAB_SOURCE_META } from "@/lib/labels";
import type { VocabWord } from "@/lib/types";
import { cn } from "@/lib/utils";

export function VocabLesson({
  source,
  group,
  lesson,
  basePath,
}: {
  source: string;
  group: string;
  lesson: number;
  basePath: string;
}) {
  const [words, setWords] = React.useState<VocabWord[] | null>(null);
  const [error, setError] = React.useState("");
  const [study, setStudy] = React.useState<null | "flashcard" | "quiz">(null);
  const [playing, setPlaying] = React.useState(false);
  const playRef = React.useRef(false);

  React.useEffect(() => {
    apiGetVocab({ source, group })
      .then(setWords)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Không tải được từ vựng.")
      );
    return () => {
      playRef.current = false;
      stopSpeaking();
    };
  }, [source, group]);

  const meta =
    VOCAB_SOURCE_META[source] ?? { label: source, description: "", emoji: "📖" };
  const lessons = React.useMemo(
    () => (words ? chunkLessons(words) : []),
    [words]
  );
  const current = lessons.find((l) => l.num === lesson);

  const playAll = async () => {
    if (!current) return;
    if (playing) {
      playRef.current = false;
      stopSpeaking();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    playRef.current = true;
    for (const w of current.words) {
      if (!playRef.current) break;
      await new Promise<void>((res) => {
        void speak(w.hanzi, { rate: 0.85, onEnd: () => res(), onError: () => res() });
      });
    }
    playRef.current = false;
    setPlaying(false);
  };

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }
  if (!words || !current) {
    if (words && !current) {
      return (
        <div className="mx-auto max-w-md rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          Không tìm thấy bài {lesson}.
        </div>
      );
    }
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" /> Đang tải bài học…
      </div>
    );
  }

  if (study) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setStudy(null)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Quay lại bài {lesson}
        </button>
        <VocabStudy
          words={current.words}
          mode={study}
          onClose={() => setStudy(null)}
        />
      </div>
    );
  }

  const groupPath = `${basePath}/${encodeURIComponent(group)}`;

  return (
    <div className="space-y-4">
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
        <Link href={groupPath} className="hover:text-foreground">
          {group}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">Bài {lesson}</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* Words */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-primary" />
              <h1 className="text-xl font-bold">Bài {lesson}</h1>
              <Badge variant="secondary">{current.words.length} từ vựng</Badge>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={playAll}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium",
                  playing
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "hover:bg-secondary"
                )}
              >
                {playing ? <Square className="size-4 fill-current" /> : <Play className="size-4" />}
                {playing ? "Dừng" : "Nghe toàn bộ"}
              </button>
              <button
                type="button"
                onClick={() => setStudy("flashcard")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Layers className="size-4" /> Flashcard
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {current.words.map((w, i) => {
              const showTrad = w.traditional && w.traditional !== w.hanzi;
              return (
                <Card key={w.id}>
                  <CardContent className="flex gap-4 p-4 sm:p-5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {(lesson - 1) * 15 + i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      {/* Hanzi + pinyin + POS */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="hanzi text-3xl font-semibold">
                              {w.hanzi}
                            </span>
                            {showTrad ? (
                              <span className="hanzi text-lg text-muted-foreground">
                                繁 {w.traditional}
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => void speak(w.hanzi, { rate: 0.8 })}
                              className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
                              aria-label={`Nghe ${w.hanzi}`}
                            >
                              <Volume2 className="size-4" />
                            </button>
                          </div>
                          <p className="mt-0.5 text-primary">{w.pinyin}</p>
                        </div>
                        {w.pos ? <PosBadge pos={w.pos} /> : null}
                      </div>

                      {/* Meaning */}
                      <p className="mt-2 leading-relaxed">{w.vi}</p>

                      {/* Examples */}
                      {w.examples && w.examples.length > 0 ? (
                        <div className="mt-3 space-y-2 border-t pt-3">
                          {w.examples.map((ex, k) => (
                            <div
                              key={k}
                              className="flex items-start gap-2 rounded-lg bg-secondary/40 p-3"
                            >
                              <button
                                type="button"
                                onClick={() => void speak(ex.zh, { rate: 0.85 })}
                                className="mt-0.5 shrink-0 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-primary"
                                aria-label="Nghe câu ví dụ"
                              >
                                <Volume2 className="size-3.5" />
                              </button>
                              <div className="min-w-0">
                                <p className="text-xs text-primary/70">
                                  {ex.pinyin}
                                </p>
                                <p className="hanzi text-base leading-snug">
                                  {ex.zh}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {ex.vi}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {w.topic ? (
                        <Badge variant="outline" className="mt-3 text-[10px]">
                          {w.topic}
                        </Badge>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Sidebar — same study-mode menu as the practice pages */}
        <LessonSidebar
          basePath={basePath}
          group={group}
          levelLabel={group}
          currentLesson={lesson}
          currentMode="vocab"
          lessons={lessons.map((l) => ({ num: l.num, count: l.words.length }))}
        />
      </div>
    </div>
  );
}

const POS_COLOR: [string, string][] = [
  ["danh từ", "bg-sky-100 text-sky-700"],
  ["động từ", "bg-rose-100 text-rose-700"],
  ["tính từ", "bg-emerald-100 text-emerald-700"],
  ["phó từ", "bg-amber-100 text-amber-700"],
  ["đại từ", "bg-violet-100 text-violet-700"],
  ["số từ", "bg-cyan-100 text-cyan-700"],
  ["lượng từ", "bg-teal-100 text-teal-700"],
  ["giới từ", "bg-indigo-100 text-indigo-700"],
  ["liên từ", "bg-fuchsia-100 text-fuchsia-700"],
  ["trợ từ", "bg-slate-200 text-slate-700"],
  ["thán từ", "bg-orange-100 text-orange-700"],
];

function PosBadge({ pos }: { pos: string }) {
  const key = pos.toLowerCase();
  const color =
    POS_COLOR.find(([k]) => key.includes(k))?.[1] ??
    "bg-secondary text-muted-foreground";
  return (
    <span
      className={cn(
        "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        color
      )}
    >
      {pos}
    </span>
  );
}
