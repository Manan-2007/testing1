import { AudioLines, Hand, Users, Workflow } from "lucide-react";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { LANDING_SECTIONS, SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SkipLink } from "@/components/layout/SkipLink";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useHashScroll } from "@/hooks/useHashScroll";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { IntroScene } from "./intro/IntroScene";
import { useIntro } from "./intro/introState";
import { About } from "./About";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { FlowStrip } from "./FlowStrip";
import { WhyItMatters } from "./WhyItMatters";

const SECTION_IDS = LANDING_SECTIONS.map((s) => s.id);

const TABS = [
  { to: "/app/speech-to-sign", label: "Speech → Sign", ariaLabel: "Speech to sign", icon: AudioLines },
  { to: "/app/sign-to-text", label: "Sign → Text", ariaLabel: "Sign to text", icon: Hand },
  { to: "#how-it-works", label: "How it works", icon: Workflow },
  { to: "#about", label: "About us", icon: Users },
];

export function LandingPage() {
  useDocumentTitle(null);
  const active = useScrollSpy(SECTION_IDS);
  useHashScroll();
  const phase = useIntro((s) => s.phase);
  const replay = useIntro((s) => s.replay);

  return (
    <div className="min-h-dvh bg-sky-50" data-intro={phase === "playing" ? "playing" : undefined}>
      <SkipLink />
      <IntroScene />
      <SiteHeader active={active} />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <FlowStrip />
        <HowItWorks />
        <WhyItMatters />
        <About />
      </main>
      <SiteFooter onReplayIntro={replay} />
      <MobileTabBar items={TABS} label="Quick navigation" activeAnchor={active} />
    </div>
  );
}
