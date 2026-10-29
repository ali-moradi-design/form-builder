/** The formcanvas mark: an "F" built from two form fields, with the pointer that places them. */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#5f0f40" />
      <rect x="13" y="13" width="34" height="9.5" rx="4.75" fill="#fb8b24" />
      <rect x="13" y="13" width="9.5" height="38" rx="4.75" fill="#fb8b24" />
      <rect x="13" y="28.5" width="25" height="9.5" rx="4.75" fill="#fff4e8" />
      <path
        transform="translate(39.5 38) scale(0.92)"
        d="M0 0 L0 19 L4.6 14.6 L8.2 22.4 L12 20.6 L8.4 13 L14.6 13 Z"
        fill="#e36414"
        stroke="#5f0f40"
        strokeWidth="3.2"
        strokeLinejoin="round"
        paintOrder="stroke"
      />
    </svg>
  );
}

/** Mark plus the "formcanvas" wordmark in Comic Neue. */
export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="font-wordmark text-lg font-bold">formcanvas</span>
    </span>
  );
}
