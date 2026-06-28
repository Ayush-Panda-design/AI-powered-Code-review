"use client";

import { cn } from "@/lib/utils"

import { LoadingIllustration } from "@/components/ui/loading-illustration"

function Spinner({ className }: { className?: string }) {
  return (
    <LoadingIllustration
      variant="inline"
      size="sm"
      className={cn(className)}
    />
  )
}

export { Spinner }
