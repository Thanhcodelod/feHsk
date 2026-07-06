"use client";

// SPEAK_REPEAT (听读跟读) — listen to a model sentence, then repeat it aloud.
// Contract: QuestionComponentProps. Records the learner's speech (with speech
// recognition when available), reports the recognized transcript as the answer
// (or RECORDED_MARKER when no transcript was captured), and — once graded —
// shows a per-character match highlight against the target sentence. Review
// state is derived only from `result`; the target itself is shown by the parent
// FeedbackPanel via result.correctAnswer.

import * as React from "react";
import { RECORDED_MARKER, type QuestionComponentProps } from "@/lib/types";
import { AudioButton } from "@/components/practice/AudioButton";
import { PinyinText } from "@/components/practice/PinyinText";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";
import { Recorder, type RecorderResult } from "@/components/practice/Recorder";
import { charMatches } from "@/lib/similarity";
import { cn } from "@/lib/utils";

export function SpeakRepeat({
  question,
  onAnswerChange,
  result,
  showPinyin,
  showTranslation,
}: QuestionComponentProps) {
  const target = question.audioText ?? "";
  const [transcript, setTranscript] = React.useState("");
  const locked = result !== null;

  const handleRecordingChange = (recording: boolean) => {
    // Not ready to submit until a recording actually completes.
    if (recording) onAnswerChange(null);
  };

  const handleComplete = (r: RecorderResult) => {
    const spoken = r.transcript && r.transcript.trim() ? r.transcript : null;
    setTranscript(spoken ?? "");
    onAnswerChange(spoken ?? RECORDED_MARKER);
  };

  const matches = React.useMemo(
    () => (locked && transcript.trim() ? charMatches(target, transcript) : null),
    [locked, transcript, target]
  );

  return (
    <div className="space-y-5">
      <QuestionPrompt>{question.questionText}</QuestionPrompt>

      {/* Model sentence: listen + read along */}
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-secondary/30 p-5 text-center">
        <AudioButton text={target} label="Nghe câu mẫu" />
        <PinyinText
          text={target}
          pinyin={question.pinyinGuide}
          translation={question.meta?.translation ?? null}
          showPinyin={showPinyin}
          showTranslation={showTranslation}
          size="xl"
        />
      </div>

      {/* Recorder — repeat the sentence aloud */}
      {locked ? (
        <p className="text-sm text-muted-foreground">
          Đã nộp phần ghi âm. Xem nhận xét phát âm bên dưới.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Nhấn ghi âm rồi đọc lại câu trên thật rõ ràng và đúng thanh điệu.
          </p>
          <Recorder
            recognize
            maxSeconds={20}
            onRecordingChange={handleRecordingChange}
            onTranscriptChange={setTranscript}
            onComplete={handleComplete}
          />
        </div>
      )}

      {/* Review: per-character match highlight against the target */}
      {matches ? (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Đối chiếu phát âm theo từng chữ
          </p>
          <p className="hanzi mt-2 text-3xl leading-relaxed">
            {matches.map((m, i) => (
              <span
                key={i}
                className={cn(
                  m.matched
                    ? "font-semibold text-success"
                    : "text-muted-foreground/70"
                )}
              >
                {m.char}
              </span>
            ))}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Chữ màu xanh là những chữ bạn đã đọc khớp với câu mẫu.
          </p>
        </div>
      ) : null}
    </div>
  );
}
