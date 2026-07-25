import logoImage from "@/assets/Faahhhhhh-removebg-preview.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
  tone?: "ink" | "cream";
  variant?: "firm" | "arbiter";
}

export function Logo({
  className,
  showWordmark = true,
  size = "md",
  tone = "ink",
  variant = "firm",
}: LogoProps) {
  const sizes = {
    sm: { mark: 24, text: "text-[14px]", sub: "text-[10px]" },
    md: { mark: 32, text: "text-[17px]", sub: "text-[11px]" },
    lg: { mark: 42, text: "text-[22px]", sub: "text-[13px]" },
  }[size];

  const inkClass = tone === "cream" ? "text-cream" : "text-ink";

  if (variant === "arbiter") {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <img
          src={logoImage}
          alt="Foretyx Arbiter Logo"
          style={{ width: sizes.mark, height: sizes.mark, objectFit: "contain" }}
          className="shrink-0"
        />
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn("font-sans font-bold uppercase tracking-[0.04em]", sizes.text, tone === "cream" ? "text-cream" : "text-emerald-500")}
          >
            Arbiter
          </span>
          <span className={cn("font-sans font-normal", sizes.sub, inkClass, "opacity-50")}>
            by Foretyx
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src={logoImage}
        alt="Foretyx Logo"
        style={{ width: sizes.mark, height: sizes.mark, objectFit: "contain" }}
        className="shrink-0"
      />
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
