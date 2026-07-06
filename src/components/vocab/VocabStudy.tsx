"use client";

import * as React from "react";
import { Volume2, X, RotateCcw, Trophy, Eye, ArrowRight, Loader2, Cloud, HardDrive } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { speak } from "@/lib/speech";
import { shuffleClient, cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { sm2, QUALITY, intervalLabel } from "@/lib/sm2";
import {
  buildSession,
  loadSrs,
  submitReview,
  type SrsMap,
} from "@/lib/vocab-srs";
import type { VocabWord } from "@/lib/types";

const RATINGS = [
  { q: QUALITY.AGAIN, label: "Quên", variant: "destructive" as const },
  { q: QUALITY.HARD, label: "Khó", variant: "secondary" as const },
  { q: QUALITY.GOOD, label: "Tốt", variant: "default" as const },
  { q: QUALITY.EASY, label: "Dễ", variant: "success" as const },
];

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
  const [session, setSession] = React.useState<VocabWord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [index, setIndex] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [rememberedCount, setRememberedCount] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const start = React.useCallback(async () => {
    setLoading(true);
    const m = await loadSrs(useServer).catch(() => ({}) as SrsMap);
    setMap(m);
    setSession(buildSession(words, m, 15));
    setIndex(0);
    setRevealed(false);
    setSelected(null);
    setRememberedCount(0);
    setDone(false);
    setLoading(false);
  }, [words, useServer]);

  React.useEffect(() => {
    void start();
  }, [start]);

  const current = session[index];

  React.useEffect(() => {
    if (current) void speak(current.hanzi, { rate: 0.8 });
  }, [current]);

  const options = React.useMemo(() => {
    if (mode !== "quiz" || !current) return [];
    const distractors = shuffleClient(words.filter((w) => w.id !== current.id))
      .slice(0, 3)
      .map((w) => w.vi);
    return shuffleClient([current.vi, ...distractors]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, mode]);

  const applyReview = async (q: number) => {
    if (!current) return;
    setBusy(true);
    try {
      const state = await submitReview(useServer, current.id, q);
      setMap((prev) => ({ ...prev, [current.id]: state }));
      if (q >= 3) setRememberedCount((c) => c + 1);
    } catch {
      /* keep going even if the write fails */
    } finally {
      setBusy(false);
    }
  };

  const advance = () => {
    if (index + 1 >= session.length) setDone(true);
    else {
      setIndex((i) => i + 1);
      setRevealed(false);
      setSelected(null);
    }
  };

  // Flashcard: the rating both records the review and moves on.
  const rate = async (q: number) => {
    if (busy) return;
    await applyReview(q);
    advance();
  };

  // Quiz: answer records the review but stays so the user sees the result.
  const answerQuiz = (opt: string) => {
    if (selected !== null || !current || busy) return;
    setSelected(opt);
    void applyReview(opt === current.vi ? QUALITY.GOOD : QUALITY.AGAIN);
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
  if (session.length === 0 && !done) {
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

  // ---- Done -----------------------------------------------------------------
  if (done) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="p-8">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Trophy className="size-8" />
          </div>
          <h3 className="mt-4 text-2xl font-bold">Hoàn thành lượt ôn!</h3>
          <p className="mt-1 text-muted-foreground">
            Đã ôn {session.length} từ · Nhớ {rememberedCount}/{session.length}.
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            {useServer ? <Cloud className="size-3.5" /> : <HardDrive className="size-3.5" />}
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
  const pct = (index / session.length) * 100;
  const prevState = map[current.id];

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Progress value={pct} className="h-2 flex-1" />
        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
          {index + 1}/{session.length}
        </span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="size-4" /> Thoát
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center p-8 text-center">
          <button
            type="button"
            onClick={() => void speak(current.hanzi, { rate: 0.8 })}
            className="mb-2 flex items-center gap-1 rounded-full border px-3 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-primary"
          >
            <Volume2 className="size-4" /> Nghe
          </button>
          <span className="hanzi text-6xl font-semibold">{current.hanzi}</span>

          {mode === "flashcard" ? (
            <div className="mt-6 w-full">
              {revealed ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-lg text-primary">{current.pinyin}</p>
                    <p className="mt-1 text-lg text-muted-foreground">{current.vi}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bạn nhớ từ này ở mức nào?
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {RATINGS.map((r) => {
                      const proj = sm2(prevState, r.q).interval;
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
                            {intervalLabel(proj)}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="lg" onClick={() => setRevealed(true)}>
                  <Eye /> Hiện nghĩa
                </Button>
              )}
            </div>
          ) : (
            <div className="mt-6 w-full">
              <p className="mb-3 text-sm text-muted-foreground">Từ này nghĩa là gì?</p>
              <div className="grid gap-2">
                {options.map((opt) => {
                  const isCorrect = opt === current.vi;
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
                        state === "idle" && "border-border hover:border-primary/60 hover:bg-secondary",
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
                  <p className="text-sm text-primary">{current.pinyin}</p>
                  <p className="text-xs text-muted-foreground">
                    Sẽ ôn lại sau{" "}
                    {intervalLabel(
                      sm2(prevState, selected === current.vi ? QUALITY.GOOD : QUALITY.AGAIN).interval
                    )}
                  </p>
                  <Button onClick={advance} disabled={busy} className="w-full">
                    Tiếp theo <ArrowRight />
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
