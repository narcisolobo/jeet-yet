import type { RecipeIngredient } from "@/lib/firebase/recipe";

function formatIngredientLine(ingredient: RecipeIngredient): string {
  if (ingredient.rawOverride) return ingredient.rawOverride;

  const amountUnit = [
    ingredient.amount != null ? String(ingredient.amount) : null,
    ingredient.unit ?? null,
  ]
    .filter(Boolean)
    .join(" ");
  const line = [amountUnit, ingredient.name].filter(Boolean).join(" ");
  const extras = [ingredient.preparation, ingredient.notes].filter(Boolean);
  return extras.length > 0 ? `${line} (${extras.join(", ")})` : line;
}

export { formatIngredientLine };
