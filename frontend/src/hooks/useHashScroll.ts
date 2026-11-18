import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scroll to `#id` after navigation. Lazy pages render a moment after the URL
 * changes, so this retries briefly until the target exists.
 */
export function useHashScroll(): void {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    let timer = 0;
    const attempt = () => {
      const node = document.getElementById(id);
      if (node) {
        node.scrollIntoView({ block: "start" });
        return;
      }
      if (tries++ < 20) timer = window.setTimeout(attempt, 50);
    };
    timer = window.setTimeout(attempt, 30);
    return () => window.clearTimeout(timer);
  }, [hash, pathname]);
}
