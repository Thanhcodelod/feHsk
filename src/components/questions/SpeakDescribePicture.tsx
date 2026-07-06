"use client";

// SPEAK_DESCRIBE_PICTURE (看图表达) — show a large picture (emoji) and a prompt,
// then let the user record a spoken description. The answer is the recognized
// transcript, or the RECORDED_MARKER when no transcript is available (grading is
// lenient / always credited). Review coloring/feedback + the sample answer come
// from the parent FeedbackPanel via `result`; we never read answers from the
// question itself.

import * as React from "react";
import type { QuestionComponentProps } from "@/lib/types";
import { RECORDED_MARKER } from "@/lib/types";
import { Recorder, type RecorderResult } from "@/components/practice/Recorder";
import { PinyinText } from "@/components/practice/PinyinText";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";

export function SpeakDescribePicture({
  question,
  onAnswerChange,
  result,
  showPinyin,
  showTranslation,
}: QuestionComponentProps) {
  const locked = result !== null;
  const recordSeconds = question.meta?.recordSeconds ?? 60;
  const [spoken, setSpoken] = React.useState<string>("");

  // Not ready to submit until a recording completes.
  React.useEffect(() => {
    onAnswerChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRecordingChange = (recording: boolean) => {
    // Starting a (re-)recording invalidates any previous answer.
    if (recording) onAnswerChange(null);
  };

  const handleComplete = (r: RecorderResult) => {
    const transcript = r.transcript && r.transcript.trim() ? r.transcript : "";
    setSpoken(transcript);
    onAnswerChange(transcript ? transcript : RECORDED_MARKER);
  };

  return (
    <div className="space-y-5">
      <QuestionPrompt>{question.questionText}</QuestionPrompt>

      {/* Large picture (emoji) */}
      <div className="flex flex-col items-center gap-3">
        {question.imageUrl ? (
          <div className="flex aspect-square w-full max-w-xs items-center justify-center rounded-2xl border bg-secondary/40">
            <span
              className="select-none leading-none text-[7rem] sm:text-[9rem]"
              role="img"
              aria-label="Hình miêu tả"
            >
              {question.imageUrl}
            </span>
          </div>
        ) : null}

        {showTranslation && question.meta?.translation ? (
          <p className="max-w-md text-center text-sm italic text-muted-foreground">
            {question.meta.translation}
          </p>
        ) : null}
      </div>

      {/* Recording (hidden in review mode) */}
      {!locked ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Nhấn ghi âm rồi nói 2–3 câu miêu tả bức tranh (tối đa{" "}
            {recordSeconds} giây).
          </p>
          <Recorder
            recognize
            maxSeconds={recordSeconds}
            onRecordingChange={handleRecordingChange}
            onComplete={handleComplete}
          />
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Phần nói của bạn
          </p>
          {spoken ? (
            <PinyinText
              text={spoken}
              showPinyin={showPinyin}
              size="base"
              className="mt-1"
            />
          ) : (
            <p className="mt-1 text-sm italic text-muted-foreground">
              Đã ghi âm xong. Hãy xem câu mẫu và nhận xét bên dưới để so sánh.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
