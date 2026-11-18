/**
 * A section whose surface flows in: as it enters the viewport its top edge is
 * a soft, shallow curve (the corners lowered like a liquid settling), and by
 * the time it reaches the upper third of the screen it is a clean, square
 * edge again.
 *
 * Only the background sheet changes shape, never the content. The shape is a
 * scroll-linked border-radius on one absolutely positioned layer, driven by a
 * motion value, so React does not re-render on scroll. Flat under reduced motion.
 */
import { useRef, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";
import { motion, useMotionTemplate, useScroll, useTransform } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";

type FluidSectionProps<T extends ElementType> = {
  as?: T;
  /** Colour of the section above, which shows through the curved corners. */
  from: string;
  /** Classes for the surface itself (its background colour). */
  surface: string;
  /** Deepest curve in px, reached as the section first appears. */
  depth?: number;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;


export function FluidSection<T extends ElementType = "section">({
  as,
  from,
  surface,
  depth = 150,
  className,
  children,
  ...rest
}: FluidSectionProps<T>) {
  const Tag = (as ?? "section") as ElementType;
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.3"] });
  const curve = useTransform(scrollYProgress, (p) => {
    const max = typeof window === "undefined" ? depth : Math.min(depth, window.innerWidth * 0.1);
    // Holds its curve while entering, then settles flat (ease-in to square).
    return max * (1 - Math.min(1, Math.max(0, p))) ** 1.6;
  });
  const radius = useMotionTemplate`50% 50% 0 0 / ${curve}px ${curve}px 0 0`;

  return (
    <Tag ref={ref} className={cn("relative isolate", className)} style={{ backgroundColor: from }} {...rest}>
      <motion.div aria-hidden className={cn("absolute inset-0 -z-10", surface)} style={reduced ? undefined : { borderRadius: radius }} />
      {children}
    </Tag>
  );
}
