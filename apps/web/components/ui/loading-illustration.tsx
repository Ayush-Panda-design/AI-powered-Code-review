"use client";

import type { ReactElement, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type LoadingVariant =
  | "default"
  | "pull-requests"
  | "review"
  | "tasks"
  | "features"
  | "activity"
  | "repos"
  | "metrics"
  | "inline";

const sizeMap = {
  sm: "size-4",
  md: "size-20",
  lg: "size-28",
} as const;

type LoadingIllustrationProps = {
  variant?: LoadingVariant;
  size?: keyof typeof sizeMap;
  className?: string;
  label?: string;
};

export function LoadingIllustration({
  variant = "default",
  size = "md",
  className,
  label,
}: LoadingIllustrationProps) {
  if (variant === "inline" || size === "sm") {
    return <InlineDots className={className} label={label} />;
  }

  const Illustration = illustrationByVariant[variant];

  return (
    <div
      role="status"
      aria-label={label ?? "Loading"}
      className={cn(
        "group/loading relative transition-transform duration-300 hover:scale-105",
        sizeMap[size],
        className,
      )}
    >
      <Illustration />
    </div>
  );
}

function InlineDots({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  const heights = ["h-1.5", "h-2.5", "h-2", "h-1.5"] as const;
  const colors = [
    "bg-status-success",
    "bg-status-warning",
    "bg-status-progress",
    "bg-status-error",
  ] as const;

  return (
    <span
      role="status"
      aria-label={label ?? "Loading"}
      className={cn("inline-flex items-end gap-0.5", className)}
    >
      {heights.map((height, index) => (
        <span
          key={index}
          className={cn(
            "w-1 rounded-full loading-inline-dot",
            height,
            colors[index],
          )}
          style={{ animationDelay: `${index * 0.12}s` }}
        />
      ))}
    </span>
  );
}

const illustrationByVariant = {
  default: OrbitIllustration,
  "pull-requests": PullRequestsIllustration,
  review: ReviewIllustration,
  tasks: TasksIllustration,
  features: FeaturesIllustration,
  activity: ActivityIllustration,
  repos: ReposIllustration,
  metrics: MetricsIllustration,
  inline: OrbitIllustration,
} satisfies Record<LoadingVariant, () => ReactElement>;

function OrbitIllustration() {
  return (
    <svg viewBox="0 0 80 80" className="size-full" aria-hidden>
      <circle
        cx="40"
        cy="40"
        r="28"
        fill="none"
        stroke="var(--border)"
        strokeWidth="1"
        opacity="0.5"
      />
      {[
        { color: "var(--status-success)", delay: "0s" },
        { color: "var(--status-warning)", delay: "-1.5s" },
        { color: "var(--status-progress)", delay: "-3s" },
        { color: "var(--status-error)", delay: "-4.5s" },
      ].map((dot) => (
        <g key={dot.color} className="loading-orbit" style={{ animationDelay: dot.delay }}>
          <circle cx="40" cy="12" r="5" fill={dot.color} />
        </g>
      ))}
      <circle cx="40" cy="40" r="6" fill="var(--muted)" />
      <circle
        cx="40"
        cy="40"
        r="10"
        fill="none"
        stroke="var(--status-warning)"
        strokeWidth="1.5"
        className="loading-pulse-ring"
        opacity="0.6"
      />
    </svg>
  );
}

function PullRequestsIllustration() {
  return (
    <svg viewBox="0 0 80 80" className="size-full" aria-hidden>
      <path
        d="M40 14v20M28 34h24"
        stroke="var(--status-success)"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="loading-draw"
      />
      <path
        d="M40 34v32M24 54h32"
        stroke="var(--status-progress)"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="loading-draw"
        style={{ animationDelay: "0.2s" }}
      />
      {[
        { cx: 40, cy: 14, fill: "var(--status-success)" },
        { cx: 28, cy: 34, fill: "var(--status-warning)" },
        { cx: 52, cy: 34, fill: "var(--status-warning)" },
        { cx: 24, cy: 54, fill: "var(--status-progress)" },
        { cx: 56, cy: 54, fill: "var(--status-error)" },
      ].map((node, index) => (
        <circle
          key={index}
          cx={node.cx}
          cy={node.cy}
          r="6"
          fill={node.fill}
          className="loading-node-pulse"
          style={{ animationDelay: `${index * 0.15}s` }}
        />
      ))}
    </svg>
  );
}

function ReviewIllustration() {
  return (
    <svg viewBox="0 0 80 80" className="size-full" aria-hidden>
      <rect
        x="18"
        y="14"
        width="44"
        height="52"
        rx="6"
        fill="var(--card)"
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      {[22, 30, 38, 46, 54].map((y) => (
        <rect
          key={y}
          x="24"
          y={y}
          width={y === 54 ? 20 : 32}
          height="4"
          rx="2"
          fill="var(--muted)"
          className="loading-shimmer-line"
          style={{ animationDelay: `${(y - 22) * 0.1}s` }}
        />
      ))}
      <rect
        x="18"
        y="14"
        width="44"
        height="8"
        rx="6"
        fill="url(#review-scan-gradient)"
        className="loading-scan-beam"
      />
      <defs>
        <linearGradient id="review-scan-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--status-success)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--status-warning)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--status-progress)" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function TasksIllustration() {
  const columns = [
    { x: 12, color: "var(--status-success)" },
    { x: 32, color: "var(--status-warning)" },
    { x: 52, color: "var(--status-progress)" },
  ];

  return (
    <svg viewBox="0 0 80 80" className="size-full" aria-hidden>
      {columns.map((col, colIndex) => (
        <g key={col.x}>
          <rect
            x={col.x}
            y="12"
            width="16"
            height="56"
            rx="4"
            fill="var(--muted)"
            opacity="0.35"
          />
          {[0, 1, 2].map((row) => (
            <rect
              key={row}
              x={col.x + 2}
              y={18 + row * 16}
              width="12"
              height="10"
              rx="2"
              fill={col.color}
              opacity="0.85"
              className="loading-card-bounce"
              style={{ animationDelay: `${colIndex * 0.2 + row * 0.15}s` }}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

function FeaturesIllustration() {
  return (
    <svg viewBox="0 0 80 80" className="size-full" aria-hidden>
      <circle
        cx="40"
        cy="40"
        r="24"
        fill="none"
        stroke="var(--status-warning)"
        strokeWidth="1.5"
        className="loading-pulse-ring"
      />
      <circle
        cx="40"
        cy="40"
        r="16"
        fill="none"
        stroke="var(--status-progress)"
        strokeWidth="1.5"
        className="loading-pulse-ring"
        style={{ animationDelay: "0.4s" }}
      />
      <path
        d="M40 22v8M40 50v8M22 40h8M50 40h8"
        stroke="var(--status-success)"
        strokeWidth="2"
        strokeLinecap="round"
        className="loading-draw"
      />
      <circle cx="40" cy="40" r="8" fill="var(--status-warning)" className="loading-node-pulse" />
    </svg>
  );
}

function ActivityIllustration() {
  return (
    <svg viewBox="0 0 80 80" className="size-full" aria-hidden>
      <line x1="28" y1="14" x2="28" y2="66" stroke="var(--border)" strokeWidth="2" />
      {[18, 34, 50].map((y, index) => (
        <g key={y}>
          <circle
            cx="28"
            cy={y}
            r="5"
            fill={
              index === 0
                ? "var(--status-success)"
                : index === 1
                  ? "var(--status-warning)"
                  : "var(--status-progress)"
            }
            className="loading-node-pulse"
            style={{ animationDelay: `${index * 0.25}s` }}
          />
          <rect
            x="38"
            y={y - 4}
            width="28"
            height="8"
            rx="4"
            fill="var(--muted)"
            className="loading-shimmer-line"
            style={{ animationDelay: `${index * 0.2}s` }}
          />
        </g>
      ))}
    </svg>
  );
}

function ReposIllustration() {
  return (
    <svg viewBox="0 0 80 80" className="size-full" aria-hidden>
      {[0, 1, 2, 3].map((index) => {
        const x = 14 + (index % 2) * 28;
        const y = 18 + Math.floor(index / 2) * 28;
        const colors = [
          "var(--status-success)",
          "var(--status-warning)",
          "var(--status-progress)",
          "var(--status-error)",
        ];

        return (
          <g key={index} className="loading-node-pulse" style={{ animationDelay: `${index * 0.2}s` }}>
            <rect
              x={x}
              y={y}
              width="24"
              height="20"
              rx="4"
              fill="var(--card)"
              stroke={colors[index]}
              strokeWidth="1.5"
            />
            <path
              d={`M${x + 6} ${y + 8}h12M${x + 6} ${y + 13}h8`}
              stroke={colors[index]}
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.8"
            />
          </g>
        );
      })}
    </svg>
  );
}

function MetricsIllustration() {
  const bars = [
    { x: 16, h: 28, color: "var(--status-success)" },
    { x: 28, h: 40, color: "var(--status-warning)" },
    { x: 40, h: 24, color: "var(--status-progress)" },
    { x: 52, h: 48, color: "var(--status-error)" },
  ];

  return (
    <svg viewBox="0 0 80 80" className="size-full" aria-hidden>
      <line x1="12" y1="62" x2="68" y2="62" stroke="var(--border)" strokeWidth="1.5" />
      {bars.map((bar, index) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={62 - bar.h}
          width="8"
          height={bar.h}
          rx="2"
          fill={bar.color}
          className="loading-bar-grow"
          style={{ animationDelay: `${index * 0.15}s` }}
        />
      ))}
    </svg>
  );
}

export function ButtonLoadingLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LoadingIllustration variant="inline" size="sm" />
      {children}
    </span>
  );
}
