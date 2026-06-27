import type { ReviewFinding } from "@/features/reviews/types/structured-review";
import {
  REVIEW_NON_BLOCKING_BUDGET,
  PR_SIZE_CRITICAL_FILES,
  PR_SIZE_CRITICAL_LINES,
  PR_SIZE_WARN_FILES,
  PR_SIZE_WARN_LINES,
} from "@repo/services/constants";

export type ReviewRuleRecord = {
  pattern: string;
  category: string | null;
  filePath: string | null;
};

export type PrSizeMetrics = {
  filesChanged: number;
  additions: number;
  deletions: number;
  linesChanged: number;
  sizeWarning: "warn" | "critical" | null;
};

export function computePrSizeMetrics(
  files: Array<{ additions?: number; deletions?: number }>,
): PrSizeMetrics {
  const filesChanged = files.length;
  const additions = files.reduce((sum, file) => sum + (file.additions ?? 0), 0);
  const deletions = files.reduce((sum, file) => sum + (file.deletions ?? 0), 0);
  const linesChanged = additions + deletions;

  let sizeWarning: PrSizeMetrics["sizeWarning"] = null;
  if (
    filesChanged >= PR_SIZE_CRITICAL_FILES ||
    linesChanged >= PR_SIZE_CRITICAL_LINES
  ) {
    sizeWarning = "critical";
  } else if (
    filesChanged >= PR_SIZE_WARN_FILES ||
    linesChanged >= PR_SIZE_WARN_LINES
  ) {
    sizeWarning = "warn";
  }

  return { filesChanged, additions, deletions, linesChanged, sizeWarning };
}

function findingKey(finding: ReviewFinding) {
  return `${finding.severity}:${finding.title}:${finding.filePath ?? ""}`;
}

function matchesRule(finding: ReviewFinding, rule: ReviewRuleRecord) {
  const title = finding.title.toLowerCase();
  const category = finding.category.toLowerCase();
  const pattern = rule.pattern.toLowerCase();

  if (rule.category && finding.category.toLowerCase() !== rule.category.toLowerCase()) {
    return false;
  }

  if (rule.filePath && finding.filePath) {
    if (!finding.filePath.toLowerCase().includes(rule.filePath.toLowerCase())) {
      return false;
    }
  }

  return title.includes(pattern) || category.includes(pattern);
}

export function filterSuppressedFindings(
  findings: ReviewFinding[],
  rules: ReviewRuleRecord[],
  mutedCategories: string[],
) {
  const muted = new Set(mutedCategories.map((category) => category.toLowerCase()));

  return findings.filter((finding) => {
    if (muted.has(finding.category.toLowerCase())) {
      return false;
    }

    return !rules.some((rule) => matchesRule(finding, rule));
  });
}

export function applyCommentBudget(findings: ReviewFinding[]) {
  const blocking = findings.filter((finding) => finding.severity === "blocking");
  const nonBlocking = findings
    .filter((finding) => finding.severity === "non_blocking")
    .sort(
      (left, right) =>
        (right.confidence ?? 50) - (left.confidence ?? 50),
    );

  const keptNonBlocking = nonBlocking.slice(0, REVIEW_NON_BLOCKING_BUDGET);
  const droppedCount = nonBlocking.length - keptNonBlocking.length;

  return {
    findings: [...blocking, ...keptNonBlocking],
    droppedNonBlockingCount: droppedCount,
  };
}

export function sortFindingsByConfidence(findings: ReviewFinding[]) {
  return [...findings].sort((left, right) => {
    if (left.severity === "blocking" && right.severity !== "blocking") {
      return -1;
    }
    if (right.severity === "blocking" && left.severity !== "blocking") {
      return 1;
    }
    return (right.confidence ?? 50) - (left.confidence ?? 50);
  });
}

export function buildReviewChangeSummary(
  previous: ReviewFinding[],
  current: ReviewFinding[],
) {
  const prevKeys = new Set(previous.map(findingKey));
  const currKeys = new Set(current.map(findingKey));

  const resolved = previous.filter((finding) => !currKeys.has(findingKey(finding)));
  const newIssues = current.filter((finding) => !prevKeys.has(findingKey(finding)));

  return { resolved, newIssues };
}

export function suggestPrSplit(filesChanged: number, linesChanged: number) {
  if (filesChanged < PR_SIZE_WARN_FILES && linesChanged < PR_SIZE_WARN_LINES) {
    return null;
  }

  return [
    "Split by layer: API/routes vs UI components vs database migrations.",
    "Split by feature slice: one PR per acceptance criterion or task.",
    "Extract refactors and formatting into a separate PR first.",
  ];
}
