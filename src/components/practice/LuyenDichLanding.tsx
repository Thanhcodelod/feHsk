"use client";

import * as React from "react";
import Link from "next/link";
import {
  Loader2,
  Languages,
  ListChecks,
  Bookmark,
  XCircle,
  CheckCircle2,
  ArrowRight,
  Volume2,
} from "lucide-react";
import { apiGetTranslations, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { speak } from "@/lib/speech";
import {
  loadLd,
  computeLevelStats,
  isWrongToReview,
  type LdMap,
} from "@/lib/luyen-dich-store";
import { LEVEL_LABELS, LEVEL_TIER } from "@/lib/labels";
import type { HSKLevel, Translation } from "@/lib/types";
import { cn } from "@/lib/utils";

const LEVELS: HSKLevel[] = ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"];

const LEVEL_ACCENT: Record<HSKLevel, string> = {
  HSK1: "border-emerald-400 bg-emerald-50 text-emerald-700",
  HSK2: "border-sky-400 bg-sky-50 text-sky-700",
  HSK3: "border-pink-400 bg-pink-50 text-pink-700",
  HSK4: "border-amber-400 bg-amber-50 text-amber-700",
  HSK5: "border-violet-400 bg-violet-50 text-violet-700",
  HSK6: "border-rose-400 bg-rose-50 text-rose-700",
};

function levelFromParam(p?: string): HSKLevel {
  const n = Number(p);
  return n >= 1 && n <= 6 ? (`HSK${n}` as HSKLevel) : "HSK1";
}
function levelNum(l: HSKLevel): number {
  return Number(l.replace("HSK", ""));
}

type MainTab = "lessons" | "saved" | "wrong";
type LessonFilter = "all" | "done" | "todo" | "low";

export function LuyenDichLanding({ levelParam }: { levelParam?: string }) {
  const level = levelFromParam(levelParam);
  const num = levelNum(level);
  const { user } = useAuth();
  const scope = user?.id ?? "guest";

  const [items, setItems] = React.useState<Translation[] | null>(null);
  const [error, setError] = React.useState("");
  const [prog, setProg] = React.useState<LdMap>({});
  const [saved, setSaved] = React.useState<string[]>([]);
  const [tab, setTab] = React.useState<MainTab>("lessons");
  const [filter, setFilter] = React.useState<LessonFilter>("all");

  React.useEffect(() => {
    let active = true;
    setItems(null);
    setError("");
    apiGetTranslations({ level })
      .then((d) => active && setItems(d))
      .catch(
        (e) =>
          active &&
          setError(e instanceof ApiError ? e.message : "Không tải được dữ liệu.")
      );
    return () => {
      active = false;
    };
  }, [level]);

  React.useEffect(() => {
    let active = true;
    loadLd(!!user, scope).then(({ prog, saved }) => {
      if (!active) return;
      setProg(prog);
      setSaved(saved);
    });
    return () => {
      active = false;
    };
  }, [user, scope, level]);

  const stats = React.useMemo(
    () => (items ? computeLevelStats(items, prog) : null),
    [items, prog]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="flex items-center justify-center gap-2 text-2xl font-bold sm:text-3xl">
          <Languages className="size-7 text-primary" /> Luyện dịch tiếng Trung
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chọn cấp độ HSK và bài để bắt đầu luyện dịch
        </p>
      </div>

      {/* Level selector */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {LEVELS.map((lv) => {
          const activeLv = lv === level;
          return (
            <Link
              key={lv}
              href={`/luyen-dich/${levelNum(lv)}`}
              className={cn(
                "flex flex-col items-center rounded-xl border-2 px-2 py-3 text-center transition-all hover:-translate-y-0.5",
                activeLv
                  ? LEVEL_ACCENT[lv]
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              <span className="text-sm font-bold">{LEVEL_LABELS[lv]}</span>
              <span className="text-[11px] opacity-80">{LEVEL_TIER[lv]}</span>
            </Link>
          );
        })}
      </div>

      {/* Main tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        <MainTabBtn active={tab === "lessons"} onClick={() => setTab("lessons")}>
          <ListChecks className="size-4" /> Danh sách bài
        </MainTabBtn>
        <MainTabBtn active={tab === "saved"} onClick={() => setTab("saved")}>
          <Bookmark className="size-4" /> Câu đã lưu
        </MainTabBtn>
        <MainTabBtn active={tab === "wrong"} onClick={() => setTab("wrong")}>
          <XCircle className="size-4" /> Câu sai cần ôn
        </MainTabBtn>
      </div>

      {error ? (
        <div className="mx-auto max-w-md rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          {error}
        </div>
      ) : !items || !stats ? (
        <div className="flex h-56 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" /> Đang tải…
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              color="border-l-emerald-500"
              label="SỐ BÀI ĐÃ LÀM"
              value={String(stats.lessonsDone)}
              sub={`${stats.lessonsTotal} bài trong level`}
            />
            <StatCard
              color="border-l-sky-500"
              label="TỔNG CÂU ĐÃ LUYỆN"
              value={String(stats.practiced)}
              sub={`${stats.total} câu khả dụng`}
            />
            <StatCard
              color="border-l-amber-500"
              label="ĐỘ CHÍNH XÁC TRUNG BÌNH"
              value={`${stats.accuracy}%`}
              sub={`${stats.correct} câu đúng`}
            />
          </div>

          {tab === "lessons" ? (
            <LessonsTab
              level={level}
              num={num}
              stats={stats}
              filter={filter}
              setFilter={setFilter}
            />
          ) : tab === "saved" ? (
            <SentenceList
              title="Câu đã lưu"
              empty="Bạn chưa lưu câu nào. Bấm dấu trang trong lúc luyện để lưu lại."
              level={level}
              num={num}
              sentences={items.filter((t) => saved.includes(t.id))}
              prog={prog}
            />
          ) : (
            <SentenceList
              title="Câu sai cần ôn"
              empty="Chưa có câu sai nào. Làm bài để hệ thống gợi ý câu cần ôn."
              level={level}
              num={num}
              sentences={items.filter((t) => isWrongToReview(prog[t.id]))}
              prog={prog}
            />
          )}
        </>
      )}
    </div>
  );
}

function LessonsTab({
  level,
  num,
  stats,
  filter,
  setFilter,
}: {
  level: HSKLevel;
  num: number;
  stats: ReturnType<typeof computeLevelStats>;
  filter: LessonFilter;
  setFilter: (f: LessonFilter) => void;
}) {
  const shown = stats.lessons.filter((l) => {
    if (filter === "all") return true;
    if (filter === "done") return l.status === "done";
    if (filter === "todo") return l.status === "todo";
    return l.attempted > 0 && l.pct < 60; // "low"
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold">
          {LEVEL_LABELS[level]} · {stats.total} câu · {stats.lessonsDone}/
          {stats.lessonsTotal} bài
        </h2>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>
          Tất cả
        </FilterBtn>
        <FilterBtn active={filter === "done"} onClick={() => setFilter("done")}>
          Đã làm
        </FilterBtn>
        <FilterBtn active={filter === "todo"} onClick={() => setFilter("todo")}>
          Chưa làm
        </FilterBtn>
        <FilterBtn active={filter === "low"} onClick={() => setFilter("low")}>
          Điểm thấp
        </FilterBtn>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((l) => {
          const from = (l.lesson - 1) * l.count + 1;
          const to = l.lesson * l.count;
          return (
            <Link
              key={l.lesson}
              href={`/luyen-dich/${num}/${l.lesson}`}
              className={cn(
                "group rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm",
                l.status === "done" && "border-success/50 bg-success/5"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">Bài {l.lesson}</p>
                  <p className="text-xs text-muted-foreground">
                    Câu {from}–{to}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full text-sm font-bold",
                    l.status === "done"
                      ? "bg-success text-success-foreground"
                      : l.status === "doing"
                        ? "bg-primary/15 text-primary ring-2 ring-primary/40"
                        : "bg-secondary text-muted-foreground"
                  )}
                >
                  {l.status === "done" ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    l.lesson
                  )}
                </span>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn(
                    "h-full rounded-full",
                    l.status === "done" ? "bg-success" : "bg-primary"
                  )}
                  style={{ width: `${l.pct}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {l.attempted > 0
                    ? `${l.correct}/${l.count} đúng`
                    : `${l.count} câu`}
                </span>
                <span className="inline-flex items-center gap-0.5 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Bắt đầu <ArrowRight className="size-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SentenceList({
  title,
  empty,
  level,
  num,
  sentences,
  prog,
}: {
  title: string;
  empty: string;
  level: HSKLevel;
  num: number;
  sentences: Translation[];
  prog: LdMap;
}) {
  void level;
  if (sentences.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">{title}</h2>
        <span className="text-sm text-muted-foreground">
          {sentences.length} câu
        </span>
      </div>
      {sentences.map((t) => {
        const rec = prog[t.id];
        return (
          <Link
            key={t.id}
            href={`/luyen-dich/${num}/${t.lesson}?c=${t.index}`}
            className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-secondary/40"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
              {t.lesson}.{t.index}
            </span>
            <div className="min-w-0 flex-1">
              <p className="hanzi truncate text-base">{t.zh}</p>
              <p className="truncate text-xs text-muted-foreground">{t.vi}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                void speak(t.zh, { rate: 0.85 });
              }}
              className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
              aria-label="Nghe"
            >
              <Volume2 className="size-4" />
            </button>
            {rec?.ok === 1 ? (
              <CheckCircle2 className="size-4 shrink-0 text-success" />
            ) : rec?.a ? (
              <XCircle className="size-4 shrink-0 text-destructive" />
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

function MainTabBtn({
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
        "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:bg-secondary"
      )}
    >
      {children}
    </button>
  );
}

function FilterBtn({
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
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:bg-secondary"
      )}
    >
      {children}
    </button>
  );
}

function StatCard({
  color,
  label,
  value,
  sub,
}: {
  color: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className={cn("rounded-xl border border-l-4 bg-card p-4", color)}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
