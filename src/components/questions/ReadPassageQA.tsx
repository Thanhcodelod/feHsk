"use client";

// READ_PASSAGE_QA — reading comprehension. Render `passageText` as a reading
// panel (pinyin/translation toggles) on the left and a set of MCQ sub-questions
// on the right (two columns on large screens, stacked on mobile).
// Contract: QuestionComponentProps. options = SubQuestion[] (correctId stripped).
// Answer = JSON.stringify({ [subQId]: optionId }) when ALL answered, else null.
// Review coloring derives ONLY from `result` (breakdown + parsed correctAnswer).

import * as React from "react";
import type {
  Option,
  QuestionComponentProps,
  SubQuestion,
} from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OptionCard, type OptionState } from "@/components/practice/OptionCard";
import { PinyinText } from "@/components/practice/PinyinText";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";
import { cn } from "@/lib/utils";

export function ReadPassageQA({
  question,
  onAnswerChange,
  result,
  showPinyin,
  showTranslation,
}: QuestionComponentProps) {
  const subQuestions = (question.options as SubQuestion[]) ?? [];
  const locked = result !== null;

  // answers[subQId] = chosen Option.id
  const [answers, setAnswers] = React.useState<Record<string, string>>({});

  // Correct option id per sub-question, parsed from the grade result only.
  const correctMap = React.useMemo<Record<string, string>>(() => {
    if (!result?.correctAnswer) return {};
    try {
      const parsed = JSON.parse(result.correctAnswer) as unknown;
      return parsed && typeof parsed === "object"
        ? (parsed as Record<string, string>)
        : {};
    } catch {
      return {};
    }
  }, [result?.correctAnswer]);

  React.useEffect(() => {
    const allAnswered =
      subQuestions.length > 0 &&
      subQuestions.every((sq) => answers[sq.id] != null);
    if (allAnswered) {
      const map: Record<string, string> = {};
      for (const sq of subQuestions) map[sq.id] = answers[sq.id];
      onAnswerChange(JSON.stringify(map));
    } else {
      onAnswerChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  const pick = (subQId: string, optId: string) => {
    if (locked) return;
    setAnswers((prev) => ({ ...prev, [subQId]: optId }));
  };

  const stateFor = (subQId: string, optId: string): OptionState => {
    const selected = answers[subQId];
    if (!locked) return selected === optId ? "selected" : "idle";
    if (correctMap[subQId] === optId) return "correct";
    if (selected === optId) return "incorrect";
    return "idle";
  };

  const answeredCount = subQuestions.filter(
    (sq) => answers[sq.id] != null
  ).length;

  return (
    <div className="space-y-5">
      <QuestionPrompt>{question.questionText}</QuestionPrompt>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---- Left: reading passage ---- */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Đoạn văn
          </p>
          <Card className="max-h-[60vh] overflow-y-auto bg-secondary/30 p-5 lg:max-h-[70vh]">
            {showPinyin && question.pinyinGuide ? (
              <p className="mb-3 text-sm text-primary/80">
                {question.pinyinGuide}
              </p>
            ) : null}

            <PinyinText
              text={question.passageText ?? ""}
              pinyin={question.pinyinGuide}
              showPinyin={showPinyin}
              size="lg"
              className="leading-loose"
            />

            {showTranslation && question.meta?.translation ? (
              <p className="mt-4 border-t pt-3 text-sm italic text-muted-foreground">
                {question.meta.translation}
              </p>
            ) : null}
          </Card>
        </div>

        {/* ---- Right: comprehension questions ---- */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Câu hỏi
            </p>
            <Badge variant={locked ? "secondary" : "outline"}>
              Đã trả lời {answeredCount}/{subQuestions.length}
            </Badge>
          </div>

          {subQuestions.map((sq, sIdx) => (
            <div key={sq.id} className="space-y-3">
              <div className="flex gap-2 text-base font-medium leading-snug">
                <span className="shrink-0 text-primary">{sIdx + 1}.</span>
                <PinyinText
                  text={sq.questionText}
                  pinyin={sq.pinyin}
                  showPinyin={showPinyin}
                  size="sm"
                  className="font-medium"
                />
              </div>

              <div className="grid gap-2">
                {sq.options.map((opt: Option, oIdx) => (
                  <OptionCard
                    key={opt.id}
                    marker={String.fromCharCode(65 + oIdx)}
                    state={stateFor(sq.id, opt.id)}
                    disabled={locked}
                    onClick={() => pick(sq.id, opt.id)}
                  >
                    {opt.imageUrl ? (
                      <span className="mr-2 text-2xl">{opt.imageUrl}</span>
                    ) : null}
                    <PinyinText
                      text={opt.text}
                      pinyin={opt.pinyin}
                      showPinyin={showPinyin}
                      size="base"
                    />
                  </OptionCard>
                ))}
              </div>

              {/* Per-question review marker derived from result.breakdown */}
              {locked && result?.breakdown ? (
                <p
                  className={cn(
                    "text-sm font-medium",
                    result.breakdown[sq.id]
                      ? "text-success"
                      : "text-destructive"
                  )}
                >
                  {result.breakdown[sq.id] ? "Đúng" : "Sai"}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
