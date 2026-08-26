import { describe, expect, it } from "vitest";
import type { User } from "firebase/auth";
import { generateHandle } from "./generate-handle";

function makeUser(overrides: Partial<Pick<User, "displayName" | "email">>) {
  return {
    displayName: null,
    email: null,
    ...overrides,
  } as User;
}

describe("generateHandle", () => {
  it("hyphenates a multi-word display name", () => {
    const user = makeUser({ displayName: "Alex Rivers" });
    expect(generateHandle(user)).toBe("alex-rivers");
  });

  it("lowercases and strips disallowed characters from the display name", () => {
    const user = makeUser({ displayName: "Anne-Marie O'Brien!" });
    expect(generateHandle(user)).toBe("anne-marie-obrien");
  });

  it("falls back to the email prefix when the display name sanitizes to empty", () => {
    const user = makeUser({ displayName: "🎉🎉🎉", email: "big.red-donkey@example.com" });
    expect(generateHandle(user)).toBe("bigred-donkey");
  });

  it("uses the email prefix when there is no display name", () => {
    const user = makeUser({ email: "jane.doe@example.com" });
    expect(generateHandle(user)).toBe("janedoe");
  });

  it("falls back to a random handle when neither source yields anything usable", () => {
    const user = makeUser({ displayName: "!!!", email: "+++@example.com" });
    expect(generateHandle(user)).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/);
  });

  it("falls back to a random handle when there is no display name or email", () => {
    const user = makeUser({});
    expect(generateHandle(user)).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/);
  });
});
