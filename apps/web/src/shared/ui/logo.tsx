/** The formweave mark: two strands weaving an "F", with the input cursor dot. */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#5f0f40" />
      <path
        d="M22 50.5 V27 Q22 18.5 30.5 18.5 H47.5"
        fill="none"
        stroke="#fb8b24"
        strokeWidth="9.5"
        strokeLinecap="round"
      />
      <path d="M13.5 35 H39" fill="none" stroke="#5f0f40" strokeWidth="16" strokeLinecap="round" />
      <path d="M13.5 35 H39" fill="none" stroke="#fff4e8" strokeWidth="9.5" strokeLinecap="round" />
      <circle cx="45.5" cy="47" r="5" fill="#e36414" />
    </svg>
  );
}

/** Mark plus the "formweave" wordmark in Comic Neue. */
export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="font-wordmark text-lg font-bold">formweave</span>
    </span>
  );
}
