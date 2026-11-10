import React from "react";

export interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  className?: string;
  imgClassName?: string;
  onClick?: () => void;
}

const SIZE_MAP: Record<string, number> = {
  xs: 18,
  sm: 24,
  md: 32,
  lg: 40,
  xl: 48,
};

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showWordmark = false,
  wordmarkClassName = "font-serif font-semibold text-xl tracking-tight text-[#241d18]",
  className = "",
  imgClassName = "",
  onClick,
}) => {
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size] || 32;

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 bg-transparent ${className}`}
    >
      <img
        src="/favicon.png"
        alt="HandoverTrail"
        width={pixelSize}
        height={pixelSize}
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
        className={`object-contain shrink-0 bg-transparent select-none ${imgClassName}`}
        loading="eager"
        decoding="async"
      />
      {showWordmark && (
        <span className={wordmarkClassName}>
          HandoverTrail
        </span>
      )}
    </div>
  );
};

export default Logo;

