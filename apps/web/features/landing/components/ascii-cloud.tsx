"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const GLYPHS = ["@", "#", "?", "+", "%", "&", "*", "/", "\\", ":", ";", "~"] as const;
const COLORS = [
  "text-red-400",
  "text-green-400",
  "text-blue-400",
  "text-yellow-300",
  "text-white/90",
  "text-orange-400",
] as const;

function seedCell(x: number, y: number) {
  return (x * 17 + y * 31) % GLYPHS.length;
}

export function AsciiCloud({ className }: { className?: string }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1200);
    return () => window.clearInterval(id);
  }, []);

  const cells = useMemo(() => {
    const rows = 14;
    const cols = 22;
    const items: Array<{ x: number; y: number; char: string; color: string; delay: number }> = [];

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const dx = x - cols / 2;
        const dy = y - rows / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 6.5 + Math.sin(x * 0.5) * 0.8) continue;

        const idx = (seedCell(x, y) + tick) % GLYPHS.length;
        items.push({
          x,
          y,
          char: GLYPHS[idx]!,
          color: COLORS[(x + y + tick) % COLORS.length]!,
          delay: (x + y) * 0.02,
        });
      }
    }
    return items;
  }, [tick]);

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden", className)}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
        animate={{ x: ["-30%", "30%", "-30%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        aria-hidden
      />
      <motion.div
        className="absolute h-px w-full bg-white/20"
        animate={{ scaleX: [0.2, 1, 0.2], opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: "48%" }}
        aria-hidden
      />
      <motion.div
        className="absolute w-px bg-white/20"
        style={{ left: "50%", height: "70%" }}
        animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.15, 0.5, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />

      <div
        className="relative grid font-mono text-[11px] leading-none sm:text-xs md:text-sm"
        style={{
          gridTemplateColumns: `repeat(22, 1fr)`,
          gridTemplateRows: `repeat(14, 1fr)`,
        }}
        aria-hidden
      >
        {cells.map((cell) => (
          <motion.span
            key={`${cell.x}-${cell.y}`}
            className={cn("select-none", cell.color)}
            style={{ gridColumn: cell.x + 1, gridRow: cell.y + 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.35, 1, 0.55] }}
            transition={{
              duration: 2.4,
              delay: cell.delay,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            {cell.char}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
