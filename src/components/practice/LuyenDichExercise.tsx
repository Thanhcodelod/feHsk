"use client";

import * as React from "react";
import Link from "next/link";
import {
  Loader2,
  Home,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Search,
  Volume2,
  Bookmark,
  Flag,
  Eye,
  PenLine,
  CheckCircle2,
  XCircle,
  ListChecks,
  Keyboard,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { PinyinKeyboard } from "@/components/practice/PinyinKeyboard";
import { apiGetTranslations, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { speak } from "@/lib/speech";
import { normalizeChinese } from "@/lib/similarity";
import {
  loadLd,
  applyAttempt,
  persistLdAttempt,
  persistLdSaved,
  type LdMap,
} from "@/lib/luyen-dich-store";
import { LEVEL_LABELS } from "@/lib/labels";
import type { HSKLevel, Translation } from "@/lib/types";
import { cn } from "@/lib/utils";

type Direction = "vt" | "tv"; // vt = Việt→Trung, tv = Trung→Việt

function levelFromParam(p?: string): HSKLevel | null {
  const n = Number(p);
  return n >= 1 && n <= 6 ? (`HSK${n}` as HSKLevel) : null;
}
function levelNum(l: HSKLevel): number {
  return Number(l.replace("HSK", ""));
}

// ---- Vietnamese answer matching (lenient) ----------------------------------
function normVi(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFC")
    .replace(/[.,!?;:"'`~@#$%^&*()_\-+=[\]{}|/\\<>…“”‘’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function viClose(user: string, ref: string): boolean {
  const u = normVi(user);
  const r = normVi(ref);
  if (!u) return false;
  if (u === r) return true;
  const ut = new Set(u.split(" ").filter(Boolean));
  const rt = r.split(" ").filter(Boolean);
  if (rt.length === 0) return false;
  const overlap = rt.filter((w) => ut.has(w)).length / rt.length;
  return overlap >= 0.7;
}
function gradeItem(dir: Direction, t: Translation, draft: string): boolean {
  if (dir === "vt") {
    const u = normalizeChinese(draft);
    if (!u) return false;
    return [t.zh, ...(t.zhVariants ?? [])].some(
      (z) => normalizeChinese(z) === u
    );
  }
  return viClose(draft, t.vi);
}

export function LuyenDichExercise({
  levelParam,
  lessonParam,
  startAt,
}: {
  levelParam?: string;
  lessonParam?: string;
  startAt?: number;
}) {
  const level = levelFromParam(levelParam);
  const lesson = Number(lessonParam);
  const { user } = useAuth();
  const scope = user?.id ?? "guest";

  const [all, setAll] = React.useState<Translation[] | null>(null);
  const [error, setError] = React.useState("");
  const [dir, setDir] = React.useState<Direction>("vt");
  const [index, setIndex] = React.useState(Math.max(0, (startAt ?? 1) - 1));
  const [draft, setDraft] = React.useState("");
  const [checked, setChecked] = React.useState(false);
  const [correct, setCorrect] = React.useState(false);
  const [prog, setProg] = React.useState<LdMap>({});
  const [saved, setSaved] = React.useState<string[]>([]);
  const [showPinyin, setShowPinyin] = React.useState(false);
  const [showKeyboard, setShowKeyboard] = React.useState(false);
  const [reported, setReported] = React.useState(false);

  React.useEffect(() => {
    if (!level || !lesson) {
      setError("Bài học không hợp lệ.");
      return;
    }
    let active = true;
    apiGetTranslations({ level })
      .then((d) => active && setAll(d))
      .catch(
        (e) =>
          active &&
          setError(e instanceof ApiError ? e.message : "Không tải được dữ liệu.")
      );
    return () => {
      active = false;
    };
  }, [level, lesson]);

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
  }, [user, scope]);

  const lessons = React.useMemo(() => {
    if (!all) return [];
    const m = new Map<number, number>();
    for (const t of all) m.set(t.lesson, (m.get(t.lesson) ?? 0) + 1);
    return [...m.entries()]
      .map(([num, count]) => ({ num, count }))
      .sort((a, b) => a.num - b.num);
  }, [all]);

  const items = React.useMemo(
    () =>
      all
        ? all.filter((t) => t.lesson === lesson).sort((a, b) => a.index - b.index)
        : [],
    [all, lesson]
  );

  // Clamp the starting index once items are known.
  React.useEffect(() => {
    if (items.length) setIndex((i) => Math.min(Math.max(0, i), items.length - 1));
  }, [items.length]);

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }
  if (!all || !level) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" /> Đang tải bài học…
      </div>
    );
  }
  if (!items.length) {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        Không tìm thấy bài {lesson}.
      </div>
    );
  }

  const num = levelNum(level);
  const cur = items[index];
  const isSaved = saved.includes(cur.id);
  const prompt = dir === "vt" ? cur.vi : cur.zh;
  const answer = dir === "vt" ? cur.zh : cur.vi;

  const goto = (i: number) => {
    setIndex(Math.min(Math.max(0, i), items.length - 1));
    setDraft("");
    setChecked(false);
    setCorrect(false);
    setReported(false);
  };
  const switchDir = (d: Direction) => {
    if (d === dir) return;
    setDir(d);
    setDraft("");
    setChecked(false);
    setCorrect(false);
  };

  const check = () => {
    if (checked || !draft.trim()) return;
    const ok = gradeItem(dir, cur, draft);
    setCorrect(ok);
    setChecked(true);
    setProg((p) => applyAttempt(p, cur.id, ok)); // optimistic
    void persistLdAttempt(!!user, scope, cur.id, ok); // persist (server/local)
    if (dir === "vt") void speak(cur.zh, { rate: 0.85 });
  };

  const stepState = (i: number): "current" | "ok" | "bad" | "todo" => {
    if (i === index) return "current";
    const rec = prog[items[i].id];
    if (rec?.ok === 1) return "ok";
    if (rec?.a) return "bad";
    return "todo";
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground">
          <Home className="size-3.5" /> Trang chủ
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/luyen-dich" className="hover:text-foreground">
          Luyện dịch
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/luyen-dich/${num}`} className="hover:text-foreground">
          {LEVEL_LABELS[level]}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">Bài {lesson}</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* Main */}
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border bg-card p-4">
            <div>
              <h1 className="text-xl font-bold">
                {LEVEL_LABELS[level]} · Bài {lesson}
              </h1>
              <p className="text-sm text-muted-foreground">
                {items.length} câu luyện dịch ·{" "}
                {dir === "vt" ? "Việt → Trung" : "Trung → Việt"}
              </p>
            </div>
            <div className="flex overflow-hidden rounded-lg border">
              <button
                type="button"
                onClick={() => switchDir("vt")}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium",
                  dir === "vt"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                )}
              >
                <ArrowRight className="size-3.5" /> Việt → Trung
              </button>
              <button
                type="button"
                onClick={() => switchDir("tv")}
                className={cn(
                  "inline-flex items-center gap-1 border-l px-3 py-1.5 text-sm font-medium",
                  dir === "tv"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                )}
              >
                <ArrowLeft className="size-3.5" /> Trung → Việt
              </button>
            </div>
          </div>

          {/* Progress + stepper */}
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">
                Câu {index + 1}/{items.length}
              </span>
              <span className="text-muted-foreground">
                {dir === "vt" ? "Việt → Trung" : "Trung → Việt"}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${((index + 1) / items.length) * 100}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {items.map((_, i) => {
                const st = stepState(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goto(i)}
                    className={cn(
                      "size-8 rounded-lg border text-xs font-semibold transition-colors",
                      st === "current" &&
                        "border-primary bg-primary text-primary-foreground",
                      st === "ok" &&
                        "border-success/50 bg-success/15 text-success",
                      st === "bad" &&
                        "border-destructive/50 bg-destructive/10 text-destructive",
                      st === "todo" &&
                        "border-border text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt card */}
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "text-2xl font-semibold leading-relaxed",
                      dir === "tv" && "hanzi"
                    )}
                  >
                    {prompt}
                  </p>
                  {dir === "tv" ? (
                    <button
                      type="button"
                      onClick={() => void speak(cur.zh, { rate: 0.85 })}
                      className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
                      aria-label="Nghe"
                    >
                      <Volume2 className="size-5" />
                    </button>
                  ) : null}
                </div>
                {dir === "tv" && showPinyin ? (
                  <p className="mt-1 text-sm text-primary/80">{cur.pinyin}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {dir === "tv" ? (
                  <button
                    type="button"
                    onClick={() => setShowPinyin((v) => !v)}
                    className={cn(
                      "rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary",
                      showPinyin && "text-primary"
                    )}
                    aria-label="Phiên âm"
                    title="Hiện/ẩn phiên âm"
                  >
                    <Eye className="size-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    const willSave = !isSaved;
                    setSaved((s) =>
                      willSave ? [...s, cur.id] : s.filter((x) => x !== cur.id)
                    );
                    void persistLdSaved(!!user, scope, cur.id, willSave);
                  }}
                  className={cn(
                    "rounded-full p-1.5 hover:bg-secondary",
                    isSaved
                      ? "text-amber-500"
                      : "text-muted-foreground hover:text-primary"
                  )}
                  aria-label="Lưu câu"
                  title="Lưu câu"
                >
                  <Bookmark
                    className={cn("size-4", isSaved && "fill-current")}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setReported(true)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                    reported
                      ? "border-success/40 text-success"
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <Flag className="size-3" /> {reported ? "Đã báo" : "Báo lỗi"}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <PenLine className="size-4" />
                  {dir === "vt"
                    ? "Dịch sang tiếng Trung"
                    : "Dịch sang tiếng Việt"}
                </p>
                {dir === "vt" ? (
                  <button
                    type="button"
                    onClick={() => setShowKeyboard((v) => !v)}
                    disabled={checked}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium disabled:opacity-40",
                      showKeyboard
                        ? "border-primary/50 bg-primary/5 text-primary"
                        : "text-muted-foreground hover:bg-secondary"
                    )}
                    title="Bàn phím tiếng Trung (pinyin)"
                  >
                    <Keyboard className="size-3.5" /> Bàn phím Trung
                  </button>
                ) : null}
              </div>
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") check();
                }}
                placeholder={
                  dir === "vt"
                    ? "Nhập bản dịch tiếng Trung…"
                    : "Nhập bản dịch tiếng Việt…"
                }
                className={cn(
                  "min-h-[96px]",
                  dir === "vt" && "hanzi text-lg"
                )}
                disabled={checked}
              />
              {dir === "vt" && showKeyboard && !checked ? (
                <PinyinKeyboard
                  className="mt-2"
                  onCommit={(t) => setDraft((d) => d + t)}
                  onBackspace={() => setDraft((d) => d.slice(0, -1))}
                />
              ) : null}
            </div>

            {/* Result */}
            {checked ? (
              <div
                className={cn(
                  "mt-3 rounded-lg p-3",
                  correct ? "bg-success/10" : "bg-destructive/10"
                )}
              >
                <p
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-semibold",
                    correct ? "text-success" : "text-destructive"
                  )}
                >
                  {correct ? (
                    <>
                      <CheckCircle2 className="size-4" /> Chính xác!
                    </>
                  ) : (
                    <>
                      <XCircle className="size-4" /> Chưa đúng
                    </>
                  )}
                </p>
                <div className="mt-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Đáp án tham khảo
                  </p>
                  {dir === "vt" ? (
                    <>
                      <p className="hanzi mt-0.5 text-lg">{cur.zh}</p>
                      <p className="text-sm text-primary/80">{cur.pinyin}</p>
                    </>
                  ) : (
                    <>
                      <p className="mt-0.5 text-base">{cur.vi}</p>
                      <p className="hanzi text-sm text-muted-foreground">
                        {cur.zh}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : null}

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between gap-2">
              {!checked ? (
                <button
                  type="button"
                  onClick={check}
                  disabled={!draft.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Search className="size-4" /> Kiểm tra
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setChecked(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-secondary"
                >
                  <PenLine className="size-4" /> Sửa lại
                </button>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goto(index - 1)}
                  disabled={index === 0}
                  className="inline-flex items-center rounded-lg border p-2 text-muted-foreground hover:bg-secondary disabled:opacity-40"
                  aria-label="Câu trước"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => goto(index + 1)}
                  disabled={index >= items.length - 1}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-40"
                >
                  Tiếp tục <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar — Danh sách bài */}
        <aside className="space-y-3 lg:sticky lg:top-32 lg:self-start">
          <div className="flex items-center gap-2 rounded-t-xl bg-primary px-4 py-3 text-primary-foreground">
            <ListChecks className="size-4" />
            <span className="font-bold">Danh sách bài</span>
          </div>
          <div className="scroll-thin max-h-[70vh] space-y-1.5 overflow-y-auto pr-1">
            {lessons.map((l) => {
              const active = l.num === lesson;
              const from = (l.num - 1) * l.count + 1;
              const to = l.num * l.count;
              return (
                <Link
                  key={l.num}
                  href={`/luyen-dich/${num}/${l.num}`}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 text-sm transition-colors",
                    active
                      ? "border-primary/50 bg-primary/5"
                      : "hover:border-primary/40 hover:bg-secondary"
                  )}
                >
                  <span>
                    <span
                      className={cn(
                        "font-semibold",
                        active && "text-primary"
                      )}
                    >
                      Bài {l.num}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      Câu {from}–{to}
                    </span>
                  </span>
                  <ChevronRight
                    className={cn(
                      "size-4",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </Link>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
