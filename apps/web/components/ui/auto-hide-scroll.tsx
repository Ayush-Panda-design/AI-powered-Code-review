"use client";

import { useEffect, useRef, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Max height for dashboard list panels — fits below header + page chrome */
export const dashboardPanelHeightClass =
  "max-h-[min(calc(100svh-13rem),720px)]";

type AutoHideScrollProps = ComponentProps<"div">;

export function AutoHideScroll({
  className,
  children,
  ...props
}: AutoHideScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const onScroll = () => {
      element.dataset.scrolling = "true";
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
      hideTimer = setTimeout(() => {
        delete element.dataset.scrolling;
      }, 600);
    };

    element.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      element.removeEventListener("scroll", onScroll);
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("scrollbar-auto-hide", className)}
      {...props}
    >
      {children}
    </div>
  );
}
