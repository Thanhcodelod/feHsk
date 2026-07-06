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
                  <CardContent className="flex gap-4 p-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {(lesson - 1) * 15 + i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="hanzi text-3xl font-semibold">{w.hanzi}</span>
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
                      <p className="mt-1 text-muted-foreground">{w.vi}</p>
                      {w.topic ? (
                        <Badge variant="outline" className="mt-2 text-[10px]">
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
