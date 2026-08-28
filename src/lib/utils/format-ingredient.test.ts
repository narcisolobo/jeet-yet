import { describe, expect, it } from "vitest";
import { formatIngredientLine } from "./format-ingredient";

describe("formatIngredientLine", () => {
  it("formats amount, unit, and name", () => {
    expect(
      formatIngredientLine({ name: "flour", amount: 2, unit: "cup" }),
    ).toBe("2 cup flour");
  });

  it("appends preparation and notes as parenthesized extras", () => {
    expect(
      formatIngredientLine({
        name: "mozzarella",
        amount: 8,
        unit: "ounce",
        preparation: "torn",
        notes: "room temperature",
      }),
    ).toBe("8 ounce mozzarella (torn, room temperature)");
  });

  it("renders a bare name when amount and unit are absent", () => {
    expect(formatIngredientLine({ name: "salt and pepper" })).toBe(
      "salt and pepper",
    );
  });

  it("short-circuits to rawOverride when set, ignoring other fields", () => {
    expect(
      formatIngredientLine({
        name: "salt",
        amount: 1,
        unit: "pinch",
        rawOverride: "salt, to taste",
      }),
    ).toBe("salt, to taste");
  });
});
