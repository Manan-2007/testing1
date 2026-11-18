import { Link } from "react-router-dom";
import { ArrowUpRight, AudioLines, Hand, Play, Users, Workflow } from "lucide-react";
import { Arcs } from "@/components/brand/Arcs";
import { FluidSection } from "./FluidSection";
import { Logo } from "./Logo";

/** The wireframe's four destinations, as the footer's index. */
const DESTINATIONS = [
  { to: "/app/speech-to-sign", icon: AudioLines, title: "Speech → Sign", spoken: "Speech to sign", note: "Speak or type; the signer answers in ISL." },
  { to: "/app/sign-to-text", icon: Hand, title: "Sign → Text", spoken: "Sign to text", note: "Sign to the camera; read and hear the reply." },
  { to: "/#how-it-works", icon: Workflow, title: "How it works", spoken: "How it works", note: "Both pipelines, step by step." },
  { to: "/#about", icon: Users, title: "About us", spoken: "About us", note: "Why we built it, and who we are." },
];

const MORE = [
  { to: "/app/history", label: "History" },
  { to: "/app/settings", label: "Settings" },
  { to: "/app/help#vocabulary", label: "Supported signs" },
  { to: "/app/help#limits", label: "What it can't do" },
  { to: "/app/help#privacy", label: "Privacy" },
  { to: "/app/help", label: "Help" },
];

export function SiteFooter({ onReplayIntro }: { onReplayIntro?: () => void }) {
  return (
    <FluidSection as="footer" from="#ffffff" surface="bg-navy" depth={180} className="overflow-hidden pb-safe-tabbar text-white">
      <Arcs tone="inverse" point={false} className="absolute -top-40 -right-40 size-[36rem] opacity-70" />
      <div className="container-wide relative pt-20 sm:pt-28">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-section max-w-3xl text-white">
            Start a conversation.
            <span className="block text-white/45">Both of you, understood.</span>
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/app/speech-to-sign"
              className="inline-flex h-[3.25rem] items-center justify-center gap-2 rounded-full bg-gold px-7 font-semibold text-navy transition-colors hover:bg-gold-300"
            >
              Open the translator <ArrowUpRight className="size-5" aria-hidden />
            </Link>
          </div>
        </div>

        <nav aria-label="Footer" className="mt-16 grid border-t border-white/15 sm:grid-cols-2 lg:grid-cols-4">
          {DESTINATIONS.map((d, i) => (
            <Link
              key={d.to}
              to={d.to}
              className={
                "group relative flex flex-col gap-2 border-b border-white/15 py-7 transition-colors hover:bg-white/[0.03] sm:pr-6 lg:border-b-0 " +
                (i > 0 ? "lg:border-l lg:border-white/15 lg:pl-6" : "") +
                (i % 2 === 1 ? " sm:border-l sm:border-white/15 sm:pl-6" : "")
              }
            >
              <d.icon className="mb-2 size-6 text-gold" aria-hidden />
              <span className="flex items-center justify-between gap-3 text-[1.375rem] font-semibold tracking-[-0.03em]">
                <span aria-hidden>{d.title}</span>
                <span className="sr-only">{d.spoken}</span>
                <ArrowUpRight
                  className="size-5 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold"
                  aria-hidden
                />
              </span>
              <span className="text-[0.9375rem] leading-6 text-white/65">{d.note}</span>
            </Link>
          ))}
        </nav>

        <div className="grid gap-10 border-t border-white/15 py-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo inverse />
            <p className="mt-4 max-w-sm text-[0.9375rem] leading-7 text-white/65">
              Two-way communication between spoken English and Indian Sign Language. Built to support qualified
              interpreters, never to replace them.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:col-span-7 lg:justify-items-start">
            {MORE.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="inline-flex min-h-10 items-center text-[0.9375rem] text-white/75 transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/15 py-6 text-[0.8125rem] text-white/55 sm:flex-row sm:justify-between">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            Team APX_GP · The Builder&rsquo;s Theory 1.0
            {onReplayIntro && (
              <button
                type="button"
                onClick={onReplayIntro}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-1 text-white/75 underline decoration-white/30 underline-offset-4 transition-colors hover:text-gold hover:decoration-gold"
              >
                <Play className="size-3" aria-hidden /> Replay the welcome
              </button>
            )}
          </p>
          <p>No video is stored or sent. Sign motion from the ISLRTC dictionary.</p>
        </div>
      </div>
      <p
        aria-hidden
        className="pointer-events-none relative -mb-[0.2em] text-center text-[22vw] leading-[0.8] font-semibold tracking-[-0.07em] text-white/[0.05] select-none"
      >
        parlance
      </p>
    </FluidSection>
  );
}
