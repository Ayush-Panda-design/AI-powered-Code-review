import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { syncPullRequests } from "@/lib/actions/reviews";

export function SyncPullRequestsButton() {
  return (
    <form action={syncPullRequests}>
      <Button type="submit" variant="outline">
        <RefreshCw />
        Sync from GitHub
      </Button>
    </form>
  );
}
