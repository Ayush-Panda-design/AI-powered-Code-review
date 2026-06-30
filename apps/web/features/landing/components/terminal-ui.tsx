"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export function TerminalGrid({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 opacity-[0.35]", className)}
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.14) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
      aria-hidden
    />
  );
}

export function CornerMarks({ className }: { className?: string }) {
  const mark = "text-white/70";
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)} aria-hidden>
      <span className={cn("absolute left-0 top-0 text-[10px] leading-none", mark)}>+</span>
      <span className={cn("absolute right-0 top-0 text-[10px] leading-none", mark)}>+</span>
      <span className={cn("absolute bottom-0 left-0 text-[10px] leading-none", mark)}>+</span>
      <span className={cn("absolute bottom-0 right-0 text-[10px] leading-none", mark)}>+</span>
      <span className="absolute left-3 top-0 size-1.5 border border-red-500 bg-red-500/80" />
      <span className="absolute right-3 top-0 size-1.5 border border-white/40 bg-transparent" />
      <span className="absolute bottom-3 left-0 size-1.5 border border-white/40 bg-transparent" />
      <span className="absolute bottom-0 right-3 size-1.5 border border-red-500 bg-red-500/80" />
    </div>
  );
}

export function TerminalFrame({
  children,
  className,
  showCorners = true,
}: {
  children: ReactNode;
  className?: string;
  showCorners?: boolean;
}) {
  return (
    <div className={cn("relative border border-white/25 bg-black", className)}>
      {showCorners ? <CornerMarks /> : null}
      {children}
    </div>
  );
}

export function Bracket({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-white/55 sm:text-xs", className)}>
      <span className="text-white/35">[</span>
      {children}
      <span className="text-white/35">]</span>
    </span>
  );
}

export function TerminalButton({
  children,
  variant = "primary",
  className,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: "primary" | "ghost";
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] transition-colors sm:text-sm",
        variant === "primary"
          ? "bg-white text-black hover:bg-white/90"
          : "border border-white/40 bg-transparent text-white hover:border-white hover:bg-white/5",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TerminalLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] transition-colors sm:text-sm",
        variant === "primary"
          ? "bg-white text-black hover:bg-white/90"
          : "border border-white/40 bg-transparent text-white hover:border-white hover:bg-white/5",
        className,
      )}
    >
      {children}
    </a>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.35em] text-white/45 sm:text-xs">{children}</p>
  );
}

export function PixelHeading({
  children,
  className,
  as: Tag = "h2",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag
      className={cn(
        "font-[family-name:var(--font-display-landing)] text-3xl uppercase leading-[0.95] tracking-wide text-white sm:text-4xl lg:text-5xl",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function WorkflowBars({ activeIndex }: { activeIndex: number }) {
  const heights = [42, 58, 71, 65, 88, 76, 94];
  const colors = [
    "bg-yellow-400/90",
    "bg-yellow-500/90",
    "bg-orange-400/90",
    "bg-orange-500/90",
    "bg-red-400/90",
    "bg-red-500/90",
    "bg-red-600/95",
  ];

  return (
    <div className="flex h-28 items-end gap-1 border-t border-white/10 pt-4 sm:h-32">
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className={cn("flex-1 origin-bottom", colors[i])}
          animate={{
            height: `${i === activeIndex ? h + 8 : h}%`,
            opacity: i === activeIndex ? 1 : 0.55,
          }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
