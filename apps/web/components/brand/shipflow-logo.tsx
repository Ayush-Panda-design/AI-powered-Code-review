import { cn } from "@/lib/utils";

type ShipFlowLogoProps = {
  className?: string;
  iconClassName?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: { icon: "size-7", text: "text-base" },
  md: { icon: "size-9", text: "text-lg" },
  lg: { icon: "size-11", text: "text-xl" },
} as const;

export function ShipFlowLogo({
  className,
  iconClassName,
  showWordmark = true,
  size = "md",
}: ShipFlowLogoProps) {
  const sizes = sizeMap[size];

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <ShipFlowMark className={cn(sizes.icon, iconClassName)} />
      {showWordmark ? (
        <span className={cn("font-semibold tracking-tight", sizes.text)}>
          Ship<span className="text-amber-600 dark:text-amber-400">Flow</span>
          <span className="font-normal text-stone-500 dark:text-stone-400"> AI</span>
        </span>
      ) : null}
    </span>
  );
}

export function ShipFlowMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="40" height="40" rx="11" className="fill-amber-500/15" />
      <path
        d="M8 26c4-2 8-2 12 0s8 2 12 0"
        className="stroke-amber-600 dark:stroke-amber-400"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 29c3-1.5 6-1.5 10 0s7 1.5 10 0"
        className="stroke-emerald-600/70 dark:stroke-emerald-400/70"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 22l6-8 6 8H14z"
        className="fill-amber-600 dark:fill-amber-400"
      />
      <path
        d="M20 14v-3M17 11h6"
        className="stroke-emerald-600 dark:stroke-emerald-400"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="28" cy="12" r="3" className="fill-emerald-600 dark:fill-emerald-400" />
      <path
        d="M27 12l1.5 1.5L30 11"
        className="stroke-white"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
