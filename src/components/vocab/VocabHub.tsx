"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, ArrowRight, Languages } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiGetVocabSources, ApiError, type VocabSourceSummary } from "@/lib/api";
import { VOCAB_SOURCE_META, SOURCE_PATH } from "@/lib/labels";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Languages className="size-6 text-primary" /> Từ vựng
        </h1>
        <p className="mt-1 text-muted-foreground">
          Học từ vựng theo nhiều nguồn — HSK, chuyên ngành, Boya, TOCFL, chủ đề…
          Mỗi bộ đều có <strong>flashcard</strong> và <strong>ôn tập SM-2</strong>.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((s) => {
          const meta =
            VOCAB_SOURCE_META[s.source] ?? {
              label: s.source,
              description: "",
              emoji: "📖",
            };
          return (
            <Link key={s.source} href={SOURCE_PATH[s.source] ?? `/tu-vung/${s.source}`}>
              <Card className="group h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
                <CardContent className="flex items-start gap-3 p-5">
                  <span className="text-3xl">{meta.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{meta.label}</h3>
                      <Badge variant="secondary">{s.total} từ</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {meta.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.groups.length} bộ / bài
                    </p>
                  </div>
                  <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
