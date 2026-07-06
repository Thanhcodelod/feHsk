// =============================================================================
// Web Speech API wrappers — SpeechSynthesis (TTS) + SpeechRecognition (ASR).
// Client-only. All functions degrade gracefully when APIs are unavailable.
// =============================================================================

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Pick the best available Chinese (zh-CN) voice, falling back to any zh voice. */
export function getChineseVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const zhCN = voices.find((v) => /zh[-_]?CN/i.test(v.lang));
  if (zhCN) return zhCN;
  const zhAny = voices.find((v) => /^zh/i.test(v.lang) || /chinese/i.test(v.name));
  return zhAny ?? null;
}

/**
 * Voices load asynchronously in most browsers. Resolve once they're ready.
 */
export function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) return resolve([]);
    const existing = window.speechSynthesis.getVoices();
    if (existing.length) return resolve(existing);
    const handler = () => {
      resolve(window.speechSynthesis.getVoices());
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    // Safety timeout — some engines never fire the event.
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1200);
  });
}

export interface SpeakOptions {
  rate?: number; // 0.1 - 10, default 0.9 (slightly slow for learners)
  pitch?: number; // 0 - 2
  lang?: string; // default zh-CN
  onEnd?: () => void;
  onStart?: () => void;
  onError?: () => void;
}

// Server-audio fallback ------------------------------------------------------
// When the browser/OS has no Chinese voice (common on Windows without the
// Chinese language pack), Web Speech is silent. We then play MP3 audio from our
// own /api/tts endpoint, which always works. HTMLAudioElement is available in
// every browser, so pronunciation is guaranteed as long as the backend is up.

let currentAudio: HTMLAudioElement | null = null;

function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

/** True when we can produce speech at all (local TTS or the audio fallback). */
export function isTtsAvailable(): boolean {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

function speakViaAudio(text: string, opts: SpeakOptions): () => void {
  if (typeof Audio === "undefined") {
    opts.onError?.();
    return () => {};
  }
  stopAudio();
  const lang = opts.lang ?? "zh-CN";
  const audio = new Audio(
    `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`
  );
  // Google TTS ignores rate; approximate the learner slow-down via playbackRate
  // while keeping the pitch reasonable.
  audio.playbackRate = Math.min(Math.max(opts.rate ?? 1, 0.75), 1.5);
  currentAudio = audio;
  audio.onplay = () => opts.onStart?.();
  audio.onended = () => {
    if (currentAudio === audio) currentAudio = null;
    opts.onEnd?.();
  };
  audio.onerror = () => {
    if (currentAudio === audio) currentAudio = null;
    opts.onError?.();
  };
  void audio.play().catch(() => {
    if (currentAudio === audio) currentAudio = null;
    opts.onError?.();
  });
  return () => {
    if (currentAudio === audio) stopAudio();
  };
}

/**
 * Speak Chinese text. Prefers the offline Web Speech API when a Chinese voice is
 * installed (instant, free); otherwise — or if that voice errors — falls back to
 * server-generated audio so the speaker buttons always produce sound. Returns a
 * cancel function.
 */
export async function speak(
  text: string,
  opts: SpeakOptions = {}
): Promise<() => void> {
  const clean = text?.trim();
  if (!clean) {
    opts.onError?.();
    return () => {};
  }

  // Fast path: a real Chinese voice is available locally.
  if (isSpeechSynthesisSupported()) {
    const voice = getChineseVoice();
    if (voice) {
      window.speechSynthesis.cancel(); // stop anything currently speaking
      stopAudio();
      const utter = new SpeechSynthesisUtterance(clean);
      utter.voice = voice;
      utter.lang = opts.lang ?? voice.lang ?? "zh-CN";
      utter.rate = opts.rate ?? 0.9;
      utter.pitch = opts.pitch ?? 1;
      let usedFallback = false;
      utter.onstart = () => opts.onStart?.();
      utter.onend = () => opts.onEnd?.();
      utter.onerror = () => {
        // The voice claimed support but failed mid-utterance — use audio.
        if (!usedFallback) {
          usedFallback = true;
          speakViaAudio(clean, opts);
        }
      };
      window.speechSynthesis.speak(utter);
      return () => {
        usedFallback = true; // suppress the error->fallback path on manual cancel
        window.speechSynthesis.cancel();
      };
    }
  }

  // No usable local voice → guaranteed server-audio fallback.
  return speakViaAudio(clean, opts);
}

/**
 * Speak a two-speaker dialogue. Input format: lines separated by "|" or newline,
 * each optionally prefixed "A:" / "B:". Speaker B uses a higher pitch so the two
 * voices are distinguishable with a single system voice.
 */
export async function speakDialogue(
  script: string,
  opts: SpeakOptions = {}
): Promise<() => void> {
  const lines = script
    .split(/\||\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  let cancelled = false;

  const run = async () => {
    opts.onStart?.();
    for (const line of lines) {
      if (cancelled) break;
      const isB = /^b\s*[:：]/i.test(line);
      const clean = line.replace(/^[ab]\s*[:：]/i, "").trim();
      await new Promise<void>((resolve) => {
        void speak(clean, {
          ...opts,
          pitch: isB ? 1.4 : 0.9,
          rate: opts.rate ?? 0.9,
          onStart: undefined,
          onEnd: () => resolve(),
          onError: () => resolve(),
        });
      });
    }
    if (!cancelled) opts.onEnd?.();
  };
  void run();
  return () => {
    cancelled = true;
    if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
  };
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
  stopAudio();
}

// Nudge the browser to load voices early so the first click can take the fast
// (offline) path instead of the audio fallback. Safe no-op during SSR.
if (isSpeechSynthesisSupported()) {
  void ensureVoicesLoaded();
}

// ---------------------------------------------------------------------------
// SpeechRecognition (ASR)
// ---------------------------------------------------------------------------

type SR = typeof window & {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
};

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as SR;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export interface RecognitionHandle {
  stop: () => void;
}

export interface RecognitionCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
  onStart?: () => void;
}

/** Start zh-CN speech recognition. Returns a handle with .stop(), or null. */
export function startRecognition(
  cb: RecognitionCallbacks,
  lang = "zh-CN"
): RecognitionHandle | null {
  if (typeof window === "undefined") return null;
  const w = window as SR;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) {
    cb.onError?.("SpeechRecognition is not supported in this browser.");
    return null;
  }
  const recognition = new Ctor();
  recognition.lang = lang;
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => cb.onStart?.();
  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let transcript = "";
    let isFinal = false;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) isFinal = true;
    }
    cb.onResult(transcript, isFinal);
  };
  recognition.onerror = (e: Event) => {
    const err = (e as unknown as { error?: string }).error ?? "unknown";
    cb.onError?.(err);
  };
  recognition.onend = () => cb.onEnd?.();

  try {
    recognition.start();
  } catch {
    cb.onError?.("Could not start recognition.");
    return null;
  }
  return { stop: () => recognition.stop() };
}
