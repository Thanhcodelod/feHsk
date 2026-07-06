"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, ChevronLeft } from "lucide-react";
import { VocabReview } from "@/components/vocab/VocabReview";
import { apiGetVocab, ApiError } from "@/lib/api";
import type { VocabWord } from "@/lib/types";

export function VocabGroupPage({
  source,
  group,
}: {
  source: string;
  group: string;
}) {
  const [words, setWords] = React.useState<VocabWord[] | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    apiGetVocab({ source, group })
      .then(setWords)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Không tải được từ vựng.")
      );
  }, [source, group]);

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
        <Loader2 className="size-6 animate-spin" /> Đang tải từ vựng…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href={`/tu-vung/${source}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Bài / bộ khác
      </Link>
      <VocabReview words={words} title={group} />
    </div>
  );
}
