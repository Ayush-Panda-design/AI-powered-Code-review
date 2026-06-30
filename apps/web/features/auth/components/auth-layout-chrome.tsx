"use client";

import Link from "next/link";

import { ShipFlowLogo } from "@/components/brand/shipflow-logo";
import { ModeToggle } from "@/components/ui/mode-toggle";

export function AuthLayoutChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ModeToggle />
      </div>
      <Link href="/" className="transition-opacity hover:opacity-80">
        <ShipFlowLogo size="md" />
      </Link>
      {children}
    </div>
  );
}
