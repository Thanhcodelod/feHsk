"use client";

import * as React from "react";
import { Loader2, Search, Volume2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiGetRadicals, ApiError } from "@/lib/api";
import { speak } from "@/lib/speech";
import type { Radical } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BoThu() {
  const [radicals, setRadicals] = React.useState<Radical[] | null>(null);
  const [error, setError] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [stroke, setStroke] = React.useState<number | null>(null);
  const [selected, setSelected] = React.useState<Radical | null>(null);

  React.useEffect(() => {
    apiGetRadicals()
      .then(setRadicals)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Không tải được bộ thủ.")
      );
  }, []);

  const strokeCounts = React.useMemo(() => {
    const s = new Set<number>();
    for (const r of radicals ?? []) s.add(r.strokes);
    return [...s].sort((a, b) => a - b);
  }, [radicals]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return (radicals ?? []).filter((r) => {
      if (stroke != null && r.strokes !== stroke) return false;
      if (!q) return true;
      return (
        r.radical.includes(q) ||
        (r.variants ?? "").includes(q) ||
        r.pinyin.toLowerCase().includes(q) ||
        r.hanViet.toLowerCase().includes(q) ||
        r.meaning.toLowerCase().includes(q) ||
        String(r.number) === q
      );
    });
  }, [radicals, query, stroke]);

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }
  if (!radicals) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" /> Đang tải bộ thủ…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <span className="hanzi">部</span> Bộ thủ Khang Hy
        </h1>
        <p className="mt-1 text-muted-foreground">
          {radicals.length} bộ thủ chuẩn — nền tảng để nhận diện & tra cứu chữ
          Hán. Nhấn vào một bộ để xem chi tiết & nghe phát âm.
        </p>
      </div>

      {/* Detail panel */}
      {selected ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-secondary"
              aria-label="Đóng"
            >
              <X className="size-4" />
            </button>
            <div className="flex size-24 shrink-0 items-center justify-center rounded-xl bg-card">
              <span className="hanzi text-6xl font-semibold">{selected.radical}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Bộ {selected.number}</Badge>
                <Badge variant="secondary">{selected.strokes} nét</Badge>
                {selected.variants ? (
                  <Badge variant="outline" className="hanzi">
                    Biến thể: {selected.variants}
                  </Badge>
                ) : null}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xl font-bold text-primary">
                  {selected.pinyin}
                </span>
                <span className="text-lg text-muted-foreground">· {selected.hanViet}</span>
                <button
                  type="button"
                  onClick={() => void speak(selected.radical, { rate: 0.8 })}
                  className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-primary"
                  aria-label="Nghe"
                >
                  <Volume2 className="size-4" />
                </button>
              </div>
              <p className="mt-1">{selected.meaning}</p>
              {selected.examples ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Ví dụ:{" "}
                  <span className="hanzi text-base text-foreground">
                    {selected.examples}
                  </span>
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Controls */}
      <div className="space-y-2">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tra bộ / pinyin / Hán-Việt / nghĩa / số…"
            className="pl-9"
          />
        </div>
        <div className="scroll-thin flex gap-1.5 overflow-x-auto pb-1">
          <StrokeChip active={stroke == null} onClick={() => setStroke(null)}>
            Tất cả
          </StrokeChip>
          {strokeCounts.map((s) => (
            <StrokeChip key={s} active={stroke === s} onClick={() => setStroke(s)}>
              {s} nét
            </StrokeChip>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
        {filtered.map((r) => (
          <button
            key={r.number}
            type="button"
            onClick={() => setSelected(r)}
            className={cn(
              "flex flex-col items-center rounded-lg border bg-card p-2 transition-all hover:border-primary/50 hover:shadow-sm",
              selected?.number === r.number && "border-primary ring-1 ring-primary"
            )}
          >
            <span className="text-[10px] text-muted-foreground">{r.number}</span>
            <span className="hanzi text-3xl leading-none">{r.radical}</span>
            <span className="mt-1 text-[11px] text-primary">{r.pinyin}</span>
            <span className="text-[10px] text-muted-foreground">{r.hanViet}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Không tìm thấy bộ thủ nào khớp.
        </p>
      ) : null}
    </div>
  );
}

function StrokeChip({
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
        "shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:bg-secondary"
      )}
    >
      {children}
    </button>
  );
}
