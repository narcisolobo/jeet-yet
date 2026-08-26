import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("merges class strings", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false && "b", undefined, null, "")).toBe("a");
  });

  it("resolves conflicting Tailwind classes, last one wins", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("applies conditional classes", () => {
    const isActive = true;
    expect(cn("text-red-500", isActive && "text-blue-500")).toBe(
      "text-blue-500",
    );
  });
});
