"use client";

import * as React from "react";
import { Loader2, Quote, Volume2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiGetPatterns, ApiError } from "@/lib/api";
import { speak } from "@/lib/speech";
import type { SentencePattern } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MauCau() {
  const [patterns, setPatterns] = React.useState<SentencePattern[] | null>(null);
  const [topics, setTopics] = React.useState<string[]>([]);
  const [topic, setTopic] = React.useState<string>("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    apiGetPatterns()
      .then((d) => {
        setPatterns(d.patterns);
        setTopics(d.topics);
      })
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Không tải được mẫu câu.")
      );
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }
  if (!patterns) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" /> Đang tải mẫu câu…
      </div>
    );
  }

  const list = topic ? patterns.filter((p) => p.topic === topic) : patterns;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Quote className="size-6 text-primary" /> Mẫu câu tiếng Trung
        </h1>
        <p className="mt-1 text-muted-foreground">
          Học các cấu trúc câu thông dụng theo chủ đề, kèm ví dụ và phát âm.
        </p>
      </div>

      {/* Topic chips */}
      <div className="flex flex-wrap gap-2">
        <TopicChip active={topic === ""} onClick={() => setTopic("")}>
          Tất cả ({patterns.length})
        </TopicChip>
        {topics.map((t) => (
          <TopicChip key={t} active={topic === t} onClick={() => setTopic(t)}>
            {t}
          </TopicChip>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="hanzi text-xl font-semibold text-primary">
                      {p.pattern}
                    </span>
                    <button
                      type="button"
                      onClick={() => void speak(p.pattern, { rate: 0.85 })}
                      className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-primary"
                      aria-label="Nghe cấu trúc"
                    >
                      <Volume2 className="size-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.pinyin}</p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {p.topic}
                </Badge>
              </div>

              <p className="mt-2 text-sm">{p.meaning}</p>

              <div className="mt-3 rounded-lg bg-secondary/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="hanzi text-lg">{p.example}</p>
                  <button
                    type="button"
                    onClick={() => void speak(p.example, { rate: 0.85 })}
                    className="mt-1 shrink-0 rounded-full p-1 text-muted-foreground hover:bg-card hover:text-primary"
                    aria-label="Nghe ví dụ"
                  >
                    <Volume2 className="size-4" />
                  </button>
                </div>
                <p className="mt-0.5 text-xs text-primary/80">{p.examplePinyin}</p>
                <p className="mt-0.5 text-sm italic text-muted-foreground">
                  {p.exampleVi}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TopicChip({
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
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:bg-secondary"
      )}
    >
      {children}
    </button>
  );
}
