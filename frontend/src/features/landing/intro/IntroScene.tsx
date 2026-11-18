/**
 * The welcome scene: a blue panel rises over the page, a pair of hands signs
 * WELCOME (the real ISLRTC recording), and the blue collapses through a
 * circle into the signer's stage on the homepage, which takes over the
 * conversation. About 3 seconds; skippable by button, Escape, scrolling or
 * any key; never shown under reduced motion.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { animate } from "motion/react";
import { LogoMark } from "@/components/layout/Logo";
import { markIntroSeen, useIntro } from "./introState";
import { SigningHands } from "./SigningHands";

const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const;

type Stage = "enter" | "sign" | "reveal" | "fade";

function lockScroll(on: boolean) {
  document.documentElement.style.overflow = on ? "hidden" : "";
}

function Scene({ onReveal, onDone }: { onReveal: () => void; onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const mask = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const rim = useRef<SVGCircleElement>(null);
  const stage = useRef<Stage>("enter");
  const [signing, setSigning] = useState(false);
  const [ready, setReady] = useState<boolean | null>(null);
  const [leaving, setLeaving] = useState(false);
  /** `?intro=slow` plays the sign at a third of its speed, for reviewing the motion. */
  const slow = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("intro") === "slow";

  const finish = useCallback(async () => {
    stage.current = "fade";
    setLeaving(true);
    if (root.current) await animate(root.current, { opacity: 0 }, { duration: 0.32, ease: "easeOut" });
    onDone();
  }, [onDone]);

  const reveal = useCallback(
    async (fast = false) => {
      if (stage.current === "reveal" || stage.current === "fade") return;
      const covering = stage.current !== "enter";
      stage.current = "reveal";
      lockScroll(false);
      onReveal();
      if (!covering || !mask.current || !rim.current) {
        await finish();
        return;
      }

      // Collapse into the signer's stage when it is on screen; otherwise to the centre.
      const W = window.innerWidth;
      const H = window.innerHeight;
      let cx = W / 2;
      let cy = H / 2;
      let r = 0;
      const target = document.querySelector("[data-intro-target]")?.getBoundingClientRect();
      if (target && target.width > 48) {
        const x = target.left + target.width / 2;
        const y = target.top + target.height / 2;
        if (y > 0 && y < H - 48) {
          cx = x;
          cy = y;
          r = target.width / 2;
        }
      }
      const from = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 8;
      const duration = fast ? 0.5 : 0.8;
      const ring = rim.current;
      const clip = mask.current;
      ring.setAttribute("cx", String(cx));
      ring.setAttribute("cy", String(cy));
      ring.style.opacity = "1";
      if (art.current) void animate(art.current, { opacity: 0, scale: 0.82 }, { duration: duration * 0.55, ease: [0.4, 0, 1, 1] });
      await animate(from, r, {
        duration,
        ease: EASE_IN_OUT,
        onUpdate: (v) => {
          clip.style.clipPath = `circle(${v.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`;
          ring.setAttribute("r", v.toFixed(1));
        },
      });
      await finish();
    },
    [finish, onReveal],
  );

  // Enter: the panel rises with a softened top edge that settles flat.
  useEffect(() => {
    markIntroSeen();
    lockScroll(true);
    let live = true;
    const node = panel.current;
    const rise = node
      ? animate(
          node,
          { y: ["100%", "0%"], borderTopLeftRadius: ["50% 34%", "50% 0%"], borderTopRightRadius: ["50% 34%", "50% 0%"] },
          { duration: 0.6, ease: [0.65, 0, 0.35, 1] },
        )
      : null;
    void rise?.then(() => {
      if (!live || stage.current !== "enter") return;
      stage.current = "sign";
      setSigning(true);
    });
    // Never hold the page hostage, whatever happens to the animation.
    const failSafe = window.setTimeout(() => void reveal(true), slow ? 12000 : 5200);
    return () => {
      live = false;
      rise?.stop();
      window.clearTimeout(failSafe);
      lockScroll(false);
    };
  }, [reveal, slow]);

  // If the sign cannot load, go straight on to the page.
  useEffect(() => {
    if (signing && ready === false) void reveal(true);
    if (!signing || ready !== null) return;
    const timer = window.setTimeout(() => void reveal(true), 1400);
    return () => window.clearTimeout(timer);
  }, [signing, ready, reveal]);

  // Any intent to move on skips ahead (Tab still reaches the skip button).
  useEffect(() => {
    const skip = () => void reveal(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab" && event.key !== "Shift") skip();
    };
    window.addEventListener("wheel", skip, { passive: true });
    window.addEventListener("touchmove", skip, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchmove", skip);
      window.removeEventListener("keydown", onKey);
    };
  }, [reveal]);

  return (
    <div ref={root} className={leaving ? "pointer-events-none fixed inset-0 z-[80]" : "fixed inset-0 z-[80]"}>
      {/* Behind the rising panel, the page stays hidden. */}
      {!signing && <div aria-hidden className="absolute inset-0 bg-sky-50" />}

      <div ref={mask} className="absolute inset-0" aria-hidden>
        <div
          ref={panel}
          className="absolute inset-0 overflow-hidden bg-[radial-gradient(70%_60%_at_50%_44%,#2c44c9_0%,#0d21a1_58%,#0a1a84_100%)]"
          style={{ transform: "translateY(100%)" }}
        >
          <div className="absolute top-5 left-5 flex items-center gap-2.5 sm:top-6 sm:left-8">
            <LogoMark inverse />
            <span className="text-[1.1875rem] font-bold tracking-[-0.02em] text-white">Parlance</span>
          </div>

          <div ref={art} className="absolute inset-0 flex flex-col items-center justify-center gap-6 pb-[6vh]">
            <div className="relative aspect-square w-[min(74vmin,34rem)]">
              {/* Ripples: the sign travelling outward */}
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="absolute inset-[8%] animate-ripple rounded-full border border-white/20"
                  style={{ animationDelay: `${i * 0.7}s` }}
                />
              ))}
              <span className="absolute inset-[18%] rounded-full bg-[radial-gradient(closest-side,rgb(199_217_255/0.18),transparent)]" />
              <SigningHands
                gloss="welcome"
                from={2}
                to={21}
                playing={signing && ready === true}
                speed={slow ? 0.33 : 1}
                onReady={setReady}
                onEnd={() => window.setTimeout(() => void reveal(), 160)}
                className="absolute inset-0 size-full"
              />
            </div>
            <p className="flex animate-fade items-center gap-2.5 text-[0.9375rem] font-medium text-white/75 [animation-delay:500ms]">
              <span className="size-2 rounded-full bg-gold" />
              <span className="font-semibold tracking-[0.12em] text-white">WELCOME</span>
              <span>in Indian Sign Language</span>
            </p>
          </div>
        </div>
      </div>

      <svg aria-hidden className="pointer-events-none absolute inset-0 size-full">
        <circle ref={rim} r="0" fill="none" stroke="#EEC643" strokeWidth="3" style={{ opacity: 0 }} />
      </svg>

      <button
        type="button"
        onClick={() => void reveal(true)}
        className="absolute right-4 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] inline-flex min-h-11 items-center rounded-full bg-white/12 px-5 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-gold sm:right-8 sm:bottom-8"
      >
        Skip intro
      </button>
    </div>
  );
}

/** Mounted by the landing page; renders nothing once the welcome has played. */
export function IntroScene() {
  const phase = useIntro((s) => s.phase);
  const setPhase = useIntro((s) => s.setPhase);
  const onReveal = useCallback(() => setPhase("revealing"), [setPhase]);
  const onDone = useCallback(() => setPhase("done"), [setPhase]);
  if (phase === "done") return null;
  return <Scene onReveal={onReveal} onDone={onDone} />;
}
