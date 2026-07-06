"use client";

// LISTEN_PASSAGE_QA — listen to a narrated passage, then answer several
// single-choice sub-questions. Answer = JSON.stringify({ [subQId]: optId }),
// reported only once every sub-question has a pick. Review coloring derives
// from `result.breakdown` (per sub-question) and `result.correctAnswer`
// (a JSON map { [subQId]: correctOptionId }) — never from the question.

import * as React from "react";
import type {
  Option,
  QuestionComponentProps,
  SubQuestion,
} from "@/lib/types";
import { AudioButton } from "@/components/practice/AudioButton";
import { OptionCard, type OptionState } from "@/components/practice/OptionCard";
import { PinyinText } from "@/components/practice/PinyinText";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";
import { Badge } from "@/components/ui/badge";

const MARKERS = ["A", "B", "C", "D", "E", "F"];

export function ListenPassageQA({
  question,
  onAnswerChange,
  result,
  showPinyin,
  showTranslation,
}: QuestionComponentProps) {
  const subQuestions = (question.options as SubQuestion[]) ?? [];
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const locked = result !== null;

  // Parse the correct { subQId: correctOptionId } map from the grade result.
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
  }, [result]);

  // Report the answer only when every sub-question has been answered.
  React.useEffect(() => {
    const allAnswered =
      subQuestions.length > 0 &&
      subQuestions.every((sq) => answers[sq.id] !== undefined);
    onAnswerChange(allAnswered ? JSON.stringify(answers) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  const pick = (subId: string, optId: string) => {
    if (locked) return;
    setAnswers((prev) => ({ ...prev, [subId]: optId }));
  };

  const stateFor = (subQ: SubQuestion, opt: Option): OptionState => {
    if (!locked) return answers[subQ.id] === opt.id ? "selected" : "idle";
    if (opt.id === correctMap[subQ.id]) return "correct";
    if (opt.id === answers[subQ.id]) return "incorrect";
    return "idle";
  };

  return (
    <div className="space-y-6">
      <QuestionPrompt>{question.questionText}</QuestionPrompt>

      <div className="flex flex-col items-center gap-2">
        <AudioButton text={question.audioText ?? ""} label="Nghe đoạn văn" />
        {showPinyin && question.pinyinGuide ? (
          <p className="text-center text-sm text-primary/80">
            {question.pinyinGuide}
          </p>
        ) : null}
        {showTranslation && question.meta?.translation ? (
          <p className="max-w-prose text-center text-sm italic text-muted-foreground">
            {question.meta.translation}
          </p>
        ) : null}
      </div>

      <ol className="space-y-5">
        {subQuestions.map((subQ, sIdx) => {
          const subCorrect = locked
            ? result?.breakdown?.[subQ.id] ?? false
            : null;

          return (
            <li
              key={subQ.id}
              className="rounded-xl border bg-card p-4 shadow-sm sm:p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold leading-snug text-foreground">
                  <span className="mr-1.5 text-muted-foreground">
                    Câu {sIdx + 1}.
                  </span>
                  {subQ.questionText}
                </h3>
                {locked ? (
                  <Badge variant={subCorrect ? "success" : "destructive"}>
                    {subCorrect ? "Đúng" : "Sai"}
                  </Badge>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {subQ.options.map((opt, oIdx) => (
                  <OptionCard
                    key={opt.id}
                    marker={MARKERS[oIdx] ?? String(oIdx + 1)}
                    state={stateFor(subQ, opt)}
                    disabled={locked}
                    onClick={() => pick(subQ.id, opt.id)}
                  >
                    <PinyinText
                      text={opt.text}
                      pinyin={opt.pinyin}
                      showPinyin={showPinyin}
                      size="base"
                    />
                  </OptionCard>
                ))}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
