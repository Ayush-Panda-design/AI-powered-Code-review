"use client";

type PrdDiffPanelProps = {
  aiDraftMarkdown: string | null | undefined;
  currentMarkdown: string;
};

function diffLines(before: string, after: string) {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const max = Math.max(beforeLines.length, afterLines.length);
  const changes: Array<{ type: "same" | "add" | "remove"; line: string }> = [];

  for (let index = 0; index < max; index += 1) {
    const left = beforeLines[index];
    const right = afterLines[index];
    if (left === right) {
      if (left != null) changes.push({ type: "same", line: left });
    } else {
      if (left != null) changes.push({ type: "remove", line: left });
      if (right != null) changes.push({ type: "add", line: right });
    }
  }

  return changes.slice(0, 80);
}

export function PrdDiffPanel({ aiDraftMarkdown, currentMarkdown }: PrdDiffPanelProps) {
  if (!aiDraftMarkdown || aiDraftMarkdown.trim() === currentMarkdown.trim()) {
    return null;
  }

  const changes = diffLines(aiDraftMarkdown, currentMarkdown);

  return (
    <div className="rounded-lg border p-4 text-sm">
      <p className="mb-2 font-medium">PRD diff (AI draft vs current)</p>
      <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
        {changes.map((change, index) => (
          <div
            key={index}
            className={
              change.type === "add"
                ? "text-emerald-700"
                : change.type === "remove"
                  ? "text-destructive line-through"
                  : "text-muted-foreground"
            }
          >
            {change.type === "add" ? "+ " : change.type === "remove" ? "- " : "  "}
            {change.line}
          </div>
        ))}
      </pre>
    </div>
  );
}
