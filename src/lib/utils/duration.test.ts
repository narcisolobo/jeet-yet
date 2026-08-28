import { describe, expect, it } from "vitest";
import {
  formatISODuration,
  minutesToISODuration,
  sumMinutesToISODuration,
} from "./duration";

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

describe("sumMinutesToISODuration", () => {
  it("adds prep and cook minutes into one duration", () => {
    expect(sumMinutesToISODuration("10", "5")).toBe("PT15M");
  });

  it("uses just prep when cook is missing", () => {
    expect(sumMinutesToISODuration("10", undefined)).toBe("PT10M");
  });

  it("uses just cook when prep is missing", () => {
    expect(sumMinutesToISODuration(undefined, "20")).toBe("PT20M");
  });

  it("returns undefined when both are missing", () => {
    expect(sumMinutesToISODuration(undefined, undefined)).toBeUndefined();
  });

  it("returns undefined when both are empty strings", () => {
    expect(sumMinutesToISODuration("", "")).toBeUndefined();
  });
});

describe("formatISODuration", () => {
  it("formats a minutes-only duration", () => {
    expect(formatISODuration("PT15M")).toBe("15 min");
  });

  it("formats an hours-only duration", () => {
    expect(formatISODuration("PT1H")).toBe("1 hr");
  });

  it("formats an hours-and-minutes duration", () => {
    expect(formatISODuration("PT1H15M")).toBe("1 hr 15 min");
  });

  it("returns undefined for undefined input", () => {
    expect(formatISODuration(undefined)).toBeUndefined();
  });

  it("returns undefined for malformed input", () => {
    expect(formatISODuration("not-a-duration")).toBeUndefined();
  });
});
