"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, ArrowRight, ChevronLeft, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiGetVocabSources, ApiError, type VocabSourceSummary } from "@/lib/api";
import { VOCAB_SOURCE_META } from "@/lib/labels";

export function VocabSourcePage({ source }: { source: string }) {
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

  return (
    <div className="space-y-6">
      <Link
        href="/tu-vung"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Nguồn khác
      </Link>

      <div className="flex items-center gap-3">
        <span className="text-3xl">{meta.emoji}</span>
        <div>
          <h1 className="text-2xl font-bold">{meta.label}</h1>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.groups.map((g) => (
          <Link
            key={g.group}
            href={`/tu-vung/${source}/${encodeURIComponent(g.group)}`}
          >
            <Card className="group h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <BookOpen className="size-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{g.group}</p>
                  <Badge variant="secondary" className="mt-1">
                    {g.count} từ
                  </Badge>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
