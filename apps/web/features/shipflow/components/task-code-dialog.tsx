"use client";

import { useState } from "react";
import { Bot, Check, Copy, ExternalLink, FileCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type TaskCodeDialogProps = {
  taskTitle: string;
  generatedCode: string;
  generatedFilePath?: string | null;
  generatedSummary?: string | null;
  draftPrUrl?: string | null;
  draftPrNumber?: number | null;
};

export function TaskCodeDialog({
  taskTitle,
  generatedCode,
  generatedFilePath,
  generatedSummary,
  draftPrUrl,
  draftPrNumber,
}: TaskCodeDialogProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable; ignore.
    }
  };

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
          />
        }
      >
        <FileCode className="size-3" />
        View code
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="size-4 text-violet-500" />
            AI-generated code
          </DialogTitle>
          <DialogDescription>
            {taskTitle}
            {draftPrNumber ? ` · draft PR #${draftPrNumber}` : ""}
          </DialogDescription>
        </DialogHeader>

        {generatedSummary ? (
          <p className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            {generatedSummary}
          </p>
        ) : null}

        <div className="overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between gap-2 border-b bg-muted/50 px-3 py-1.5">
            <span className="truncate font-mono text-[11px] text-muted-foreground">
              {generatedFilePath ?? "generated file"}
            </span>
            <button
              type="button"
              onClick={copy}
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="size-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-3" /> Copy
                </>
              )}
            </button>
          </div>
          <pre className="max-h-[50vh] overflow-auto px-3 py-2.5 text-xs leading-relaxed">
            <code className="font-mono">{generatedCode}</code>
          </pre>
        </div>

        {draftPrUrl ? (
          <a
            href={draftPrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border bg-foreground px-3 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            <ExternalLink className="size-3.5" />
            Show in GitHub
          </a>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
