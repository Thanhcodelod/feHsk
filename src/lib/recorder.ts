// =============================================================================
// MediaRecorder wrapper + live amplitude sampling for the waveform visualizer.
// Client-only. Used by the Speaking module.
// =============================================================================

export function isRecordingSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function" &&
    typeof window.MediaRecorder !== "undefined"
  );
}

export interface RecorderController {
  stop: () => Promise<Blob>;
  cancel: () => void;
  /** Latest normalized amplitude (0..1), sampled from the analyser. */
  getLevel: () => number;
  stream: MediaStream;
}

/**
 * Start recording audio. Resolves with a controller once the mic is live.
 * Rejects if permission is denied or the API is unavailable.
 */
export async function startRecording(): Promise<RecorderController> {
  if (!isRecordingSupported()) {
    throw new Error("Audio recording is not supported in this browser.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(
    stream,
    mimeType ? { mimeType } : undefined
  );
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  // Web Audio analyser for the live waveform.
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const audioCtx = new AudioCtx();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  const buffer = new Uint8Array(analyser.frequencyBinCount);

  recorder.start(100);

  const cleanup = () => {
    stream.getTracks().forEach((t) => t.stop());
    void audioCtx.close();
  };

  return {
    stream,
    getLevel: () => {
      analyser.getByteTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = (buffer[i] - 128) / 128;
        sum += v * v;
      }
      return Math.min(1, Math.sqrt(sum / buffer.length) * 3);
    },
    stop: () =>
      new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, {
            type: mimeType || "audio/webm",
          });
          cleanup();
          resolve(blob);
        };
        recorder.stop();
      }),
    cancel: () => {
      try {
        recorder.stop();
      } catch {
        /* ignore */
      }
      cleanup();
    },
  };
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}
