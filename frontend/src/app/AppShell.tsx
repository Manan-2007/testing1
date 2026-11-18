import { Outlet, useLocation } from "react-router-dom";
import { AudioLines, Hand, History, Settings } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { SkipLink } from "@/components/layout/SkipLink";
import { useHashScroll } from "@/hooks/useHashScroll";

const tabs = [
  { to: "/app/speech-to-sign", label: "Speech → Sign", ariaLabel: "Speech to sign", icon: AudioLines },
  { to: "/app/sign-to-text", label: "Sign → Text", ariaLabel: "Sign to text", icon: Hand },
  { to: "/app/history", label: "History", icon: History },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

/** Workspace frame: compact header, page content, and bottom tabs on phones. */
export function AppShell() {
  const location = useLocation();
  useHashScroll();
  return (
    <div className="min-h-dvh bg-canvas">
      <SkipLink />
      <AppHeader />
      <main id="main" tabIndex={-1} className="pb-safe-tabbar outline-none">
        <div key={location.pathname} className="animate-fade">
          <Outlet />
        </div>
      </main>
      <MobileTabBar items={tabs} label="Workspace" />
    </div>
  );
}
