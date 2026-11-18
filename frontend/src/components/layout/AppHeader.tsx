import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { AudioLines, Hand, History, LifeBuoy, Settings } from "lucide-react";
import { cn } from "@/lib/cn";
import { AccessibilityMenu } from "./AccessibilityMenu";
import { Logo } from "./Logo";

const MODES = [
  { to: "/app/speech-to-sign", from: "Speech", target: "Sign", icon: AudioLines },
  { to: "/app/sign-to-text", from: "Sign", target: "Text", icon: Hand },
];

const TOOLS = [
  { to: "/app/history", label: "History", icon: History },
  { to: "/app/settings", label: "Settings", icon: Settings },
  { to: "/app/help", label: "Help", icon: LifeBuoy },
];

export function AppHeader() {
  const { pathname } = useLocation();
  const [floating, setFloating] = useState(false);

  // Same behaviour as the site header: position only, with hysteresis.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        setFloating((was) => (was ? y > 12 : y > 40));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 h-16 pt-[env(safe-area-inset-top)]">
      <div
        className={cn(
          "mx-auto flex items-stretch justify-between gap-4 border transition-[max-width,translate,height,padding,background-color,border-color,box-shadow,border-radius] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          floating
            ? "h-[3.25rem] max-w-[min(72rem,calc(100%-1.25rem))] translate-y-2.5 rounded-[1.625rem] border-line bg-surface/95 pr-1.5 pl-4 shadow-[0_1px_2px_rgb(1_22_56/0.06),0_12px_32px_-14px_rgb(1_22_56/0.28)] backdrop-blur-sm sm:pl-5 md:h-14 md:translate-y-3 md:rounded-[1.75rem] md:pr-2"
            : "h-16 max-w-full translate-y-0 rounded-none border-transparent border-b-line bg-surface/95 px-4 shadow-none sm:px-6",
        )}
      >
        <div className="flex min-w-0 items-center gap-8">
          <Logo />
          <nav aria-label="Translation direction" className="hidden h-full md:block">
            <ul className="flex h-full items-stretch gap-6">
              {MODES.map(({ to, from, target, icon: Icon }) => {
                const active = pathname.startsWith(to);
                return (
                  <li key={to} className="relative flex">
                    <NavLink
                      to={to}
                      className={cn(
                        "flex items-center gap-2 text-[0.9375rem] font-medium transition-colors",
                        active ? "text-navy" : "text-ink-3 hover:text-navy",
                      )}
                    >
                      <Icon className={cn("size-4", active ? "text-royal" : "")} aria-hidden />
                      <span>{from}</span>
                      <span aria-hidden className="text-ink-3/70">
                        →
                      </span>
                      <span className="sr-only">to</span>
                      <span>{target}</span>
                    </NavLink>
                    {active && (
                      <motion.span
                        layoutId="app-mode-indicator"
                        className={cn("absolute inset-x-0 h-0.5 bg-royal", floating ? "bottom-2 rounded-full" : "-bottom-px")}
                        transition={{ type: "spring", stiffness: 420, damping: 40 }}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <nav aria-label="Workspace" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {TOOLS.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    title={label}
                    className={({ isActive }) =>
                      cn(
                        "inline-flex h-10 items-center gap-2 px-3 text-sm font-medium transition-colors",
                        floating ? "rounded-full" : "rounded-sm",
                        isActive ? "bg-navy text-white" : "text-ink-2 hover:bg-subtle hover:text-navy",
                      )
                    }
                  >
                    <Icon className="size-4" aria-hidden />
                    <span className="sr-only lg:not-sr-only">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <NavLink
            to="/app/help"
            aria-label="Help"
            title="Help"
            className={({ isActive }) =>
              cn(
                "inline-flex size-11 items-center justify-center md:hidden",
                floating ? "rounded-full" : "rounded-sm",
                isActive ? "bg-navy text-white" : "text-ink-2 hover:bg-subtle",
              )
            }
          >
            <LifeBuoy className="size-5" aria-hidden />
          </NavLink>
          <div className="ml-2 flex items-center">
            <AccessibilityMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
