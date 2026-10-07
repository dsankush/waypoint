/** Original, friendly illustration used on the landing and home cards. */
export function Mascot({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden>
      <ellipse cx="80" cy="150" rx="46" ry="6" fill="#000" opacity=".08" />
      <line x1="80" y1="20" x2="80" y2="38" stroke="#1B1A19" strokeWidth="5" strokeLinecap="round" />
      <circle cx="80" cy="16" r="9" fill="#EA4C3A" stroke="#1B1A19" strokeWidth="4" />
      <rect x="30" y="36" width="100" height="78" rx="26" fill="#FFB020" stroke="#1B1A19" strokeWidth="5" />
      <rect x="42" y="48" width="76" height="46" rx="20" fill="#fff" stroke="#1B1A19" strokeWidth="4" />
      <circle cx="64" cy="70" r="10" fill="#1B1A19" /><circle cx="96" cy="70" r="10" fill="#1B1A19" />
      <circle cx="67" cy="67" r="3.5" fill="#fff" /><circle cx="99" cy="67" r="3.5" fill="#fff" />
      <path d="M68 84 Q80 94 92 84" stroke="#1B1A19" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="46" y="112" width="68" height="30" rx="14" fill="#F4701E" stroke="#1B1A19" strokeWidth="5" />
      <circle cx="26" cy="96" r="12" fill="#3B82F6" stroke="#1B1A19" strokeWidth="4" />
      <circle cx="134" cy="96" r="12" fill="#3B82F6" stroke="#1B1A19" strokeWidth="4" />
    </svg>
  );
}
