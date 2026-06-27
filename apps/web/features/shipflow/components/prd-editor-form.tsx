"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updatePrdAction } from "@/lib/actions/shipflow";

type PrdEditorFormProps = {
  featureRequestId: string;
  initialMarkdown: string;
};

export function PrdEditorForm({
  featureRequestId,
  initialMarkdown,
}: PrdEditorFormProps) {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          try {
            await updatePrdAction(featureRequestId, markdown);
            toast.success("PRD saved");
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Failed to save PRD",
            );
          }
        });
      }}
    >
      <Textarea
        value={markdown}
        onChange={(event) => setMarkdown(event.target.value)}
        className="min-h-[480px] font-mono text-sm"
        placeholder="PRD markdown…"
      />
      <Button type="submit" disabled={isPending || !markdown.trim()}>
        {isPending ? "Saving…" : "Save PRD"}
      </Button>
    </form>
  );
}
