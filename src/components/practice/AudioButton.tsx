"use client";

import * as React from "react";
import { Volume2, Loader2, Pause, AlertTriangle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  isTtsAvailable,
  speak,
  speakDialogue,
  stopSpeaking,
} from "@/lib/speech";
import { cn } from "@/lib/utils";

export interface AudioButtonProps {
  /** Text to speak. For dialogue, prefix lines with "A:"/"B:" separated by | or newline. */
  text: string;
  /** Treat text as a two-speaker dialogue (alternating voices). */
  dialogue?: boolean;
  /** Button label (defaults to "Nghe"). */
  label?: string;
  /** Speech rate (default 0.9; use lower for beginners). */
  rate?: number;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  /** Called when playback finishes. */
  onEnded?: () => void;
}

/**
 * A play/stop button backed by speak()/speakDialogue(): the offline Web Speech
 * API when a Chinese voice is installed, otherwise server audio via /api/tts.
 * Only shows a disabled "unsupported" state if the browser has no audio at all.
 */
export function AudioButton({
  text,
  dialogue = false,
  label = "Nghe",
  rate,
  variant = "default",
  size = "lg",
  className,
  onEnded,
}: AudioButtonProps) {
  const [state, setState] = React.useState<
    "idle" | "loading" | "playing" | "unsupported"
  >("idle");
  const cancelRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    if (!isTtsAvailable()) setState("unsupported");
    return () => {
      cancelRef.current?.();
      stopSpeaking();
    };
  }, []);

  const handleClick = async () => {
    if (state === "unsupported") return;
    if (state === "playing" || state === "loading") {
      cancelRef.current?.();
      stopSpeaking();
      setState("idle");
      return;
    }
    setState("loading");
    const opts = {
      rate,
      onStart: () => setState("playing"),
      onEnd: () => {
        setState("idle");
        onEnded?.();
      },
      onError: () => setState("idle"),
    };
    cancelRef.current = dialogue
      ? await speakDialogue(text, opts)
      : await speak(text, opts);
  };

  if (state === "unsupported") {
    return (
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled
        className={cn("opacity-70", className)}
        title="Trình duyệt không hỗ trợ đọc văn bản (TTS)"
      >
        <AlertTriangle className="text-accent" />
        Không hỗ trợ đọc
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(state === "playing" && "recording-pulse", className)}
      aria-label={label}
    >
      {state === "loading" ? (
        <Loader2 className="animate-spin" />
      ) : state === "playing" ? (
        <Pause />
      ) : (
        <Volume2 />
      )}
      {state === "playing" ? "Dừng" : label}
    </Button>
  );
}
