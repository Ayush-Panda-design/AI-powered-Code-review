import { cn } from "@/lib/utils";

type IllustrationProps = {
  className?: string;
};

export function IlluUnclearRequest({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" className={cn("h-full w-full", className)} aria-hidden>
      <rect x="24" y="28" width="152" height="104" rx="14" className="fill-amber-500/10 stroke-amber-600/30" strokeWidth="2" />
      <rect x="40" y="48" width="88" height="10" rx="5" className="fill-amber-600/25" />
      <rect x="40" y="68" width="120" height="8" rx="4" className="fill-stone-400/20 dark:fill-stone-500/25" />
      <rect x="40" y="84" width="96" height="8" rx="4" className="fill-stone-400/20 dark:fill-stone-500/25" />
      <circle cx="158" cy="52" r="18" className="fill-rose-500/15 stroke-rose-500/50" strokeWidth="2" />
      <path
        d="M158 44v2M158 56c-3 0-5-2-5-4.5s2-4.5 5-4.5 5 2 5 4.5-2 4.5-5 4.5z"
        className="stroke-rose-600"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M52 108h56" className="stroke-rose-500/40" strokeWidth="2" strokeDasharray="6 4" />
      <circle cx="148" cy="108" r="6" className="fill-rose-500/30" />
    </svg>
  );
}

export function IlluClarify({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" className={cn("h-full w-full", className)} aria-hidden>
      <rect x="20" y="36" width="72" height="44" rx="12" className="fill-amber-500/12 stroke-amber-600/35" strokeWidth="2" />
      <rect x="108" y="56" width="72" height="44" rx="12" className="fill-emerald-500/12 stroke-emerald-600/35" strokeWidth="2" />
      <circle cx="44" cy="58" r="8" className="fill-amber-600/40" />
      <rect x="58" y="54" width="24" height="8" rx="4" className="fill-amber-600/25" />
      <circle cx="132" cy="78" r="8" className="fill-emerald-600/40" />
      <rect x="146" y="74" width="24" height="8" rx="4" className="fill-emerald-600/25" />
      <path d="M92 58c8 4 8 16 16 20" className="stroke-amber-600/50" strokeWidth="2" fill="none" strokeDasharray="4 3" />
    </svg>
  );
}

export function IlluRequirements({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" className={cn("h-full w-full", className)} aria-hidden>
      <rect x="48" y="20" width="104" height="120" rx="10" className="fill-white dark:fill-stone-900 stroke-amber-600/40" strokeWidth="2" />
      <rect x="64" y="40" width="72" height="8" rx="4" className="fill-amber-600/30" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(0 ${i * 22})`}>
          <circle cx="68" cy="68" r="6" className="fill-emerald-600/20 stroke-emerald-600" strokeWidth="1.5" />
          <path d="M65 68l2 2 4-4" className="stroke-emerald-600" strokeWidth="1.5" fill="none" />
          <rect x="82" y="64" width="56" height="8" rx="4" className="fill-stone-400/20" />
        </g>
      ))}
    </svg>
  );
}

export function IlluTasks({ className }: IllustrationProps) {
  const cols = [
    { x: 24, fill: "fill-amber-500/8", stroke: "stroke-amber-600/25" },
    { x: 76, fill: "fill-orange-500/8", stroke: "stroke-orange-600/25" },
    { x: 128, fill: "fill-emerald-500/8", stroke: "stroke-emerald-600/25" },
  ] as const;

  return (
    <svg viewBox="0 0 200 160" className={cn("h-full w-full", className)} aria-hidden>
      {cols.map((col, i) => (
        <g key={col.x}>
          <rect x={col.x} y="24" width="48" height="112" rx="10" className={cn(col.fill, col.stroke)} strokeWidth="1.5" />
          {[0, 1, 2].map((j) => (
            <rect
              key={j}
              x={col.x + 8}
              y={40 + j * 32}
              width="32"
              height="22"
              rx="6"
              className={
                i === 2 && j === 0
                  ? "fill-emerald-600/25"
                  : "fill-white/80 stroke-stone-300/40 dark:fill-stone-800/80"
              }
              strokeWidth="1"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

export function IlluReview({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" className={cn("h-full w-full", className)} aria-hidden>
      <rect x="28" y="32" width="144" height="96" rx="12" className="fill-stone-900/90 stroke-emerald-600/40" strokeWidth="2" />
      <rect x="40" y="48" width="56" height="6" rx="3" className="fill-emerald-500/40" />
      <rect x="40" y="62" width="88" height="5" rx="2.5" className="fill-stone-600" />
      <rect x="40" y="74" width="72" height="5" rx="2.5" className="fill-stone-600" />
      <rect x="40" y="86" width="96" height="5" rx="2.5" className="fill-rose-500/50" />
      <circle cx="148" cy="88" r="28" className="fill-amber-500/15 stroke-amber-600" strokeWidth="2.5" />
      <circle cx="148" cy="88" r="16" className="stroke-amber-600/60" strokeWidth="3" fill="none" />
      <path d="M138 88h20M148 78v20" className="stroke-amber-600" strokeWidth="2" />
    </svg>
  );
}

export function IlluApproval({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" className={cn("h-full w-full", className)} aria-hidden>
      <circle cx="68" cy="72" r="22" className="fill-amber-500/15 stroke-amber-600/40" strokeWidth="2" />
      <circle cx="132" cy="72" r="22" className="fill-emerald-500/15 stroke-emerald-600/40" strokeWidth="2" />
      <path d="M90 72h20" className="stroke-amber-600/50" strokeWidth="2" strokeDasharray="4 3" />
      <rect x="72" y="108" width="56" height="28" rx="8" className="fill-emerald-600/20 stroke-emerald-600" strokeWidth="2" />
      <path d="M88 122l8 8 16-16" className="stroke-emerald-600" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function IlluShip({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" className={cn("h-full w-full", className)} aria-hidden>
      <path d="M100 28l8 24h32l-26 18 10 30-24-16-24 16 10-30-26-18h32z" className="fill-amber-500/25 stroke-amber-600" strokeWidth="2" strokeLinejoin="round" />
      <rect x="56" y="108" width="88" height="32" rx="8" className="fill-emerald-600/20 stroke-emerald-600" strokeWidth="2" />
      <path d="M76 124h48" className="stroke-emerald-600" strokeWidth="2" strokeLinecap="round" />
      <circle cx="100" cy="124" r="6" className="fill-emerald-600" />
    </svg>
  );
}
