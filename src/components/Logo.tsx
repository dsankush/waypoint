import { useId } from "react";

export const BRAND = "Waypoint";
export const TAGLINE = "Your career, mapped";

/** The Waypoint mark: a map pin with a dotted trail. */
export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF9A4D" />
          <stop offset="1" stopColor="#EA5A12" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#${id})`} />
      <path d="M13 50c9 7 25 7 38-3" stroke="#fff" strokeOpacity=".6" strokeWidth="3" strokeLinecap="round" strokeDasharray=".5 6.5" fill="none" />
      <path d="M32 10.5c-8.6 0-15.5 6.6-15.5 15 0 10.2 11.3 19.3 14.4 22a1.6 1.6 0 0 0 2.200 0c3.100-2.700 14.400-11.800 14.400-22 0-8.400-6.900-15-15.500-15Z" fill="#fff" />
      <circle cx="32" cy="25.5" r="7" fill="#EA5A12" />
      <circle cx="32" cy="25.5" r="2.600" fill="#FFD9BD" />
    </svg>
  );
}

export function Wordmark({ size = 40, sub, hideText = false }: { size?: number; sub?: string; hideText?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark size={size} className="shrink-0 drop-shadow-sm" />
      {!hideText && (
        <span className="leading-tight">
          <span className="block text-[17px] font-bold tracking-tight">{BRAND}</span>
          <span className="block text-xs text-muted-foreground">{sub ?? TAGLINE}</span>
        </span>
      )}
    </span>
  );
}
