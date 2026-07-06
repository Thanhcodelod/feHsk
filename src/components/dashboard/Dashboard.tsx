"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Flame,
  Target,
  CheckCircle2,
  Activity,
  ArrowRight,
  Trophy,
  RotateCcw,
  LogIn,
  Cloud,
  Medal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { HeroSection } from "@/components/dashboard/HeroSection";
import {
  getHistory,
  summarize,
  clearHistory,
} from "@/lib/storage";
import {
  apiGetProgress,
  apiGetLeaderboard,
  type GridCell,
  type LeaderboardEntry,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  CATEGORY_COLOR,
  CATEGORY_HANZI,
  CATEGORY_LABELS,
  LEVEL_DESCRIPTIONS,
  LEVEL_LABELS,
} from "@/lib/labels";
import {
  HSK_LEVELS,
  QUESTION_CATEGORIES,
  type HSKLevel,
  type QuestionCategory,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface UnifiedSummary {
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
  streakDays: number;
  practicedToday: boolean;
  byCategory: Record<string, { attempts: number; correct: number }>;
  last14Days: { date: string; attempts: number; correct: number }[];
}

type Grid = Record<string, Record<string, GridCell>>;

export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [summary, setSummary] = React.useState<UnifiedSummary | null>(null);
  const [grid, setGrid] = React.useState<Grid | null>(null);
  const [leaders, setLeaders] = React.useState<LeaderboardEntry[]>([]);

  const refresh = React.useCallback(async () => {
    // Leaderboard is global — always fetch (best-effort).
    apiGetLeaderboard(8)
      .then(setLeaders)
      .catch(() => setLeaders([]));

    if (user) {
      try {
        const p = await apiGetProgress();
        setSummary({
          totalAttempts: p.totalAttempts,
          totalCorrect: p.totalCorrect,
          accuracy: p.accuracy,
          streakDays: p.streakDays,
          practicedToday: p.practicedToday,
          byCategory: p.byCategory,
          last14Days: p.last14Days,
        });
        setGrid(p.grid);
        return;
      } catch {
        /* fall back to local below */
      }
    }
    const s = summarize(getHistory());
    const byCategory: Record<string, { attempts: number; correct: number }> = {};
    for (const [k, v] of Object.entries(s.byCategory)) {
      byCategory[k] = { attempts: v.attempts, correct: v.correct };
    }
    setSummary({
      totalAttempts: s.totalAttempts,
      totalCorrect: s.totalCorrect,
      accuracy: s.accuracy,
      streakDays: s.streakDays,
      practicedToday: s.practicedToday,
      byCategory,
      last14Days: s.last14Days,
    });
    setGrid(null);
  }, [user]);

  React.useEffect(() => {
    if (authLoading) return;
    refresh();
    const handler = () => refresh();
    window.addEventListener("hsk-progress-updated", handler);
    window.addEventListener("focus", handler);
    return () => {
      window.removeEventListener("hsk-progress-updated", handler);
      window.removeEventListener("focus", handler);
    };
  }, [refresh, authLoading]);

  if (!summary) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Đang tải tiến độ…
      </div>
    );
  }

  const accuracyPct = Math.round(summary.accuracy * 100);
  const maxDay = Math.max(1, ...summary.last14Days.map((d) => d.attempts));

  return (
    <div className="space-y-8">
      {/* Hero */}
      <HeroSection
        streakDays={summary.streakDays}
        accuracyPct={accuracyPct}
        name={user?.name || user?.email}
      />

      {/* Guest notice */}
      {!user ? (
        <div className="flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">
          <LogIn className="size-5 shrink-0 text-accent" />
          <span>
            Bạn đang ở chế độ khách — tiến trình chỉ lưu trên trình duyệt này.{" "}
            <Link href="/tai-khoan" className="font-semibold underline">
              Đăng nhập
            </Link>{" "}
            để lưu kết quả theo tài khoản và không bị mất khi đổi máy.
          </span>
        </div>
      ) : null}

      {/* Stat tiles */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={<Activity className="size-5" />} label="Lượt luyện tập" value={summary.totalAttempts.toString()} tone="primary" />
        <StatTile icon={<CheckCircle2 className="size-5" />} label="Câu đúng" value={summary.totalCorrect.toString()} tone="success" />
        <StatTile icon={<Target className="size-5" />} label="Độ chính xác" value={`${accuracyPct}%`} tone="accent" />
        <StatTile icon={<Flame className="size-5" />} label="Chuỗi ngày" value={`${summary.streakDays} ngày`} tone="destructive" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-accent" /> Kết quả theo kỹ năng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {QUESTION_CATEGORIES.map((cat) => {
              const stat = summary.byCategory[cat] ?? { attempts: 0, correct: 0 };
              const acc = stat.attempts
                ? Math.round((stat.correct / stat.attempts) * 100)
                : 0;
              return (
                <div key={cat}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLOR[cat] }} />
                      {CATEGORY_LABELS[cat]}
                      <span className="hanzi text-xs text-muted-foreground">{CATEGORY_HANZI[cat]}</span>
                    </span>
                    <span className="text-muted-foreground">
                      {stat.correct}/{stat.attempts} · {acc}%
                    </span>
                  </div>
                  <Progress value={acc} />
                </div>
              );
            })}
            {summary.totalAttempts === 0 ? (
              <p className="pt-2 text-sm text-muted-foreground">
                Chưa có dữ liệu. Hãy làm vài câu để xem thống kê nhé!
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* 14-day activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-primary" /> Hoạt động 14 ngày
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-end justify-between gap-1">
              {summary.last14Days.map((d, i) => {
                const h = (d.attempts / maxDay) * 100;
                const correctH = d.attempts ? (d.correct / d.attempts) * h : 0;
                return (
                  <div key={d.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${d.date}: ${d.correct}/${d.attempts} đúng`}>
                    <div className="relative flex w-full max-w-[18px] flex-1 items-end">
                      <div className="w-full rounded-t bg-secondary transition-all" style={{ height: `${Math.max(4, h)}%` }}>
                        <div className="w-full rounded-t bg-primary" style={{ height: `${correctH}%` }} />
                      </div>
                    </div>
                    <span className="text-[9px] text-muted-foreground">{i % 2 === 0 ? d.date.slice(8) : ""}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Cột đậm = số câu đúng · Cột nhạt = tổng số câu mỗi ngày.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress grid (logged-in, server-persisted) */}
      {grid ? <ProgressGrid grid={grid} /> : null}

      {/* Leaderboard */}
      {leaders.length > 0 ? (
        <Leaderboard leaders={leaders} currentUserId={user?.id} />
      ) : null}

      {/* Level grid */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">Chọn cấp độ HSK</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HSK_LEVELS.map((level, i) => (
            <motion.div key={level} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link href={`/practice/${level}`}>
                <Card className="group h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <Badge variant="secondary" className="text-sm">{LEVEL_LABELS[level]}</Badge>
                      <p className="mt-2 text-sm text-muted-foreground">{LEVEL_DESCRIPTIONS[level]}</p>
                    </div>
                    <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {!user && summary.totalAttempts > 0 ? (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Xoá toàn bộ lịch sử luyện tập trên trình duyệt này?")) {
                clearHistory();
                refresh();
              }
            }}
          >
            <RotateCcw className="size-4" /> Đặt lại tiến độ (khách)
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ProgressGrid({ grid }: { grid: Grid }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="size-5 text-primary" /> Tiến trình theo cấp độ & kỹ năng
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Số câu đã làm / tổng số câu mỗi ô. Ô có dấu ✓ là bạn đã luyện hết.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[560px] border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left text-xs font-medium text-muted-foreground">Cấp độ</th>
                {QUESTION_CATEGORIES.map((cat) => (
                  <th key={cat} className="p-2 text-center text-xs font-medium text-muted-foreground">
                    <span className="flex items-center justify-center gap-1">
                      <span className="size-2 rounded-full" style={{ backgroundColor: CATEGORY_COLOR[cat] }} />
                      {CATEGORY_LABELS[cat]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HSK_LEVELS.map((level) => (
                <tr key={level}>
                  <td className="p-2">
                    <Badge variant="secondary">{LEVEL_LABELS[level]}</Badge>
                  </td>
                  {QUESTION_CATEGORIES.map((cat) => {
                    const cell: GridCell | undefined = grid[level]?.[cat];
                    const total = cell?.total ?? 0;
                    const covered = cell?.covered ?? 0;
                    const attempts = cell?.attempts ?? 0;
                    const correct = cell?.correct ?? 0;
                    const acc = attempts ? Math.round((correct / attempts) * 100) : 0;
                    const pct = total ? (covered / total) * 100 : 0;
                    const done = cell?.done ?? false;
                    return (
                      <td key={cat} className="p-1">
                        <div
                          className={cn(
                            "rounded-lg border p-2 text-center",
                            total === 0 && "opacity-40",
                            done && "border-success/50 bg-success/5"
                          )}
                        >
                          <div className="flex items-center justify-center gap-1 font-medium tabular-nums">
                            {covered}/{total}
                            {done ? <CheckCircle2 className="size-3.5 text-success" /> : null}
                          </div>
                          <Progress value={pct} className="mt-1 h-1.5" />
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            {attempts ? `${acc}% đúng` : "chưa làm"}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function Leaderboard({
  leaders,
  currentUserId,
}: {
  leaders: LeaderboardEntry[];
  currentUserId?: string;
}) {
  const medal = ["🥇", "🥈", "🥉"];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Medal className="size-5 text-accent" /> Bảng xếp hạng học viên
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ai luyện nhiều nhất? So sánh số lượt làm bài giữa các tài khoản.
        </p>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {leaders.map((e) => {
          const me = currentUserId && e.userId === currentUserId;
          return (
            <div
              key={e.userId}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2",
                me ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-secondary/50"
              )}
            >
              <span className="w-8 text-center text-lg">
                {medal[e.rank - 1] ?? <span className="text-sm text-muted-foreground">#{e.rank}</span>}
              </span>
              <span className="flex-1 truncate font-medium">
                {e.name}
                {me ? <span className="ml-1 text-xs text-primary">(bạn)</span> : null}
              </span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {Math.round(e.accuracy * 100)}%
              </span>
              <span className="w-20 text-right text-sm font-semibold tabular-nums">
                {e.attempts} lượt
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function StreakBadge({ streak, today }: { streak: number; today: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card px-5 py-4">
      <div className={cn("flex size-12 items-center justify-center rounded-full", streak > 0 ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground")}>
        <Flame className="size-6" />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{streak}</p>
        <p className="text-xs text-muted-foreground">
          {today ? "ngày liên tiếp 🔥" : "ngày — luyện hôm nay để giữ chuỗi!"}
        </p>
      </div>
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
  value: string;
  tone: "primary" | "success" | "accent" | "destructive";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    accent: "bg-accent/10 text-accent",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex size-10 items-center justify-center rounded-lg", toneClass)}>{icon}</div>
        <div>
          <p className="text-xl font-bold leading-none">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
