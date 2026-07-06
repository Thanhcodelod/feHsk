"use client";

import * as React from "react";
import { Mic, Square, Play, Pause, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatSeconds } from "@/lib/utils";
import {
  isRecordingSupported,
  startRecording,
  type RecorderController,
} from "@/lib/recorder";
import {
  isSpeechRecognitionSupported,
  startRecognition,
  type RecognitionHandle,
} from "@/lib/speech";

export interface RecorderResult {
  blob: Blob | null;
  url: string | null;
  transcript: string;
  durationSec: number;
}

export interface RecorderProps {
  /** Also run SpeechRecognition to capture a transcript while recording. */
  recognize?: boolean;
  recognizeLang?: string;
  /** Auto-stop after this many seconds. */
  maxSeconds?: number;
  /** External control: when this flips to false, recording stops. */
  onRecordingChange?: (recording: boolean) => void;
  onComplete?: (result: RecorderResult) => void;
  onTranscriptChange?: (transcript: string) => void;
  className?: string;
  compact?: boolean;
}

const BARS = 40;

export function Recorder({
  recognize = false,
  recognizeLang = "zh-CN",
  maxSeconds,
  onRecordingChange,
  onComplete,
  onTranscriptChange,
  className,
  compact = false,
}: RecorderProps) {
  const [state, setState] = React.useState<
    "idle" | "recording" | "recorded" | "unsupported" | "error"
  >("idle");
  const [levels, setLevels] = React.useState<number[]>(() =>
    new Array(BARS).fill(0.05)
  );
  const [elapsed, setElapsed] = React.useState(0);
  const [transcript, setTranscript] = React.useState("");
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  const controllerRef = React.useRef<RecorderController | null>(null);
  const recognitionRef = React.useRef<RecognitionHandle | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const startedAtRef = React.useRef(0);
  const transcriptRef = React.useRef("");

  React.useEffect(() => {
    if (!isRecordingSupported()) setState("unsupported");
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    recognitionRef.current?.stop();
    controllerRef.current?.cancel();
  };

  const tickWaveform = () => {
    const c = controllerRef.current;
    if (!c) return;
    const level = c.getLevel();
    setLevels((prev) => {
      const next = prev.slice(1);
      next.push(Math.max(0.05, level));
      return next;
    });
    rafRef.current = requestAnimationFrame(tickWaveform);
  };

  const stop = React.useCallback(async () => {
    if (state !== "recording") return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    recognitionRef.current?.stop();
    onRecordingChange?.(false);

    const controller = controllerRef.current;
    let blob: Blob | null = null;
    if (controller) {
      try {
        blob = await controller.stop();
      } catch {
        blob = null;
      }
    }
    const url = blob ? URL.createObjectURL(blob) : null;
    setAudioUrl(url);
    setState("recorded");
    const durationSec = (Date.now() - startedAtRef.current) / 1000;
    onComplete?.({
      blob,
      url,
      transcript: transcriptRef.current,
      durationSec,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Auto-stop at maxSeconds.
  React.useEffect(() => {
    if (state === "recording" && maxSeconds && elapsed >= maxSeconds) {
      void stop();
    }
  }, [state, elapsed, maxSeconds, stop]);

  const start = async () => {
    setErrorMsg("");
    setTranscript("");
    transcriptRef.current = "";
    setLevels(new Array(BARS).fill(0.05));
    setElapsed(0);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);

    try {
      const controller = await startRecording();
      controllerRef.current = controller;
      startedAtRef.current = Date.now();
      setState("recording");
      onRecordingChange?.(true);
      rafRef.current = requestAnimationFrame(tickWaveform);
      timerRef.current = setInterval(
        () => setElapsed((e) => e + 1),
        1000
      );

      if (recognize && isSpeechRecognitionSupported()) {
        recognitionRef.current = startRecognition(
          {
            onResult: (t) => {
              transcriptRef.current = t;
              setTranscript(t);
              onTranscriptChange?.(t);
            },
          },
          recognizeLang
        );
      }
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : "Không thể truy cập micro."
      );
      setState("error");
      onRecordingChange?.(false);
    }
  };

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setTranscript("");
    transcriptRef.current = "";
    setElapsed(0);
    setState("idle");
  };

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      void el.play();
    }
  };

  if (state === "unsupported") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm text-foreground",
          className
        )}
      >
        <AlertTriangle className="size-4 text-accent" />
        Trình duyệt không hỗ trợ ghi âm. Hãy dùng Chrome hoặc Edge.
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Waveform / status strip */}
      <div
        className={cn(
          "flex h-16 items-center justify-center gap-[2px] rounded-xl border bg-secondary/40 px-3",
          state === "recording" && "border-primary/50"
        )}
      >
        {state === "recording" ? (
          levels.map((l, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full bg-primary transition-[height] duration-75"
              style={{ height: `${Math.max(4, l * 56)}px` }}
            />
          ))
        ) : state === "recorded" && audioUrl ? (
          <audio
            ref={audioRef}
            src={audioUrl}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            className="hidden"
          />
        ) : (
          <span className="text-sm text-muted-foreground">
            {state === "error"
              ? errorMsg
              : "Nhấn ghi âm và nói rõ ràng vào micro."}
          </span>
        )}
        {state === "recorded" && audioUrl ? (
          <span className="text-sm text-muted-foreground">
            Đã ghi âm xong — nhấn nghe lại để kiểm tra.
          </span>
        ) : null}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {state === "idle" || state === "error" ? (
          <Button
            type="button"
            onClick={start}
            variant="destructive"
            size={compact ? "default" : "lg"}
          >
            <Mic /> Ghi âm
          </Button>
        ) : null}

        {state === "recording" ? (
          <>
            <Button
              type="button"
              onClick={() => void stop()}
              variant="secondary"
              size={compact ? "default" : "lg"}
              className="recording-pulse"
            >
              <Square className="fill-current" /> Dừng
            </Button>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {formatSeconds(elapsed)}
              {maxSeconds ? ` / ${formatSeconds(maxSeconds)}` : ""}
            </span>
          </>
        ) : null}

        {state === "recorded" ? (
          <>
            <Button type="button" onClick={togglePlay} variant="outline">
              {playing ? <Pause /> : <Play />}
              {playing ? "Tạm dừng" : "Nghe lại"}
            </Button>
            <Button type="button" onClick={reset} variant="ghost">
              <RotateCcw /> Ghi lại
            </Button>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {formatSeconds(Math.round(elapsed))}
            </span>
          </>
        ) : null}
      </div>

      {/* Live / final transcript */}
      {recognize && (state === "recording" || transcript) ? (
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Nội dung nhận diện được
          </p>
          <p className="hanzi mt-1 text-lg">
            {transcript || (
              <span className="text-muted-foreground">Đang nghe…</span>
            )}
          </p>
        </div>
      ) : null}
    </div>
  );
}
