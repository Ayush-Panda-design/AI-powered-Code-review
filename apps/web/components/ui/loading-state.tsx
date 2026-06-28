import { cn } from "@/lib/utils";

import {
  LoadingIllustration,
  type LoadingVariant,
} from "@/components/ui/loading-illustration";

type LoadingStateProps = {
  label: string;
  description?: string;
  variant?: LoadingVariant;
  size?: "md" | "lg";
  className?: string;
};

export function LoadingState({
  label,
  description,
  variant = "default",
  size = "md",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-10 text-center",
        className,
      )}
    >
      <LoadingIllustration
        variant={variant}
        size={size === "lg" ? "lg" : "md"}
        label={label}
      />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? (
          <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

type LoadingListRowsProps = {
  rows?: number;
  variant?: LoadingVariant;
  className?: string;
};

export function LoadingListRows({
  rows = 5,
  variant = "repos",
  className,
}: LoadingListRowsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 p-3"
        >
          <div className="size-10 shrink-0">
            <LoadingIllustration variant={variant} size="md" className="size-10" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div
              className="loading-shimmer-bar h-3 w-3/4 rounded"
              style={{ animationDelay: `${index * 0.1}s` }}
            />
            <div
              className="loading-shimmer-bar h-2 w-1/2 rounded opacity-70"
              style={{ animationDelay: `${index * 0.1 + 0.05}s` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
