"use client";

import * as React from "react";
import {
  Volume2,
  X,
  RotateCcw,
  Trophy,
  Eye,
  ArrowRight,
  Loader2,
  Cloud,
  HardDrive,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { speak } from "@/lib/speech";
import { shuffleClient, cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { QUALITY } from "@/lib/sm2";
import {
  buildSession,
  loadSrs,
  submitReview,
  type SrsMap,
} from "@/lib/vocab-srs";
import {
  applyRating,
  buildLearnQueue,
  nextLevel,
  STEPS_TO_MASTER,
  type LearnCard,
} from "@/lib/vocab-learn";
import type { VocabWord } from "@/lib/types";

const RATINGS = [
  { q: QUALITY.AGAIN, label: "Quên", variant: "destructive" as const, effect: "học lại" },
  { q: QUALITY.HARD, label: "Khó", variant: "secondary" as const, effect: "+1 mức" },
  { q: QUALITY.GOOD, label: "Tốt", variant: "default" as const, effect: "+1 mức" },
  { q: QUALITY.EASY, label: "Dễ", variant: "success" as const, effect: "thuộc ngay" },
];

/** A row of dots showing how close the current word is to the mastery gate. */
function LevelDots({ level }: { level: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: STEPS_TO_MASTER }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-6 rounded-full transition-colors",
            i < level ? "bg-success" : "bg-secondary"
          )}
        />
      ))}
    </div>
  );
}

export function VocabStudy({
  words,
  mode,
  onClose,
}: {
  words: VocabWord[];
  mode: "flashcard" | "quiz";
  onClose: () => void;
}) {
  const { user } = useAuth();
  const useServer = !!user;

  const [map, setMap] = React.useState<SrsMap>({});
  const [queue, setQueue] = React.useState<LearnCard[]>([]);
  const [total, setTotal] = React.useState(0);
  const [masteredCount, setMasteredCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [revealed, setRevealed] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [step, setStep] = React.useState(0); // increments each card view (drives audio)

  const start = React.useCallback(async () => {
    setLoading(true);
    const m = await loadSrs(useServer).catch(() => ({}) as SrsMap);
    const due = buildSession(words, m, 15);
    setMap(m);
    setQueue(buildLearnQueue(due));
    setTotal(due.length);
    setMasteredCount(0);
    setRevealed(false);
    setSelected(null);
    setDone(false);
    setStep(0);
    setLoading(false);
  }, [words, useServer]);

  React.useEffect(() => {
    void start();
  }, [start]);

  const current = queue[0];

  // Speak the character each time a new card is shown (including re-queued ones).
  React.useEffect(() => {
    if (!loading && current) void speak(current.word.hanzi, { rate: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, loading]);

  const options = React.useMemo(() => {
    if (mode !== "quiz" || !current) return [];
    const answer = current.word.vi;
    // De-duplicate distractors by gloss and exclude the answer, so the correct
    // option can never appear twice (which would break keys + scoring). Reshuffle
    // on every card view (step) so an immediate repeat can't be answered by
    // position memory.
    const pool = Array.from(
      new Set(
        words
          .filter((w) => w.id !== current.word.id && w.vi !== answer)
          .map((w) => w.vi)
      )
    );
    const distractors = shuffleClient(pool).slice(0, 3);
    return shuffleClient([answer, ...distractors]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.word.id, mode, step]);

  const applyReview = async (q: number) => {
    if (!current) return;
    setBusy(true);
    try {
      const state = await submitReview(useServer, current.word.id, q);
      setMap((prev) => ({ ...prev, [current.word.id]: state }));
    } catch {
      /* keep going even if the write fails */
    } finally {
      setBusy(false);
    }
  };

  // Move the front card according to the rating: master (remove) or re-queue.
  const commit = (q: number) => {
    const { queue: next, mastered } = applyRating(queue, q);
    if (mastered) setMasteredCount((c) => c + 1);
    setRevealed(false);
    setSelected(null);
    setStep((s) => s + 1);
    if (next.length === 0) setDone(true);
    setQueue(next);
  };

  // Flashcard: the rating records the review and advances the queue.
  const rate = async (q: number) => {
    if (busy || !current) return;
    await applyReview(q);
    commit(q);
  };

  // Quiz: answering records the review; "Tiếp theo" advances the queue.
  const answerQuiz = (opt: string) => {
    if (selected !== null || !current || busy) return;
    setSelected(opt);
    void applyReview(opt === current.word.vi ? QUALITY.GOOD : QUALITY.AGAIN);
  };
  const nextQuiz = () => {
    if (!current) return;
    commit(selected === current.word.vi ? QUALITY.GOOD : QUALITY.AGAIN);
  };

  // ---- Loading --------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex h-56 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" /> Đang tải phiên ôn tập…
      </div>
    );
  }

  // ---- Nothing due ----------------------------------------------------------
  if (total === 0 && !done) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="p-8">
          <Trophy className="mx-auto size-10 text-success" />
          <h3 className="mt-3 text-xl font-bold">Tuyệt vời! 🎉</h3>
          <p className="mt-1 text-muted-foreground">
            Không có từ nào tới hạn ôn. Quay lại sau — thuật toán SM-2 sẽ nhắc bạn
            đúng lúc sắp quên để nhớ lâu nhất.
          </p>
          <Button className="mt-4" onClick={onClose}>
            Đóng
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ---- Done (only reachable when every word passed the mastery gate) --------
  if (done) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="p-8">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Trophy className="size-8" />
          </div>
          <h3 className="mt-4 text-2xl font-bold">Hoàn thành bài! 🎉</h3>
          <p className="mt-1 text-muted-foreground">
            Bạn đã thuộc tất cả {total} từ ở mức nhớ tối thiểu.
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            {useServer ? (
              <Cloud className="size-3.5" />
            ) : (
              <HardDrive className="size-3.5" />
            )}
            {useServer ? "Đã lưu theo tài khoản" : "Đã lưu trên trình duyệt này"}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button onClick={start}>
              <RotateCcw /> Ôn tiếp
            </Button>
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!current) return null;
  const pct = total ? (masteredCount / total) * 100 : 0;
  const remaining = total - masteredCount;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {/* Mastery progress (completion gate) */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Target className="size-3.5 text-primary" /> Đã thuộc{" "}
              <span className="font-semibold text-foreground">
                {masteredCount}/{total}
              </span>
            </span>
            <span>Còn {remaining} từ</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="size-4" /> Thoát
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center p-8 text-center">
          {/* In-session memory level for this word */}
          <div className="mb-3 flex flex-col items-center gap-1">
            <LevelDots level={current.level} />
            <span className="text-[11px] text-muted-foreground">
              Mức nhớ {current.level}/{STEPS_TO_MASTER}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void speak(current.word.hanzi, { rate: 0.8 })}
            className="mb-2 flex items-center gap-1 rounded-full border px-3 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-primary"
          >
            <Volume2 className="size-4" /> Nghe
          </button>
          <span className="hanzi text-6xl font-semibold">
            {current.word.hanzi}
          </span>

          {mode === "flashcard" ? (
            <div className="mt-6 w-full">
              {revealed ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-lg text-primary">{current.word.pinyin}</p>
                    <p className="mt-1 text-lg text-muted-foreground">
                      {current.word.vi}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bạn nhớ từ này ở mức nào?
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {RATINGS.map((r) => {
                      const willMaster =
                        nextLevel(current.level, r.q) >= STEPS_TO_MASTER;
                      return (
                        <Button
                          key={r.q}
                          variant={r.variant}
                          disabled={busy}
                          onClick={() => void rate(r.q)}
                          className="flex-col py-2 h-auto"
                        >
                          <span>{r.label}</span>
                          <span className="text-[10px] font-normal opacity-80">
                            {willMaster ? "✓ thuộc" : r.effect}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setRevealed(true)}
                >
                  <Eye /> Hiện nghĩa
                </Button>
              )}
            </div>
          ) : (
            <div className="mt-6 w-full">
              <p className="mb-3 text-sm text-muted-foreground">
                Từ này nghĩa là gì?
              </p>
              <div className="grid gap-2">
                {options.map((opt) => {
                  const isCorrect = opt === current.word.vi;
                  const chosen = selected === opt;
                  const state =
                    selected === null
                      ? "idle"
                      : isCorrect
                        ? "correct"
                        : chosen
                          ? "wrong"
                          : "idle";
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={selected !== null}
                      onClick={() => answerQuiz(opt)}
                      className={cn(
                        "flex items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-colors",
                        state === "idle" &&
                          "border-border hover:border-primary/60 hover:bg-secondary",
                        state === "correct" && "border-success bg-success/10",
                        state === "wrong" && "border-destructive bg-destructive/10"
                      )}
                    >
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
              {selected !== null ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-primary">{current.word.pinyin}</p>
                  <p className="text-xs text-muted-foreground">
                    {selected === current.word.vi
                      ? nextLevel(current.level, QUALITY.GOOD) >= STEPS_TO_MASTER
                        ? "Chính xác — đã thuộc từ này!"
                        : "Chính xác — +1 mức nhớ."
                      : "Chưa đúng — sẽ học lại từ này."}
                  </p>
                  <Button onClick={nextQuiz} disabled={busy} className="w-full">
                    Tiếp theo <ArrowRight />
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Chỉ hoàn thành bài khi tất cả các từ đạt mức nhớ tối thiểu. Từ chưa nhớ sẽ
        được lặp lại trong phiên.
      </p>
    </div>
  );
}
