import { describe, expect, it } from "vitest";

import {
  isInFlightFeatureStatus,
  isInFlightPrStatus,
  slugify,
} from "./constants";

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips special characters", () => {
    expect(slugify("ShipFlow AI!!!")).toBe("shipflow-ai");
  });

  it("caps length at 48 characters", () => {
    const long = "a".repeat(60);
    expect(slugify(long).length).toBeLessThanOrEqual(48);
  });
});

describe("isInFlightFeatureStatus", () => {
  it("returns true for async pipeline statuses", () => {
    expect(isInFlightFeatureStatus("clarifying")).toBe(true);
    expect(isInFlightFeatureStatus("in_review")).toBe(true);
  });

  it("returns false for terminal or idle statuses", () => {
    expect(isInFlightFeatureStatus("shipped")).toBe(false);
    expect(isInFlightFeatureStatus("draft")).toBe(false);
  });
});

describe("isInFlightPrStatus", () => {
  it("detects processing PR states", () => {
    expect(isInFlightPrStatus("processing")).toBe(true);
    expect(isInFlightPrStatus("reviewed")).toBe(false);
  });
});
