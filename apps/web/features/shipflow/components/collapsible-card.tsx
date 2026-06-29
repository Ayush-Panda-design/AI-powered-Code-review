"use client";

import { type ReactNode, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CollapsibleCardProps = {
  title: string;
  /** Short pill shown in the collapsed header row */
  statusPill?: ReactNode;
  /** One-line summary shown when collapsed */
  summary?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** When true the card is permanently expanded (no collapse toggle) */
  alwaysOpen?: boolean;
  /** Accent colour for the left border when collapsed/complete */
  accent?: "green" | "amber" | "violet" | "sky" | "muted";
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
};

const accentBorder: Record<string, string> = {
  green: "border-l-emerald-500",
  amber: "border-l-amber-500",
  violet: "border-l-violet-500",
  sky: "border-l-sky-500",
  muted: "border-l-border",
};

export function CollapsibleCard({
  title,
  statusPill,
  summary,
  children,
  defaultOpen = true,
  alwaysOpen = false,
  accent = "muted",
  className,
  headerClassName,
  bodyClassName,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  const isOpen = alwaysOpen || open;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md",
        !isOpen && "border-l-4",
        !isOpen && accentBorder[accent],
        className,
      )}
    >
      {/* Header — always visible */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-3",
          !alwaysOpen && "cursor-pointer select-none hover:bg-muted/40",
          isOpen && "border-b",
          headerClassName,
        )}
        onClick={() => {
          if (!alwaysOpen) setOpen((v) => !v);
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {!alwaysOpen && (
            isOpen
              ? <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="text-sm font-medium leading-snug line-clamp-2">{title}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isOpen && summary ? (
            <span className="truncate text-xs text-muted-foreground max-w-[8rem]">{summary}</span>
          ) : null}
          {statusPill}
        </div>
      </div>

      {/* Body — only when open */}
      {isOpen && (
        <div className={cn("px-4 py-4", bodyClassName)}>
          {children}
        </div>
      )}
    </div>
  );
}
