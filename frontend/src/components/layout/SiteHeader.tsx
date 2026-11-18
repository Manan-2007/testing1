import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, AudioLines, Hand, History, LifeBuoy, Menu, Settings, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { AccessibilityMenu } from "./AccessibilityMenu";
import { Logo } from "./Logo";

export const LANDING_SECTIONS = [
  { id: "how-it-works", label: "How it works" },
  { id: "why-it-matters", label: "Why it matters" },
  { id: "about", label: "About" },
] as const;

const APP_LINKS = [
  { to: "/app/speech-to-sign", label: "Speech to sign", icon: AudioLines },
  { to: "/app/sign-to-text", label: "Sign to text", icon: Hand },
  { to: "/app/history", label: "History", icon: History },
  { to: "/app/settings", label: "Settings", icon: Settings },
  { to: "/app/help", label: "Help and limits", icon: LifeBuoy },
];

/**
 * Full-width and integrated at the top of the page; a compact floating capsule
 * once scrolled past the threshold, whichever way the reader then scrolls;
 * back to full width near the top. The outer box keeps a fixed height, so
 * nothing below it ever shifts.
 */
export function SiteHeader({ active }: { active: string | null }) {
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        // Position only, with a little hysteresis so it never flickers at the threshold.
        setCompact((was) => (was ? y > 12 : y > 40));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const floating = compact || menuOpen;

  return (
    <header className="sticky top-0 z-40 h-16 pt-[env(safe-area-inset-top)] md:h-[4.5rem]">
      <div
        className={cn(
          "relative mx-auto flex items-center justify-between gap-3 border transition-[max-width,translate,height,padding,background-color,border-color,box-shadow,border-radius] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          floating
            ? "translate-y-2.5 h-[3.25rem] max-w-[min(64rem,calc(100%-1.25rem))] rounded-[1.625rem] border-line bg-surface/95 pr-1.5 pl-4 shadow-[0_1px_2px_rgb(1_22_56/0.06),0_12px_32px_-14px_rgb(1_22_56/0.28)] backdrop-blur-sm sm:pl-5 md:translate-y-3 md:h-14 md:rounded-[1.75rem] md:pr-2"
            : "translate-y-0 h-16 max-w-[1320px] rounded-none border-transparent bg-transparent px-5 shadow-none sm:px-8 md:h-[4.5rem] xl:px-10",
        )}
      >
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {LANDING_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active === section.id ? "location" : undefined}
              className={cn(
                "relative flex items-center gap-1.5 rounded-sm px-3 py-2 text-[0.9375rem] font-medium whitespace-nowrap transition-colors",
                active === section.id ? "text-navy" : "text-ink-2 hover:text-navy",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-1.5 rounded-full bg-gold transition-all duration-300",
                  active === section.id ? "scale-100 opacity-100" : "scale-0 opacity-0",
                )}
              />
              {section.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <AccessibilityMenu />
          <ButtonLink
            to="/app/speech-to-sign"
            size={floating ? "sm" : "md"}
            variant="dark"
            className={cn("max-sm:hidden", floating && "rounded-full! px-4")}
            trailing={<ArrowUpRight aria-hidden />}
          >
            Open translator
          </ButtonLink>
          <button
            ref={menuButton}
            type="button"
            className={cn(
              "inline-flex size-11 items-center justify-center text-navy transition-[border-radius] duration-500 hover:bg-subtle lg:hidden",
              floating ? "rounded-full" : "rounded-sm",
            )}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="relative block size-5" aria-hidden>
              <Menu className={cn("absolute inset-0 size-5 transition-all duration-300", menuOpen ? "scale-50 rotate-90 opacity-0" : "opacity-100")} />
              <X className={cn("absolute inset-0 size-5 transition-all duration-300", menuOpen ? "opacity-100" : "scale-50 -rotate-90 opacity-0")} />
            </span>
          </button>
        </div>

        {/* Mobile and tablet menu: drops from the bar, never covers the whole screen */}
        <div
          id={menuId}
          className={cn(
            "absolute inset-x-0 top-[calc(100%+0.5rem)] grid transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden",
            menuOpen ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0",
          )}
          inert={!menuOpen}
        >
          <div className="overflow-hidden">
            <nav aria-label="Menu" className="max-h-[70vh] overflow-y-auto rounded-2xl border border-line bg-surface p-2 shadow-lg">
              {LANDING_SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between rounded-sm px-3 py-3 text-base font-medium text-navy hover:bg-subtle"
                >
                  {section.label}
                  {active === section.id && <span className="size-1.5 rounded-full bg-gold" aria-hidden />}
                </a>
              ))}
              <div className="my-2 h-px bg-line" />
              {APP_LINKS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 rounded-sm px-3 py-3 text-base font-medium text-ink-2 hover:bg-subtle hover:text-navy"
                >
                  <Icon className="size-5 text-royal" aria-hidden />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
