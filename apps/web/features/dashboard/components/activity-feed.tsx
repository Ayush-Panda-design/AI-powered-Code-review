"use client";

import { trpc } from "@/trpc/client";

export function ActivityFeed({ workspaceId }: { workspaceId: string }) {
  const { data: events = [], isLoading } = trpc.workspace.listActivity.useQuery(
    { workspaceId },
    { enabled: Boolean(workspaceId) },
  );

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading activity…</p>;
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No activity yet — reviews, approvals, and stale PR nudges appear here.
      </p>
    );
  }

  return (
    <ul className="space-y-3 text-sm">
      {events.map((event) => (
        <li key={event.id} className="rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{event.title}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(event.createdAt).toLocaleString()}
            </span>
          </div>
          {event.detail ? (
            <p className="mt-1 text-xs text-muted-foreground">{event.detail}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
