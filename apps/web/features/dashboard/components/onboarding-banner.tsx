"use client";

import { usePathname } from "next/navigation";

import { OnboardingGuide } from "@/features/dashboard/components/onboarding-guide";
import type { OnboardingState } from "@/features/dashboard/server/onboarding-state";

export function OnboardingBanner({ state }: { state: OnboardingState }) {
  const pathname = usePathname();
  const isOverview =
    pathname === "/dashboard" || pathname === "/dashboard/";

  if (isOverview || state.isComplete) {
    return null;
  }

  return <OnboardingGuide state={state} variant="compact" />;
}
