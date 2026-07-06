"use client";

import * as React from "react";
import Link from "next/link";
import {
  Loader2,
  Home,
  ChevronRight,
  Volume2,
  Check,
  X,
  ArrowRight,
  RotateCcw,
  Trophy,
  Eye,
  Shuffle,
  Lightbulb,
  Lock,
  List,
  LayoutGrid,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { LessonSidebar } from "@/components/vocab/LessonSidebar";
import { apiGetVocab, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { submitReview } from "@/lib/vocab-srs";
import { QUALITY } from "@/lib/sm2";
import { speak, stopSpeaking } from "@/lib/speech";
import { normalizeChinese, normalizePinyin } from "@/lib/similarity";
import { shuffleClient, cn } from "@/lib/utils";
import { chunkLessons } from "@/lib/lessons";
import { VOCAB_SOURCE_META } from "@/lib/labels";
import {
  modeBySlug,
  buildQuestions,
  type McqQuestion,
} from "@/lib/vocab-modes";
import type { VocabWord } from "@/lib/types";

export function VocabPractice({
  source,
  group,
  lesson,
  mode,
  basePath,
}: {
  source: string;
  group: string;
  lesson: number;
  mode: string;
  basePath: string;
}) {
  const { user } = useAuth();
  const [words, setWords] = React.useState<VocabWord[] | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    apiGetVocab({ source, group })
      .then(setWords)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Không tải được từ vựng.")
      );
    return () => stopSpeaking();
  }, [source, group]);

  const meta =
    VOCAB_SOURCE_META[source] ?? { label: source, description: "", emoji: "📖" };
  const modeDef = modeBySlug(mode);
  const lessons = React.useMemo(
    () => (words ? chunkLessons(words) : []),
    [words]
  );
  const current = lessons.find((l) => l.num === lesson);

  const questions = React.useMemo(() => {
    if (!current || !modeDef) return [];
    const kind = modeDef.kind;
    if (["meaning", "pinyin", "word", "listening", "mixed"].includes(kind)) {
      return buildQuestions(kind, current.words, words ?? []);
    }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, mode]);

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }
  if (!words || !modeDef) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" /> Đang tải…
      </div>
    );
  }
  if (!current) {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        Không tìm thấy bài {lesson}.
      </div>
    );
  }

  const groupPath = `${basePath}/${encodeURIComponent(group)}`;
  const kind = modeDef.kind;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground">
          <Home className="size-3.5" />
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={basePath} className="hover:text-foreground">{meta.label}</Link>
        <ChevronRight className="size-3.5" />
        <Link href={`${groupPath}/${lesson}`} className="hover:text-foreground">
          Bài {lesson}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">{modeDef.label}</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div>
          {kind === "flashcard" ? (
            <FlashcardRunner words={current.words} useServer={!!user} lessonLabel={`Bài ${lesson}`} />
          ) : kind === "typing" ? (
            <TypingRunner words={current.words} modeLabel={modeDef.label} useServer={!!user} />
          ) : kind === "matching" ? (
            <MatchingRunner words={current.words} modeLabel={modeDef.label} useServer={!!user} />
          ) : kind === "soon" ? (
            <SoonNote label={modeDef.label} backHref={`${groupPath}/${lesson}`} />
          ) : (
            <McqRunner
              questions={questions}
              modeLabel={modeDef.label}
              backHref={`${groupPath}/${lesson}`}
              useServer={!!user}
            />
          )}
        </div>

        <LessonSidebar
          basePath={basePath}
          group={group}
          levelLabel={group}
          currentLesson={lesson}
          currentMode={mode}
          lessons={lessons.map((l) => ({ num: l.num, count: l.words.length }))}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MCQ runner (Chọn nghĩa / Chọn phiên âm / Chọn từ / Luyện nghe / Tổng hợp)
// ---------------------------------------------------------------------------

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function McqRunner({
  questions,
  modeLabel,
  backHref,
  useServer,
}: {
  questions: McqQuestion[];
  modeLabel: string;
  backHref: string;
  useServer: boolean;
}) {
  const [view, setView] = React.useState<"step" | "all">("step");
  const [index, setIndex] = React.useState(0);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [checked, setChecked] = React.useState(false);
  const [correct, setCorrect] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const q = questions[index];

  React.useEffect(() => {
    if (q?.audioText && view === "step" && !checked) {
      void speak(q.audioText, { rate: 0.85 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, view]);

  if (!questions.length) {
    return <p className="text-muted-foreground">Chưa có dữ liệu luyện tập.</p>;
  }

  if (done) {
    return (
      <Card className="text-center">
        <CardContent className="p-8">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Trophy className="size-8" />
          </div>
          <h3 className="mt-4 text-2xl font-bold">Hoàn thành!</h3>
          <p className="mt-1 text-muted-foreground">
            Đúng {correct}/{questions.length} câu.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button
              onClick={() => {
                setIndex(0);
                setSelected(null);
                setChecked(false);
                setCorrect(0);
                setDone(false);
              }}
            >
              <RotateCcw /> Làm lại
            </Button>
            <Link href={backHref}>
              <Button variant="outline">Về danh sách từ</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pct = Math.round((index / questions.length) * 100);

  const check = () => {
    if (selected == null) return;
    setChecked(true);
    const ok = selected === q.answer;
    if (ok) setCorrect((c) => c + 1);
    // Record into the per-account vocab SRS (server when logged in, else local).
    void submitReview(useServer, q.id, ok ? QUALITY.GOOD : QUALITY.AGAIN);
  };
  const next = () => {
    if (index + 1 >= questions.length) setDone(true);
    else {
      setIndex((i) => i + 1);
      setSelected(null);
      setChecked(false);
    }
  };

  const optState = (opt: string) => {
    if (!checked) return selected === opt ? "selected" : "idle";
    if (opt === q.answer) return "correct";
    if (opt === selected) return "wrong";
    return "idle";
  };

  return (
    <div className="space-y-3">
      {/* top bar: view toggle + counter */}
      <div className="flex items-center justify-end gap-2">
        <div className="flex overflow-hidden rounded-lg border text-sm">
          <button
            type="button"
            onClick={() => setView("step")}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5",
              view === "step" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
            )}
          >
            <List className="size-3.5" /> Hiện từng câu
          </button>
          <button
            type="button"
            onClick={() => setView("all")}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5",
              view === "all" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
            )}
          >
            <LayoutGrid className="size-3.5" /> Hiện tất cả
          </button>
        </div>
        <Badge variant="secondary">
          {index + 1} / {questions.length}
        </Badge>
      </div>

      {view === "all" ? (
        <div className="space-y-3">
          {questions.map((qq, i) => (
            <Card key={qq.id + i}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{qq.instruction}</p>
                <div className="mt-1 flex items-center gap-2">
                  {qq.promptMain ? (
                    <span className={cn(qq.promptMainHanzi && "hanzi", "text-xl font-semibold")}>
                      {qq.promptMain}
                    </span>
                  ) : null}
                  {qq.promptSub ? (
                    <span className="text-sm text-primary">{qq.promptSub}</span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm">
                  Đáp án:{" "}
                  <span className={cn(qq.optionsHanzi && "hanzi", "font-semibold text-success")}>
                    {qq.answer}
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-5">
            {/* header */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Chế độ luyện
                </p>
                <h2 className="text-xl font-bold">{modeLabel}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{q.instruction}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">Câu {index + 1}/{questions.length}</Badge>
                <Badge variant="outline">{pct}% tiến độ</Badge>
              </div>
            </div>

            {/* prompt card */}
            <div className="mt-4 flex flex-col items-center rounded-xl border bg-secondary/20 p-6 text-center">
              {q.tag ? (
                <span className="mb-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {q.tag}
                </span>
              ) : null}
              {q.hiddenPrompt && !checked ? (
                <button
                  type="button"
                  onClick={() => q.audioText && void speak(q.audioText, { rate: 0.8 })}
                  className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <Volume2 className="size-9" />
                </button>
              ) : q.promptMain ? (
                <div className="flex items-center gap-2">
                  <span className={cn(q.promptMainHanzi && "hanzi", "text-5xl font-bold")}>
                    {q.promptMain}
                  </span>
                  {q.audioText ? (
                    <button
                      type="button"
                      onClick={() => void speak(q.audioText!, { rate: 0.8 })}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-card hover:text-primary"
                    >
                      <Volume2 className="size-5" />
                    </button>
                  ) : null}
                </div>
              ) : null}
              {q.promptSub ? (
                <p className="mt-1 text-lg italic text-primary">{q.promptSub}</p>
              ) : null}
              {checked && q.revealAfter ? (
                <p className="hanzi mt-2 text-sm text-muted-foreground">{q.revealAfter}</p>
              ) : null}
            </div>

            {/* options */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {q.options.map((opt, i) => {
                const st = optState(opt);
                return (
                  <button
                    key={opt + i}
                    type="button"
                    disabled={checked}
                    onClick={() => setSelected(opt)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-colors",
                      st === "idle" && "border-border hover:border-primary/50 hover:bg-secondary",
                      st === "selected" && "border-primary bg-primary/5 ring-1 ring-primary",
                      st === "correct" && "border-success bg-success/10",
                      st === "wrong" && "border-destructive bg-destructive/10"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        st === "correct"
                          ? "bg-success text-success-foreground"
                          : st === "wrong"
                            ? "bg-destructive text-destructive-foreground"
                            : st === "selected"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {LETTERS[i]}
                    </span>
                    <span className={cn(q.optionsHanzi && "hanzi text-xl", "flex-1")}>
                      {opt}
                    </span>
                    {st === "correct" ? <Check className="size-5 text-success" /> : null}
                    {st === "wrong" ? <X className="size-5 text-destructive" /> : null}
                  </button>
                );
              })}
            </div>

            {/* hint */}
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent/10 p-2.5 text-sm text-muted-foreground">
              <Lightbulb className="size-4 shrink-0 text-accent" />
              Loại trừ các đáp án gần giống trước, rồi mới chốt.
            </div>

            {/* action */}
            <div className="mt-4 flex justify-end">
              {!checked ? (
                <Button size="lg" onClick={check} disabled={selected == null} className="min-w-40">
                  <Check /> Kiểm tra
                </Button>
              ) : (
                <Button size="lg" onClick={next} className="min-w-40">
                  {index + 1 >= questions.length ? "Hoàn thành" : "Câu tiếp theo"}{" "}
                  <ArrowRight />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Flashcard runner (matches hihsk flashcard)
// ---------------------------------------------------------------------------

function FlashcardRunner({
  words,
  useServer,
  lessonLabel,
}: {
  words: VocabWord[];
  useServer: boolean;
  lessonLabel: string;
}) {
  const [deck, setDeck] = React.useState<VocabWord[]>(() => words);
  const [index, setIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [known, setKnown] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const w = deck[index];
  React.useEffect(() => {
    if (w) void speak(w.hanzi, { rate: 0.8 });
  }, [w]);

  const rate = async (isKnown: boolean) => {
    if (!w) return;
    void submitReview(useServer, w.id, isKnown ? QUALITY.GOOD : QUALITY.AGAIN);
    if (isKnown) setKnown((k) => k + 1);
    if (index + 1 >= deck.length) setDone(true);
    else {
      setIndex((i) => i + 1);
      setFlipped(false);
    }
  };
  const restart = (shuffle?: boolean) => {
    setDeck(shuffle ? shuffleClient(words) : words);
    setIndex(0);
    setFlipped(false);
    setKnown(0);
    setDone(false);
  };

  if (done) {
    return (
      <Card className="text-center">
        <CardContent className="p-8">
          <Trophy className="mx-auto size-10 text-success" />
          <h3 className="mt-3 text-2xl font-bold">Xong {lessonLabel}!</h3>
          <p className="mt-1 text-muted-foreground">Đã thuộc {known}/{deck.length} thẻ.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button onClick={() => restart(true)}>
              <RotateCcw /> Học lại
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (!w) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-3 text-sm">
        <Badge variant="success">✓ {known}</Badge>
        <span className="text-muted-foreground">{deck.length - index} còn lại</span>
        <button
          type="button"
          onClick={() => restart(true)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
          aria-label="Trộn bài"
        >
          <Shuffle className="size-4" />
        </button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center p-8">
          {/* hanzi boxes */}
          <div className="flex gap-2">
            {[...w.hanzi].map((c, i) => (
              <span
                key={i}
                className="hanzi flex size-20 items-center justify-center rounded-lg border-2 border-dashed text-5xl font-semibold"
              >
                {c}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xl font-medium text-primary">{w.pinyin}</p>

          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="mt-4 w-full max-w-sm rounded-xl border bg-secondary/30 p-4 text-center transition-colors hover:bg-secondary/50"
          >
            {flipped ? (
              <span className="text-lg">{w.vi}</span>
            ) : (
              <span className="text-sm text-muted-foreground">
                <Eye className="mr-1 inline size-4" /> Nhấn để xem nghĩa
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => void speak(w.hanzi, { rate: 0.8 })}
            className="mt-4 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            aria-label="Nghe"
          >
            <Volume2 className="size-5" />
          </button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="destructive" size="lg" onClick={() => rate(false)}>
          <X /> Chưa thuộc
        </Button>
        <Button variant="success" size="lg" onClick={() => rate(true)}>
          <Check /> Đã thuộc
        </Button>
      </div>
      <div className="flex justify-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => restart(false)}>
          <RotateCcw className="size-4" /> Học lại
        </Button>
        <Button variant="ghost" size="sm" onClick={() => restart(true)}>
          <Shuffle className="size-4" /> Trộn bài
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Typing runner (Nhập từ vựng)
// ---------------------------------------------------------------------------

function TypingRunner({
  words,
  modeLabel,
  useServer,
}: {
  words: VocabWord[];
  modeLabel: string;
  useServer: boolean;
}) {
  const [deck] = React.useState(() => shuffleClient(words));
  const [index, setIndex] = React.useState(0);
  const [draft, setDraft] = React.useState("");
  const [result, setResult] = React.useState<null | boolean>(null);
  const [correct, setCorrect] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const w = deck[index];
  React.useEffect(() => {
    if (w) void speak(w.hanzi, { rate: 0.8 });
  }, [w]);

  if (done) {
    return (
      <Card className="text-center">
        <CardContent className="p-8">
          <Trophy className="mx-auto size-10 text-success" />
          <h3 className="mt-3 text-2xl font-bold">Hoàn thành!</h3>
          <p className="mt-1 text-muted-foreground">Đúng {correct}/{deck.length}.</p>
        </CardContent>
      </Card>
    );
  }
  if (!w) return null;

  const check = () => {
    const ok =
      normalizeChinese(draft) === normalizeChinese(w.hanzi) ||
      normalizePinyin(draft) === normalizePinyin(w.pinyin);
    setResult(ok);
    if (ok) setCorrect((c) => c + 1);
    void submitReview(useServer, w.id, ok ? QUALITY.GOOD : QUALITY.AGAIN);
  };
  const next = () => {
    setResult(null);
    setDraft("");
    if (index + 1 >= deck.length) setDone(true);
    else setIndex((i) => i + 1);
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{modeLabel}</h2>
          <Badge variant="secondary">{index + 1}/{deck.length}</Badge>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Gõ chữ Hán hoặc pinyin của từ có nghĩa dưới đây.
        </p>

        <div className="mt-4 flex flex-col items-center rounded-xl border bg-secondary/20 p-6 text-center">
          <p className="text-2xl font-semibold">{w.vi}</p>
          <button
            type="button"
            onClick={() => void speak(w.hanzi, { rate: 0.8 })}
            className="mt-2 rounded-full p-1.5 text-muted-foreground hover:bg-card hover:text-primary"
          >
            <Volume2 className="size-5" />
          </button>
        </div>

        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={result !== null}
          placeholder="Gõ chữ Hán / pinyin…"
          className="mt-4 text-center text-lg"
          onKeyDown={(e) => {
            if (e.key === "Enter" && result === null && draft) check();
          }}
        />

        {result !== null ? (
          <div
            className={cn(
              "mt-3 rounded-lg p-3 text-center",
              result ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}
          >
            {result ? "Chính xác! 🎉" : "Chưa đúng."} Đáp án:{" "}
            <span className="hanzi font-semibold">{w.hanzi}</span> ({w.pinyin})
          </div>
        ) : null}

        <div className="mt-4 flex justify-end">
          {result === null ? (
            <Button onClick={check} disabled={!draft}>
              <Check /> Kiểm tra
            </Button>
          ) : (
            <Button onClick={next}>
              {index + 1 >= deck.length ? "Hoàn thành" : "Tiếp theo"} <ArrowRight />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Matching runner (Nối từ)
// ---------------------------------------------------------------------------

function MatchingRunner({
  words,
  modeLabel,
  useServer,
}: {
  words: VocabWord[];
  modeLabel: string;
  useServer: boolean;
}) {
  const groups = React.useMemo(() => {
    const out: VocabWord[][] = [];
    const shuffled = shuffleClient(words);
    for (let i = 0; i < shuffled.length; i += 5) out.push(shuffled.slice(i, i + 5));
    return out;
  }, [words]);

  const [gi, setGi] = React.useState(0);
  const [rights, setRights] = React.useState<VocabWord[]>([]);
  const [selLeft, setSelLeft] = React.useState<string | null>(null);
  const [matched, setMatched] = React.useState<Record<string, boolean>>({});
  const [done, setDone] = React.useState(false);

  const group = groups[gi] ?? [];
  React.useEffect(() => {
    setRights(shuffleClient(group));
    setSelLeft(null);
    setMatched({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gi, words]);

  const allMatched = group.length > 0 && group.every((w) => matched[w.id]);

  if (done) {
    return (
      <Card className="text-center">
        <CardContent className="p-8">
          <Trophy className="mx-auto size-10 text-success" />
          <h3 className="mt-3 text-2xl font-bold">Hoàn thành nối từ!</h3>
        </CardContent>
      </Card>
    );
  }

  const clickRight = (r: VocabWord) => {
    if (!selLeft || matched[r.id]) return;
    if (r.id === selLeft) {
      setMatched((m) => ({ ...m, [r.id]: true }));
      // A correct match counts as a successful review for that word.
      void submitReview(useServer, r.id, QUALITY.GOOD);
    }
    setSelLeft(null);
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{modeLabel}</h2>
          <Badge variant="secondary">Nhóm {gi + 1}/{groups.length}</Badge>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Chọn chữ Hán rồi chọn nghĩa tương ứng để nối.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-2">
            {group.map((w) => (
              <button
                key={w.id}
                type="button"
                disabled={matched[w.id]}
                onClick={() => setSelLeft(w.id)}
                className={cn(
                  "hanzi flex w-full items-center justify-center rounded-lg border-2 p-3 text-xl",
                  matched[w.id]
                    ? "border-success bg-success/10 text-success"
                    : selLeft === w.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-secondary"
                )}
              >
                {w.hanzi}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {rights.map((w) => (
              <button
                key={w.id}
                type="button"
                disabled={matched[w.id]}
                onClick={() => clickRight(w)}
                className={cn(
                  "w-full rounded-lg border-2 p-3 text-left text-sm",
                  matched[w.id]
                    ? "border-success bg-success/10 text-success"
                    : "border-border hover:bg-secondary"
                )}
              >
                {w.vi}
              </button>
            ))}
          </div>
        </div>

        {allMatched ? (
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => {
                if (gi + 1 >= groups.length) setDone(true);
                else setGi((g) => g + 1);
              }}
            >
              {gi + 1 >= groups.length ? "Hoàn thành" : "Nhóm tiếp theo"} <ArrowRight />
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SoonNote({ label, backHref }: { label: string; backHref: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
        <Lock className="size-8 text-muted-foreground" />
        <h3 className="text-lg font-bold">{label}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Chế độ này cần dữ liệu bổ sung (ví dụ câu mẫu / thứ tự nét / bộ thủ theo
          từng chữ) và sẽ được thêm sau.
        </p>
        <Link href={backHref}>
          <Button variant="outline">Về danh sách từ</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
