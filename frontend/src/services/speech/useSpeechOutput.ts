/**
 * Spoken output through the browser's speech synthesis. Every spoken sentence
 * is also shown on screen: audio is never the only channel.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useSettings } from "@/stores/settings";

export interface SpeechOutput {
  supported: boolean;
  speaking: boolean;
  voices: SpeechSynthesisVoice[];
  speak: (text: string) => boolean;
  cancel: () => void;
}

function englishFirst(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const rank = (v: SpeechSynthesisVoice) =>
    v.lang === "en-IN" ? 0 : v.lang.startsWith("en") ? 1 : v.lang.startsWith("hi") ? 2 : 3;
  return [...voices].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

export function useSpeechVoices(): SpeechSynthesisVoice[] {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() =>
    supported ? englishFirst(window.speechSynthesis.getVoices()) : [],
  );
  useEffect(() => {
    if (!supported) return;
    const update = () => setVoices(englishFirst(window.speechSynthesis.getVoices()));
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, [supported]);
  return voices;
}

export function useSpeechOutput(): SpeechOutput {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const voices = useSpeechVoices();
  const voiceURI = useSettings((s) => s.voiceURI);
  const rate = useSettings((s) => s.speechRate);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(
    () => () => {
      if (supported) window.speechSynthesis.cancel();
    },
    [supported],
  );

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return false;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = voices.find((v) => v.voiceURI === voiceURI) ?? voices.find((v) => v.lang === "en-IN");
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = "en-IN";
      }
      utterance.rate = rate;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      utteranceRef.current = utterance; // some engines garbage-collect mid-sentence
      window.speechSynthesis.speak(utterance);
      return true;
    },
    [supported, voices, voiceURI, rate],
  );

  const cancel = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { supported, speaking, voices, speak, cancel };
}
