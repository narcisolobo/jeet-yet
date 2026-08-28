import { describe, expect, it } from "vitest";
import { minutesToISODuration } from "./duration";

describe("minutesToISODuration", () => {
  it("converts a positive whole-minute string to an ISO 8601 duration", () => {
    expect(minutesToISODuration("15")).toBe("PT15M");
  });

  it("returns undefined for undefined input", () => {
    expect(minutesToISODuration(undefined)).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(minutesToISODuration("")).toBeUndefined();
  });

  it("returns undefined for zero", () => {
    expect(minutesToISODuration("0")).toBeUndefined();
  });

  it("returns undefined for a negative number", () => {
    expect(minutesToISODuration("-5")).toBeUndefined();
  });

  it("returns undefined for a non-numeric string", () => {
    expect(minutesToISODuration("abc")).toBeUndefined();
  });
});
