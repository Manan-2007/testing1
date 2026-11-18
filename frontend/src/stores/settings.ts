/**
 * User preferences. Persisted in localStorage; nothing here is personal data.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Retention = "off" | "session" | "1d" | "7d" | "30d";
export type MotionPreference = "system" | "reduce" | "full";
export type TextSize = "default" | "large" | "larger";
export type AvatarView = "figure" | "hands";
export type SpeechLanguage = "en-IN" | "en-US" | "en-GB";
export type PlaybackSpeed = 0.5 | 0.75 | 1;

export interface Settings {
  /* Language */
  speechLanguage: SpeechLanguage;
  /** Translate to ISL as soon as a spoken phrase is finished. */
  autoTranslate: boolean;

  /* Signer */
  avatarView: AvatarView;
  playbackSpeed: PlaybackSpeed;
  mirror: boolean;
  loop: boolean;
  showCaptions: boolean;

  /* Audio output */
  voiceOutput: boolean;
  voiceURI: string | null;
  speechRate: number;

  /* Camera and recognition */
  cameraId: string | null;
  showLandmarks: boolean;
  showFramingGuide: boolean;
  autoFinishSentence: boolean;
  confidenceThreshold: number;
  serviceUrl: string;

  /* Accessibility */
  motion: MotionPreference;
  textSize: TextSize;

  /* Privacy */
  retention: Retention;
}

export const DEFAULT_SERVICE_URL =
  (import.meta.env.VITE_PARLANCE_WS as string | undefined) ?? "ws://localhost:8000/ws";

export const DEFAULT_SETTINGS: Settings = {
  speechLanguage: "en-IN",
  autoTranslate: true,
  avatarView: "figure",
  playbackSpeed: 1,
  mirror: false,
  loop: false,
  showCaptions: true,
  voiceOutput: true,
  voiceURI: null,
  speechRate: 1,
  cameraId: null,
  showLandmarks: true,
  showFramingGuide: true,
  autoFinishSentence: true,
  confidenceThreshold: 0.85,
  serviceUrl: DEFAULT_SERVICE_URL,
  motion: "system",
  textSize: "default",
  retention: "session",
};

interface SettingsStore extends Settings {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  reset: () => void;
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (key, value) => set({ [key]: value } as Partial<Settings>),
      reset: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: "parlance.settings.v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ set: _set, reset: _reset, ...settings }) => settings,
    },
  ),
);

export const RETENTION_LABELS: Record<Retention, string> = {
  off: "Don't save history",
  session: "Until this tab is closed",
  "1d": "On this device for 24 hours",
  "7d": "On this device for 7 days",
  "30d": "On this device for 30 days",
};
