"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ArrowRight, Loader2, AlertTriangle, Layers, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiGetQuestions, ApiError } from "@/lib/api";
import {
  CATEGORY_HANZI,
  CATEGORY_LABELS,
  CATEGORY_TYPES,
  LEVEL_LABELS,
  TYPE_DESC,
  TYPE_HANZI,
  TYPE_LABELS,
} from "@/lib/labels";
import type { HSKLevel, QuestionCategory, QuestionType } from "@/lib/types";

export function TypePicker({
  level,
  category,
}: {
  level: HSKLevel;
  category: QuestionCategory;
}) {
  const [counts, setCounts] = React.useState<Record<string, number> | null>(null);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = React.useState("");

  const load = React.useCallback(() => {
    setStatus("loading");
    apiGetQuestions({ level, category })
      .then((qs) => {
        const c: Record<string, number> = {};
        for (const q of qs) c[q.type] = (c[q.type] ?? 0) + 1;
        setCounts(c);
        setStatus("ready");
      })
      .catch((e) => {
        setError(e instanceof ApiError ? e.message : "Không tải được dữ liệu.");
        setStatus("error");
      });
  }, [level, category]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (status === "loading") {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" /> Đang tải…
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center">
        <AlertTriangle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={load}>
          <RotateCcw /> Thử lại
        </Button>
      </div>
    );
  }

  const types = CATEGORY_TYPES[category].filter((t) => (counts?.[t] ?? 0) > 0);
  const total = Object.values(counts ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <Link
        href={`/practice/${level}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Đổi kỹ năng
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <Badge className="text-base">{LEVEL_LABELS[level]}</Badge>
        <h1 className="text-2xl font-bold">{CATEGORY_LABELS[category]}</h1>
        <span className="hanzi text-lg text-muted-foreground">{CATEGORY_HANZI[category]}</span>
      </div>
      <p className="-mt-2 text-muted-foreground">Chọn dạng bài bạn muốn luyện:</p>

      {/* Luyện tất cả (mixed) */}
      {total > 0 ? (
        <Link href={`/practice/${level}/${category}/all`}>
          <Card className="group border-primary/40 bg-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Layers className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Luyện tất cả (trộn dạng)</h3>
                  <Badge variant="secondary">{total} câu</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Làm lẫn lộn mọi dạng bài của kỹ năng này.
                </p>
              </div>
              <ArrowRight className="size-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>
      ) : null}

      {/* Per-type cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {types.map((type: QuestionType) => (
          <Link key={type} href={`/practice/${level}/${category}/${type}`}>
            <Card className="group h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
              <CardContent className="flex items-start gap-3 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{TYPE_LABELS[type]}</h3>
                    <span className="hanzi text-xs text-muted-foreground">
                      {TYPE_HANZI[type]}
                    </span>
                    <Badge variant="secondary">{counts?.[type]} câu</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {TYPE_DESC[type]}
                  </p>
                </div>
                <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {types.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có câu hỏi cho kỹ năng này.</p>
      ) : null}
    </div>
  );
}
