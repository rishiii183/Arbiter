import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
  tone?: "ink" | "cream";
  variant?: "firm" | "arbiter";
}

/**
 * Foretyx wordmark.
 * - "firm": editorial — Inter Bold "FORETYX" in Ink (or Cream).
 * - "arbiter": product lockup — "ARBITER" + "by Foretyx".
 *
 * The F mark is a deliberate geometric construction (two stacked rectangles
 * forming an F), rendered as flat SVG. No glow, gradient or shadow.
 */
export function Logo({
  className,
  showWordmark = true,
  size = "md",
  tone = "ink",
  variant = "firm",
}: LogoProps) {
  const sizes = {
    sm: { mark: 18, text: "text-[14px]", sub: "text-[10px]" },
    md: { mark: 22, text: "text-[17px]", sub: "text-[11px]" },
    lg: { mark: 30, text: "text-[22px]", sub: "text-[13px]" },
  }[size];

  const inkClass = tone === "cream" ? "text-cream" : "text-ink";
  const markColor = tone === "cream" ? "hsl(var(--cream))" : "hsl(var(--teal-deep))";

  if (variant === "arbiter") {
    return (
      <div className={cn("flex items-baseline gap-2", className)}>
        <span
          className={cn("font-sans font-bold uppercase", sizes.text)}
          style={{ color: markColor, letterSpacing: "0.05em" }}
        >
          Arbiter
        </span>
        <span className={cn("font-sans font-normal", sizes.sub, inkClass, "opacity-50")}>
          by Foretyx
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={sizes.mark}
        height={sizes.mark}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        {/* Geometric F: two stacked rectangles */}
        <rect x="3" y="3" width="18" height="4.5" fill={markColor} />
        <rect x="3" y="10.5" width="12" height="4.5" fill={markColor} />
        <rect x="3" y="3" width="4.5" height="18" fill={markColor} />
      </svg>
      {showWordmark && (
        <span
          className={cn("font-sans font-bold uppercase tracking-[0.04em]", sizes.text, inkClass)}
        >
          Foretyx
        </span>
      )}
    </div>
  );
}
