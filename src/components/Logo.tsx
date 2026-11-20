export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <defs>
          <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3cf0ff" />
            <stop offset="1" stopColor="#b26bff" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="28" height="28" rx="8" fill="none" stroke="url(#logo-g)" strokeWidth="2.5" />
        <path d="M18 7l-7 10h5l-2 8 7-10h-5l2-8z" fill="url(#logo-g)" />
      </svg>
      <span className="font-display text-lg font-bold tracking-tight text-white">
        OVER<span className="text-neon">CLOCK</span>
      </span>
    </span>
  );
}
