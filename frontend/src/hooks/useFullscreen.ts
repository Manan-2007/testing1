import { useCallback, useEffect, useState, type RefObject } from "react";

export function useFullscreen(target: RefObject<HTMLElement | null>) {
  const supported = typeof document !== "undefined" && document.fullscreenEnabled === true;
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onChange = () => setActive(document.fullscreenElement === target.current && target.current !== null);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [target]);

  const toggle = useCallback(() => {
    const node = target.current;
    if (!node || !supported) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void node.requestFullscreen().catch(() => {});
  }, [target, supported]);

  return { supported, active, toggle };
}
