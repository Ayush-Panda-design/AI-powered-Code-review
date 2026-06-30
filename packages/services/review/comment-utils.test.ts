import { describe, expect, it } from "vitest";

import {
  buildReviewMarkdownFromAIReview,
  isStoredReviewComment,
  parseReviewFindings,
} from "./review/comment-utils";

describe("parseReviewFindings", () => {
  it("parses valid JSON findings", () => {
    const raw = JSON.stringify([
      {
        severity: "blocking",
        category: "security",
        title: "Missing auth check",
        description: "Route is unprotected",
        filePath: "src/api.ts",
      },
    ]);

    const findings = parseReviewFindings(raw);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("blocking");
    expect(findings[0]?.filePath).toBe("src/api.ts");
  });

  it("returns empty array for invalid JSON", () => {
    expect(parseReviewFindings("not-json")).toEqual([]);
  });
});

describe("isStoredReviewComment", () => {
  it("rejects in-progress placeholders", () => {
    expect(isStoredReviewComment("Review in progress: analyzing")).toBe(false);
  });

  it("accepts completed ShipFlow review markdown", () => {
    expect(
      isStoredReviewComment("## ShipFlow AI Review\n\n**Summary:** Looks good"),
    ).toBe(true);
  });
});

describe("buildReviewMarkdownFromAIReview", () => {
  it("includes requirements-aware banner when feature is linked", () => {
    const markdown = buildReviewMarkdownFromAIReview({
      summary: "One issue found",
      findings: JSON.stringify([
        {
          severity: "non_blocking",
          category: "style",
          title: "Naming",
          description: "Prefer camelCase",
        },
      ]),
      blockingCount: 0,
      nonBlockingCount: 1,
      confidenceScore: 82,
      prdAlignment: "Mostly aligned",
      featureRequestId: "feat_123",
    });

    expect(markdown).toContain("Review against your requirements");
    expect(markdown).toContain("**Review confidence:** 82/100");
    expect(markdown).toContain("Naming");
  });
});
