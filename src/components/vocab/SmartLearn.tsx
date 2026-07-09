"use client";

import * as React from "react";
import {
  Volume2,
  X,
  RotateCcw,
  Trophy,
  Loader2,
  Cloud,
  HardDrive,
  Keyboard,
  Check,
  X as XIcon,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { speak } from "@/lib/speech";
import { shuffleClient, cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { submitReview } from "@/lib/vocab-srs";
import { normalizeChinese } from "@/lib/similarity";
import { MasteryRing, levelName } from "@/components/vocab/MasteryRing";
import {
  applyResult,
  buildLearnQueue,
  exerciseForLevel,
  nextLevelOnAnswer,
  qualityForResult,
  qualityForFlashcard,
  FLASHCARD_TARGET,
  EXERCISE_TITLES,
  MASTER_LEVEL,
  type ExerciseType,
  type LearnCard,
} from "@/lib/smart-learn";
import type { VocabWord } from "@/lib/types";

const SESSION_SIZE = 10;
const AUTO_ADVANCE_MS = 750;

// ---- exercise content -------------------------------------------------------
type Exercise =
  | { type: "flashcard"; word: VocabWord }
  | { type: "typing"; word: VocabWord }
  | {
      type: "truefalse";
      word: VocabWord;
      shownMeaning: string;
      isMatch: boolean;
    }
  | {
      type: "choose-meaning" | "listen-meaning" | "choose-word" | "listen-word";
      word: VocabWord;
      options: string[];
      answer: string;
      optionsHanzi: boolean;
      listen: boolean;
    }
  | {
      type: "meaning-audio";
      word: VocabWord;
      choices: VocabWord[];
      answerId: string;
    };

function pickDistinct<T>(pool: T[], n: number, taken: T[]): T[] {
  const set = new Set(taken);
  const out: T[] = [];
  for (const x of shuffleClient(pool)) {
    if (out.length >= n) break;
    if (!set.has(x)) {
      set.add(x);
      out.push(x);
    }
  }
  return out;
}

function buildExercise(card: LearnCard, pool: VocabWord[]): Exercise {
  const w = card.word;
  const type = exerciseForLevel(card.level, card.seen);
  switch (type) {
    case "flashcard":
      return { type: "flashcard", word: w };
    case "typing":
      return { type: "typing", word: w };
    case "truefalse": {
      const isMatch = Math.random() < 0.5;
      let shown = w.vi;
      if (!isMatch) {
        const others = pool.filter((x) => x.id !== w.id && x.vi !== w.vi);
        shown = others.length
          ? shuffleClient(others)[0].vi
          : w.vi; // fallback: tiny pool → force a match
      }
      return {
        type: "truefalse",
        word: w,
        shownMeaning: shown,
        isMatch: shown === w.vi,
      };
    }
    case "choose-meaning":
    case "listen-meaning": {
      const viPool = pool.map((x) => x.vi);
      const options = shuffleClient([
        w.vi,
        ...pickDistinct(viPool, 3, [w.vi]),
      ]);
      return {
        type,
        word: w,
        options,
        answer: w.vi,
        optionsHanzi: false,
        listen: type === "listen-meaning",
      };
    }
    case "choose-word":
    case "listen-word": {
      const hanziPool = pool.map((x) => x.hanzi);
      const options = shuffleClient([
        w.hanzi,
        ...pickDistinct(hanziPool, 3, [w.hanzi]),
      ]);
      return {
        type,
        word: w,
        options,
        answer: w.hanzi,
        optionsHanzi: true,
        listen: type === "listen-word",
      };
    }
    case "meaning-audio": {
      const others = pickDistinct(
        pool.filter((x) => x.id !== w.id),
        3,
        []
      );
      const choices = shuffleClient([w, ...others]);
      return { type: "meaning-audio", word: w, choices, answerId: w.id };
    }
  }
}

const KEYCAP =
  "flex size-6 shrink-0 items-center justify-center rounded-md bg-black/20 text-[11px] font-bold";

// ---- component --------------------------------------------------------------
export function SmartLearn({
  words,
  onClose,
}: {
  words: VocabWord[];
  onClose: () => void;
}) {
  const { user } = useAuth();
  const useServer = !!user;

  const [queue, setQueue] = React.useState<LearnCard[]>([]);
  const [pool, setPool] = React.useState<VocabWord[]>([]);
  const [total, setTotal] = React.useState(0);
  const [masteredCount, setMasteredCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [done, setDone] = React.useState(false);
  const [step, setStep] = React.useState(0);

  // per-question answer state
  const [flipped, setFlipped] = React.useState(false);
  const [selectedIdx, setSelectedIdx] = React.useState<number | null>(null);
  const [tfAnswer, setTfAnswer] = React.useState<boolean | null>(null);
  const [input, setInput] = React.useState("");
  const [hint, setHint] = React.useState(0);
  const [answered, setAnswered] = React.useState(false);
  const [correct, setCorrect] = React.useState(false);

  const advanceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = React.useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    const batch = shuffleClient(words).slice(0, SESSION_SIZE);
    setPool(batch);
    setQueue(buildLearnQueue(batch));
    setTotal(batch.length);
    setMasteredCount(0);
    setDone(false);
    setStep(0);
    resetAnswer();
    setLoading(false);
  }, [words]);

  React.useEffect(() => {
    start();
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, [start]);

  const current = queue[0];
  const exercise = React.useMemo(
    () => (current ? buildExercise(current, pool) : null),
    // rebuild for each new card view (step) — pool is stable per session
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, current?.word.id, loading]
  );

  function resetAnswer() {
    setFlipped(false);
    setSelectedIdx(null);
    setTfAnswer(null);
    setInput("");
    setHint(0);
    setAnswered(false);
    setCorrect(false);
  }

  // Auto-play audio for listening exercises + flashcard.
  React.useEffect(() => {
    if (loading || !exercise) return;
    const t = exercise.type;
    const speakWord =
      t === "flashcard" ||
      t === "listen-meaning" ||
      t === "listen-word";
    if (speakWord) void speak(exercise.word.hanzi, { rate: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, loading]);

  // Move the queue forward based on the computed new level for the front card.
  const commit = (newLevel: number) => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    const { queue: next, mastered } = applyResult(queue, newLevel);
    if (mastered) setMasteredCount((c) => c + 1);
    resetAnswer();
    setStep((s) => s + 1);
    if (next.length === 0) setDone(true);
    setQueue(next);
  };

  const scheduleAdvance = (newLevel: number, delay: number) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null;
      commit(newLevel);
    }, delay);
  };

  // ---- grading (MCQ / TF / typing) -----------------------------------------
  const gradeAnswer = (isCorrect: boolean) => {
    if (!current) return;
    setAnswered(true);
    setCorrect(isCorrect);
    void submitReview(useServer, current.word.id, qualityForResult(isCorrect));
    const newLevel = nextLevelOnAnswer(current.level, isCorrect);
    if (isCorrect) scheduleAdvance(newLevel, AUTO_ADVANCE_MS);
    // wrong answers wait for the user to acknowledge (see reveal → advance)
  };

  const rememberedNewLevel = () =>
    current ? nextLevelOnAnswer(current.level, correct) : 1;

  // ---- flashcard rating -----------------------------------------------------
  const rateFlashcard = (rating: keyof typeof FLASHCARD_TARGET) => {
    if (!current) return;
    void submitReview(useServer, current.word.id, qualityForFlashcard(rating));
    commit(FLASHCARD_TARGET[rating]);
  };

  // ---- MCQ / TF handlers ----------------------------------------------------
  const chooseOption = (idx: number) => {
    if (answered || !exercise) return;
    if (exercise.type === "meaning-audio") {
      setSelectedIdx(idx);
      gradeAnswer(exercise.choices[idx].id === exercise.answerId);
      return;
    }
    if (
      exercise.type === "choose-meaning" ||
      exercise.type === "listen-meaning" ||
      exercise.type === "choose-word" ||
      exercise.type === "listen-word"
    ) {
      setSelectedIdx(idx);
      gradeAnswer(exercise.options[idx] === exercise.answer);
    }
  };
  const answerTrueFalse = (userSaysMatch: boolean) => {
    if (answered || !exercise || exercise.type !== "truefalse") return;
    setTfAnswer(userSaysMatch);
    gradeAnswer(userSaysMatch === exercise.isMatch);
  };
  const checkTyping = () => {
    if (answered || !exercise || exercise.type !== "typing") return;
    if (!input.trim()) return;
    const u = normalizeChinese(input);
    const ok =
      u === normalizeChinese(exercise.word.hanzi) ||
      (exercise.word.traditional
        ? u === normalizeChinese(exercise.word.traditional)
        : false);
    gradeAnswer(ok);
  };

  // ---- keyboard -------------------------------------------------------------
  React.useEffect(() => {
    if (loading || done || !exercise) return;
    const onKey = (e: KeyboardEvent) => {
      const t = exercise.type;

      // acknowledge a shown (wrong or resolved) answer → next
      if (answered) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          commit(rememberedNewLevel());
        }
        return;
      }

      if (t === "flashcard") {
        if (e.key === " ") {
          e.preventDefault();
          setFlipped((f) => !f);
        } else if (flipped && e.key === "1") {
          e.preventDefault();
          rateFlashcard("known");
        } else if (flipped && e.key === "3") {
          e.preventDefault();
          rateFlashcard("partial");
        } else if (flipped && e.key === "Enter") {
          e.preventDefault();
          rateFlashcard("unknown");
        }
        return;
      }

      if (t === "typing") {
        if (e.key === "Enter") {
          e.preventDefault();
          checkTyping();
        } else if (e.key === "Shift") {
          e.preventDefault();
          setHint((h) => Math.min(h + 1, 2));
        }
        return;
      }

      if (t === "truefalse") {
        if (e.key === "1") {
          e.preventDefault();
          answerTrueFalse(false);
        } else if (e.key === "2") {
          e.preventDefault();
          answerTrueFalse(true);
        }
        return;
      }

      // MCQ (choose-meaning/word, listen-*, meaning-audio)
      if (e.key >= "1" && e.key <= "4") {
        e.preventDefault();
        chooseOption(Number(e.key) - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise, answered, flipped, input, loading, done, queue]);

  // ---- render states --------------------------------------------------------
  if (loading) {
    return (
      <div className="flex h-56 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" /> Đang chuẩn bị phiên học…
      </div>
    );
  }
  if (total === 0) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="p-8">
          <Trophy className="mx-auto size-10 text-success" />
          <h3 className="mt-3 text-xl font-bold">Không có từ để học</h3>
          <Button className="mt-4" onClick={onClose}>
            Đóng
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (done) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="p-8">
          <div className="text-5xl">🌸🌻🌷</div>
          <h3 className="mt-3 text-2xl font-bold">Hoàn thành! 🎉</h3>
          <p className="mt-1 text-muted-foreground">
            Bạn đã đưa tất cả {total} từ lên mức{" "}
            <span className="font-semibold text-amber-500">Thông thạo</span>.
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
              <RotateCcw /> Học lại
            </Button>
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (!current || !exercise) return null;

  const pct = total ? (masteredCount / total) * 100 : 0;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {/* Header: title + overall mastery progress + this word's ring */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {EXERCISE_TITLES[exercise.type]}
            </h2>
            <span className="text-xs text-muted-foreground">
              Đã thuộc {masteredCount}/{total}
            </span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
        <MasteryRing level={current.level} size={52} />
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {renderExercise(exercise)}

      <p className="text-center text-xs text-muted-foreground">
        Mỗi từ được ôn qua nhiều dạng bài; trả lời đúng để cây lớn dần tới{" "}
        <span className="text-amber-500">Thông thạo</span>.
      </p>
    </div>
  );

  // ---- exercise renderers (closures over state) -----------------------------
  function renderExercise(ex: Exercise) {
    switch (ex.type) {
      case "flashcard":
        return renderFlashcard(ex.word);
      case "truefalse":
        return renderTrueFalse(ex);
      case "typing":
        return renderTyping(ex.word);
      case "meaning-audio":
        return renderMeaningAudio(ex);
      default:
        return renderMcq(ex);
    }
  }

  function AudioButton({ text, size = "md" }: { text: string; size?: "md" | "lg" }) {
    return (
      <button
        type="button"
        onClick={() => void speak(text, { rate: 0.8 })}
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20",
          size === "lg" ? "size-16" : "size-9"
        )}
        aria-label="Nghe"
      >
        <Volume2 className={size === "lg" ? "size-7" : "size-4"} />
      </button>
    );
  }

  function renderFlashcard(w: VocabWord) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex items-center gap-2">
            <span className="hanzi text-6xl font-semibold">{w.hanzi}</span>
            <AudioButton text={w.hanzi} />
          </div>
          <p className="text-lg text-primary">{w.pinyin}</p>
          {flipped ? (
            <div className="space-y-3">
              {w.pos ? (
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs italic text-muted-foreground">
                  {w.pos}
                </span>
              ) : null}
              <p className="text-xl">{w.vi}</p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Button variant="success" onClick={() => rateFlashcard("known")}>
                  <span className={KEYCAP}>1</span> Thông thạo
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => rateFlashcard("partial")}
                >
                  <span className={KEYCAP}>3</span> Nhớ tạm
                </Button>
                <Button onClick={() => rateFlashcard("unknown")}>
                  <span className={KEYCAP}>↵</span> Chưa biết
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="lg"
              onClick={() => setFlipped(true)}
              className="text-success"
            >
              <Keyboard className="size-4" /> Lật · Nhấn Space
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderTrueFalse(ex: Extract<Exercise, { type: "truefalse" }>) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center gap-5 p-8 text-center">
          <div>
            {ex.word.pos ? (
              <span className="text-sm italic text-muted-foreground">
                ({ex.word.pos}){" "}
              </span>
            ) : null}
            <span className="text-lg">{ex.shownMeaning}</span>
          </div>
          <p className="text-sm text-success">là nghĩa của</p>
          <div className="flex items-center gap-2">
            <span className="hanzi text-4xl font-bold">{ex.word.hanzi}</span>
            <AudioButton text={ex.word.hanzi} />
          </div>
          {!answered ? (
            <div className="grid w-full grid-cols-2 gap-3 pt-2">
              <OptionButton keycap="1" onClick={() => answerTrueFalse(false)}>
                Sai
              </OptionButton>
              <OptionButton keycap="2" onClick={() => answerTrueFalse(true)}>
                Đúng
              </OptionButton>
            </div>
          ) : (
            <ResultBanner
              correct={correct}
              detail={`${ex.word.hanzi} = ${ex.word.vi}`}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  function renderMcq(
    ex: Extract<
      Exercise,
      { type: "choose-meaning" | "listen-meaning" | "choose-word" | "listen-word" }
    >
  ) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex min-h-[110px] flex-col items-center justify-center gap-2 text-center">
            {ex.listen ? (
              <AudioButton text={ex.word.hanzi} size="lg" />
            ) : ex.optionsHanzi ? (
              // choose-word: prompt is the Vietnamese meaning
              <p className="text-2xl font-semibold">{ex.word.vi}</p>
            ) : (
              // choose-meaning: prompt is the hanzi
              <div className="flex items-center gap-2">
                <span className="hanzi text-4xl font-bold">{ex.word.hanzi}</span>
                <AudioButton text={ex.word.hanzi} />
              </div>
            )}
            {answered && ex.listen ? (
              <p className="hanzi text-sm text-muted-foreground">
                {ex.word.hanzi} · {ex.word.pinyin}
              </p>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {ex.options.map((opt, i) => (
              <OptionButton
                key={opt + i}
                keycap={String(i + 1)}
                hanzi={ex.optionsHanzi}
                state={optionState(opt === ex.answer, selectedIdx === i)}
                onClick={() => chooseOption(i)}
                disabled={answered}
              >
                {opt}
              </OptionButton>
            ))}
          </div>
          {answered ? <ContinueHint /> : null}
        </CardContent>
      </Card>
    );
  }

  function renderMeaningAudio(
    ex: Extract<Exercise, { type: "meaning-audio" }>
  ) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="min-h-[70px] text-center">
            <p className="text-sm text-muted-foreground">Nghĩa</p>
            <p className="text-2xl font-semibold">{ex.word.vi}</p>
          </div>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Nghe và chọn từ có cách đọc đúng
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {ex.choices.map((c, i) => {
              const isAnswer = c.id === ex.answerId;
              const st = optionState(isAnswer, selectedIdx === i);
              return (
                <div
                  key={c.id}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border-2 p-3 transition-colors",
                    st === "idle" && "border-border",
                    st === "selected" && "border-primary bg-primary/5",
                    st === "correct" && "border-success bg-success/10",
                    st === "wrong" && "border-destructive bg-destructive/10"
                  )}
                >
                  <span className={KEYCAP}>{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => void speak(c.hanzi, { rate: 0.8 })}
                    className="inline-flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                    aria-label="Nghe"
                  >
                    <Volume2 className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={answered}
                    onClick={() => chooseOption(i)}
                    className="flex-1 rounded-lg py-2 text-sm font-medium hover:bg-secondary disabled:opacity-100"
                  >
                    {answered ? (
                      <span className="hanzi">{c.hanzi}</span>
                    ) : (
                      "Chọn"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          {answered ? <ContinueHint /> : null}
        </CardContent>
      </Card>
    );
  }

  function renderTyping(w: VocabWord) {
    const revealPinyin = hint >= 1;
    const revealChar = hint >= 2;
    return (
      <Card>
        <CardContent className="p-6">
          <div className="min-h-[70px] text-center">
            {w.pos ? (
              <span className="text-sm italic text-muted-foreground">
                ({w.pos}){" "}
              </span>
            ) : null}
            <span className="text-2xl font-semibold">{w.vi}</span>
            {revealPinyin ? (
              <p className="mt-1 text-primary">{w.pinyin}</p>
            ) : null}
            {revealChar ? (
              <p className="hanzi mt-1 text-lg text-muted-foreground">
                {w.hanzi.slice(0, 1)}…
              </p>
            ) : null}
          </div>
          <Input
            autoFocus
            value={input}
            disabled={answered}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập chữ Hán…"
            className="hanzi mt-4 h-12 text-center text-xl"
          />
          {!answered ? (
            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setHint((h) => Math.min(h + 1, 2))}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
              >
                <Lightbulb className="size-4" /> Gợi ý ({hint}) · Shift
              </button>
              <Button onClick={checkTyping} disabled={!input.trim()}>
                Kiểm tra · Enter <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : (
            <ResultBanner
              correct={correct}
              detail={`${w.hanzi} · ${w.pinyin}`}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  // ---- small presentational helpers ----------------------------------------
  function optionState(
    isAnswer: boolean,
    isSelected: boolean
  ): "idle" | "selected" | "correct" | "wrong" {
    if (!answered) return isSelected ? "selected" : "idle";
    if (isAnswer) return "correct";
    if (isSelected) return "wrong";
    return "idle";
  }

  function OptionButton({
    children,
    keycap,
    hanzi,
    state = "idle",
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    keycap: string;
    hanzi?: boolean;
    state?: "idle" | "selected" | "correct" | "wrong";
    onClick: () => void;
    disabled?: boolean;
  }) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-colors disabled:opacity-100",
          state === "idle" && "border-border hover:border-primary/50 hover:bg-secondary",
          state === "selected" && "border-primary bg-primary/5",
          state === "correct" && "border-success bg-success/10",
          state === "wrong" && "border-destructive bg-destructive/10"
        )}
      >
        <span className={KEYCAP}>{keycap}</span>
        <span className={cn("flex-1", hanzi && "hanzi text-xl")}>{children}</span>
        {state === "correct" ? <Check className="size-5 text-success" /> : null}
        {state === "wrong" ? <XIcon className="size-5 text-destructive" /> : null}
      </button>
    );
  }

  function ResultBanner({
    correct: ok,
    detail,
  }: {
    correct: boolean;
    detail: string;
  }) {
    return (
      <div className="w-full space-y-2">
        <p
          className={cn(
            "flex items-center justify-center gap-1.5 text-sm font-semibold",
            ok ? "text-success" : "text-destructive"
          )}
        >
          {ok ? (
            <>
              <Check className="size-4" /> Chính xác!
            </>
          ) : (
            <>
              <XIcon className="size-4" /> Chưa đúng
            </>
          )}
        </p>
        <p className="hanzi text-center text-sm text-muted-foreground">{detail}</p>
        {!ok ? (
          <Button className="w-full" onClick={() => commit(rememberedNewLevel())}>
            Tiếp tục · Space <ArrowRight className="size-4" />
          </Button>
        ) : null}
      </div>
    );
  }

  // Wrong MCQ answers wait for acknowledgement; correct ones auto-advance.
  function ContinueHint() {
    if (correct) return null;
    return (
      <div className="mt-4">
        <Button className="w-full" onClick={() => commit(rememberedNewLevel())}>
          Tiếp tục · Space <ArrowRight className="size-4" />
        </Button>
      </div>
    );
  }
}
