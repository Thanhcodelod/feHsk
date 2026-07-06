"use client";

import * as React from "react";
import {
  Search,
  Volume2,
  List,
  Layers,
  BookOpenCheck,
  Brain,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Cloud,
  HardDrive,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VocabStudy } from "@/components/vocab/VocabStudy";
import { useAuth } from "@/lib/auth";
import { speak } from "@/lib/speech";
import {
  computeStats,
  isMastered,
  loadSrs,
  resetLocalSrs,
  type SrsMap,
  type VocabStats,
} from "@/lib/vocab-srs";
import type { VocabWord } from "@/lib/types";
import { cn } from "@/lib/utils";

export function VocabReview({
  words,
  title,
}: {
  words: VocabWord[];
  title: string;
}) {
  const { user } = useAuth();
  const useServer = !!user;

  const [query, setQuery] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [mode, setMode] = React.useState<"list" | "card">("list");
  const [flipped, setFlipped] = React.useState<Set<string>>(new Set());
  const [srs, setSrs] = React.useState<SrsMap>({});
  const [stats, setStats] = React.useState<VocabStats | null>(null);
  const [study, setStudy] = React.useState<null | "flashcard" | "quiz">(null);

  const refreshSrs = React.useCallback(async () => {
    const map = await loadSrs(useServer).catch(() => ({}) as SrsMap);
    setSrs(map);
    setStats(computeStats(words, map));
  }, [words, useServer]);

  React.useEffect(() => {
    void refreshSrs();
    const handler = () => void refreshSrs();
    window.addEventListener("hsk-vocab-updated", handler);
    return () => window.removeEventListener("hsk-vocab-updated", handler);
  }, [refreshSrs]);

  const topics = React.useMemo(() => {
    const t = new Set<string>();
    for (const w of words) if (w.topic) t.add(w.topic);
    return [...t].sort();
  }, [words]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return words.filter((w) => {
      if (topic && w.topic !== topic) return false;
      if (!q) return true;
      return (
        w.hanzi.includes(q) ||
        (w.traditional ?? "").includes(q) ||
        w.pinyin.toLowerCase().includes(q) ||
        w.vi.toLowerCase().includes(q)
      );
    });
  }, [words, query, topic]);

  if (study) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {study === "flashcard" ? (
            <Layers className="size-5 text-primary" />
          ) : (
            <Brain className="size-5 text-primary" />
          )}
          <h1 className="text-xl font-bold">
            {study === "flashcard" ? "Ôn tập thẻ ghi nhớ" : "Kiểm tra trí nhớ"} ·{" "}
            {title}
          </h1>
        </div>
        <VocabStudy
          words={words}
          mode={study}
          onClose={() => {
            setStudy(null);
            void refreshSrs();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <Badge variant="secondary">{words.length} từ</Badge>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            {useServer ? <Cloud className="size-3.5" /> : <HardDrive className="size-3.5" />}
            {useServer ? "Đồng bộ theo tài khoản" : "Lưu trên trình duyệt"}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Ôn theo thuật toán lặp lại ngắt quãng <strong>SM-2</strong> — hệ thống
          nhắc bạn ôn đúng lúc sắp quên.
          {!useServer ? (
            <>
              {" "}
              <a href="/tai-khoan" className="font-medium underline">
                Đăng nhập
              </a>{" "}
              để lưu tiến trình theo tài khoản.
            </>
          ) : null}
        </p>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon={<Sparkles className="size-4" />} label="Chưa học" value={stats.neu} tone="muted" />
          <StatTile icon={<BookOpenCheck className="size-4" />} label="Đang học" value={stats.learning} tone="primary" />
          <StatTile icon={<CheckCircle2 className="size-4" />} label="Đã thuộc" value={stats.mastered} tone="success" />
          <StatTile icon={<Brain className="size-4" />} label="Cần ôn" value={stats.due} tone="accent" />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button size="lg" onClick={() => setStudy("flashcard")}>
          <Layers /> Ôn tập (thẻ)
        </Button>
        <Button size="lg" variant="accent" onClick={() => setStudy("quiz")}>
          <Brain /> Kiểm tra trí nhớ
        </Button>
        {!useServer && stats && stats.mastered + stats.learning > 0 ? (
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm("Đặt lại tiến trình ghi nhớ (trên trình duyệt này)?")) {
                resetLocalSrs();
                void refreshSrs();
              }
            }}
          >
            <RotateCcw className="size-4" /> Đặt lại
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tra chữ Hán / pinyin / nghĩa…"
            className="pl-9"
          />
        </div>
        {topics.length > 0 ? (
          <Select value={topic} onChange={(e) => setTopic(e.target.value)} className="max-w-[180px]">
            <option value="">Tất cả chủ đề</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        ) : null}
        <div className="flex overflow-hidden rounded-lg border">
          <button
            type="button"
            onClick={() => setMode("list")}
            className={cn(
              "flex items-center gap-1 px-3 py-2 text-sm",
              mode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
            )}
          >
            <List className="size-4" /> Danh sách
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("card");
              setFlipped(new Set());
            }}
            className={cn(
              "flex items-center gap-1 px-3 py-2 text-sm",
              mode === "card" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
            )}
          >
            <Layers className="size-4" /> Lật thẻ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((w) => {
          const isFlipped = mode === "list" || flipped.has(w.id);
          const mastered = isMastered(srs[w.id]);
          const showTrad = w.traditional && w.traditional !== w.hanzi;
          return (
            <Card
              key={w.id}
              className={cn(
                "relative transition-all",
                mode === "card" && "cursor-pointer hover:border-primary/50",
                mastered && "border-success/50 bg-success/5"
              )}
              onClick={
                mode === "card"
                  ? () =>
                      setFlipped((prev) => {
                        const next = new Set(prev);
                        if (next.has(w.id)) next.delete(w.id);
                        else next.add(w.id);
                        return next;
                      })
                  : undefined
              }
            >
              <CardContent className="flex flex-col items-center p-4 text-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void speak(w.hanzi, { rate: 0.8 });
                  }}
                  className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
                  aria-label={`Nghe ${w.hanzi}`}
                >
                  <Volume2 className="size-4" />
                </button>
                {mastered ? (
                  <CheckCircle2 className="absolute left-2 top-2 size-4 text-success" />
                ) : null}

                <span className="hanzi mt-3 text-4xl font-semibold">{w.hanzi}</span>
                {showTrad ? (
                  <span className="hanzi text-sm text-muted-foreground">
                    繁 {w.traditional}
                  </span>
                ) : null}
                {isFlipped ? (
                  <>
                    <span className="mt-2 text-sm text-primary">{w.pinyin}</span>
                    <span className="mt-1 text-sm text-muted-foreground">{w.vi}</span>
                  </>
                ) : (
                  <span className="mt-3 text-xs text-muted-foreground">(nhấn để xem nghĩa)</span>
                )}
                {w.topic ? (
                  <Badge variant="outline" className="mt-2 text-[10px]">
                    {w.topic}
                  </Badge>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Không tìm thấy từ nào khớp.
        </p>
      ) : null}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "muted" | "primary" | "success" | "accent";
}) {
  const toneClass = {
    muted: "bg-secondary text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    accent: "bg-accent/10 text-accent",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        <div className={cn("flex size-9 items-center justify-center rounded-lg", toneClass)}>
          {icon}
        </div>
        <div>
          <p className="text-lg font-bold leading-none">{value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
