/**
 * Where to stand: head and shoulders inside the frame, hands inside the
 * signing space. Drawn in the camera's own 16:9 space and cropped exactly like
 * the video (object-fit: cover <-> preserveAspectRatio slice).
 */
export function FramingGuide({ highlight }: { highlight: "ok" | "body" | "hands" }) {
  const stroke = highlight === "ok" ? "rgba(255,255,255,0.75)" : "rgba(238,198,67,0.95)";
  return (
    <svg
      aria-hidden
      viewBox="0 0 160 90"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <g fill="none" stroke={stroke} strokeWidth="0.6" strokeLinecap="round" strokeDasharray="2.2 1.8">
        <ellipse cx="80" cy="31" rx="8.5" ry="10.5" />
        <path d="M58 88c1.5-13 9-20.5 22-20.5S100.5 75 102 88" />
        <rect x="42" y="14" width="76" height="72" rx="5" opacity="0.7" />
      </g>
      <g stroke="rgba(255,255,255,0.9)" strokeWidth="0.9" strokeLinecap="round" fill="none">
        <path d="M6 14V6h8M154 14V6h-8M6 76v8h8M154 76v8h-8" />
      </g>
    </svg>
  );
}
