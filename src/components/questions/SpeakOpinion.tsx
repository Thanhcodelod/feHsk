"use client";

// SPEAK_OPINION (口头表达) — read an argument, prepare, then record a spoken
// opinion. Contract: QuestionComponentProps. A small state machine drives
// idle → prep (countdown) → record (Recorder). The answer is lenient/always
// credited, so we report the recognized transcript when available and fall
// back to RECORDED_MARKER. Review feedback + sample come from the parent
// FeedbackPanel via `result`; this component never reads answers off the
// question.

import * as React from "react";
import { Clock, SkipForward, Lightbulb, Mic, CheckCircle2 } from "lucide-react";
import type { QuestionComponentProps } from "@/lib/types";
import { RECORDED_MARKER } from "@/lib/types";
import { PinyinText } from "@/components/practice/PinyinText";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";
import { CountdownTimer } from "@/components/practice/CountdownTimer";
import { Recorder, type RecorderResult } from "@/components/practice/Recorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatSeconds } from "@/lib/utils";

type Phase = "idle" | "prep" | "record";

export function SpeakOpinion({
  question,
  onAnswerChange,
  result,
  showPinyin,
  showTranslation,
}: QuestionComponentProps) {
  const locked = result !== null;
  const prepSeconds = question.meta?.prepSeconds ?? 0;
  const recordSeconds = question.meta?.recordSeconds ?? 120;

  const [phase, setPhase] = React.useState<Phase>("idle");

  const handleComplete = (r: RecorderResult) => {
    // Lenient grading: transcript if recognized, otherwise the recorded marker.
    onAnswerChange(r.transcript.trim() || RECORDED_MARKER);
  };

  const handleRecordingChange = (recording: boolean) => {
    // While (re)recording the answer is not ready yet.
    if (recording) onAnswerChange(null);
  };

  return (
    <div className="space-y-5">
      <QuestionPrompt>{question.questionText}</QuestionPrompt>

      {/* The argument text to read and react to */}
      {question.passageText ? (
        <Card>
          <CardContent className="space-y-2 p-4 sm:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Nội dung đề bài
            </p>
            <PinyinText
              text={question.passageText}
              pinyin={question.pinyinGuide}
              showPinyin={showPinyin}
              translation={question.meta?.translation}
              showTranslation={showTranslation}
              size="lg"
              className="block"
            />
          </CardContent>
        </Card>
      ) : null}

      <Separator />

      {locked ? (
        // Read-only review: parent FeedbackPanel renders feedback + sample.
        <div className="flex items-start gap-2 rounded-xl border border-success/40 bg-success/10 p-4 text-sm text-foreground">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
          <p>
            Đã ghi nhận phần trình bày của bạn. Xem nhận xét và bài nói mẫu ở
            phần đánh giá bên dưới.
          </p>
        </div>
      ) : phase === "idle" ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {prepSeconds > 0
              ? `Bạn có ${formatSeconds(prepSeconds)} để chuẩn bị dàn ý, sau đó tối đa ${formatSeconds(recordSeconds)} để trình bày.`
              : `Bạn có tối đa ${formatSeconds(recordSeconds)} để trình bày quan điểm của mình.`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {prepSeconds > 0 ? (
              <>
                <Button
                  type="button"
                  size="lg"
                  onClick={() => setPhase("prep")}
                >
                  <Clock /> Bắt đầu chuẩn bị ({formatSeconds(prepSeconds)})
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPhase("record")}
                >
                  <SkipForward /> Bỏ qua chuẩn bị
                </Button>
              </>
            ) : (
              <Button type="button" size="lg" onClick={() => setPhase("record")}>
                <Mic /> Bắt đầu nói
              </Button>
            )}
          </div>
        </div>
      ) : phase === "prep" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <CountdownTimer
              seconds={prepSeconds}
              running
              label="Chuẩn bị"
              onComplete={() => setPhase("record")}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPhase("record")}
            >
              <Mic /> Bắt đầu nói ngay
            </Button>
          </div>
          <div className="flex items-start gap-2 rounded-lg border bg-secondary/40 p-3 text-sm text-muted-foreground">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" />
            <p>
              Hãy phác thảo nhanh: nêu lập trường, chuẩn bị 2–3 lý do kèm ví dụ,
              rồi một câu kết luận.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Nhấn ghi âm và trình bày quan điểm của bạn (tối đa{" "}
            {formatSeconds(recordSeconds)}).
          </p>
          <Recorder
            recognize
            maxSeconds={recordSeconds}
            onRecordingChange={handleRecordingChange}
            onComplete={handleComplete}
          />
        </div>
      )}
    </div>
  );
}
