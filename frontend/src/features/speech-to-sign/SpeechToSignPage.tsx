import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { announce } from "@/components/ui/Toaster";
import type { PlayerState, QueueItem, SignPlayer } from "@/engine/avatar/signMotion";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { createId } from "@/lib/id";
import { useSignQueue } from "@/services/signs/useSignQueue";
import { useSpeechInput } from "@/services/speech/useSpeechInput";
import { useHistory, type InputSource } from "@/stores/history";
import { useSettings } from "@/stores/settings";
import { ConversationPanel, type Exchange } from "./ConversationPanel";
import { SignerStage } from "./SignerStage";

const IDLE: PlayerState = { index: 0, progress: 0, playing: false, finished: false, transitioning: false };

/**
 * Speech → Sign studio: the signer fills the stage; the conversation and the
 * composer sit beside it (below it on small screens).
 */
export function SpeechToSignPage() {
  useDocumentTitle("Speech to sign");
  const [params, setParams] = useSearchParams();
  const signs = useSignQueue();
  const addHistory = useHistory((s) => s.add);
  const language = useSettings((s) => s.speechLanguage);
  const autoTranslate = useSettings((s) => s.autoTranslate);
  const setSetting = useSettings((s) => s.set);
  const wide = useMediaQuery("(min-width: 64rem)");
  const reduced = useReducedMotion();

  const [text, setText] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  /** What the signer is performing. A new array identity restarts playback. */
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [player, setPlayer] = useState<SignPlayer | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>(IDLE);

  const translate = useCallback(
    async (input: InputSource, override?: string) => {
      const value = (override ?? text).trim();
      if (!value) return;
      const result = await signs.translate(value);
      if (!result) return;
      const exchange: Exchange = { id: createId(), text: value, gloss: result.gloss, queue: result.queue, input, at: Date.now() };
      setExchanges((prev) => [...prev, exchange]);
      setText("");
      if (result.queue.length === 0) {
        announce("Nothing in that message could be translated.");
        return;
      }
      setPlayerState(IDLE);
      setActiveId(exchange.id);
      setQueue([...result.queue]);
      const missing = result.gloss.tokens.filter((t) => t.missing).map((t) => t.label);
      addHistory({ direction: "speech-to-sign", text: value, gloss: result.gloss.notation, missing, input });
      const signed = result.gloss.tokens.length - missing.length;
      announce(`ISL: ${result.gloss.notation}. ${signed} of ${result.gloss.tokens.length} words will be signed.`);
      if (!wide) window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    },
    [text, signs, addHistory, wide, reduced],
  );

  const onFinalSpeech = useCallback(
    (spoken: string) => {
      setText(spoken);
      if (autoTranslate) void translate("voice", spoken);
    },
    [autoTranslate, translate],
  );
  const speech = useSpeechInput(language, onFinalSpeech);

  // From History or the sign list: ?text=... is signed on arrival.
  const initial = useRef(params.get("text"));
  useEffect(() => {
    const value = initial.current;
    if (!value) return;
    initial.current = null;
    void translate("typed", value);
    setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wasPlaying = useRef(false);
  useEffect(() => {
    if (playerState.playing) wasPlaying.current = true;
    else if (wasPlaying.current && playerState.finished) {
      wasPlaying.current = false;
      announce("Finished signing.");
    }
  }, [playerState.playing, playerState.finished]);

  const replay = (id: string) => {
    const x = exchanges.find((e) => e.id === id);
    if (!x || x.queue.length === 0) return;
    setPlayerState(IDLE);
    setActiveId(id);
    setQueue([...x.queue]);
  };

  const clear = () => {
    speech.cancel();
    signs.clear();
    setExchanges([]);
    setActiveId(null);
    setQueue([]);
    setPlayerState(IDLE);
  };

  return (
    <div className="grid lg:h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)]">
      <h1 className="sr-only">Speech to sign</h1>
      <div className="h-[min(62svh,36rem)] min-h-[24rem] min-w-0 lg:h-auto">
        <SignerStage
          queue={queue}
          loading={signs.status === "loading"}
          state={playerState}
          onState={setPlayerState}
          player={player}
          onPlayer={setPlayer}
        />
      </div>
      <div className="min-h-0 border-t border-line lg:border-t-0 lg:border-l">
        <ConversationPanel
          exchanges={exchanges}
          activeId={activeId}
          onReplay={replay}
          onClear={clear}
          text={text}
          onText={setText}
          onSubmit={(source, override) => void translate(source, override)}
          busy={signs.status === "loading"}
          speech={speech}
          language={language}
          onLanguage={(value) => setSetting("speechLanguage", value)}
        />
      </div>
    </div>
  );
}
