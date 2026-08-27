import type { Timestamp } from "firebase/firestore";

// Not exhaustive — extend as new ingredients need units the paste-and-parse
// flow doesn't already cover. Grouped by conversion family per
// specs/recipe.md (mass⇄mass via grams, volume⇄volume via ml; no
// cross-family conversion yet).
type StandardUnit =
  | "gram"
  | "kilogram"
  | "ounce"
  | "pound"
  | "milliliter"
  | "liter"
  | "teaspoon"
  | "tablespoon"
  | "cup"
  | "fluid-ounce"
  | "piece";

interface RecipeIngredient {
  name: string; // e.g. "all-purpose flour"
  amount?: number; // required unless rawOverride is set — e.g. 250; plain number, Firestore has no fixed-point type, so rounding happens at format time rather than via DECIMAL storage
  unit?: StandardUnit; // required unless rawOverride is set — e.g. "gram", "cup", "piece"
  preparation?: string; // e.g. "sifted"
  notes?: string; // e.g. "room temperature"
  rawOverride?: string; // escape hatch for non-standard entries ("pinch of salt", "juice of 1 lemon") — skips structured scaling/conversion for that line
}

type ImportSourceType = "url" | "photo" | "manual";

interface Recipe {
  name: string;
  description?: string;
  image?: string; // Firebase Storage URL
  recipeIngredient: RecipeIngredient[]; // order is implicit in array position
  recipeInstructions: string[]; // one entry per step; plain text for now
  recipeYield?: string;
  prepTime?: string; // ISO 8601 duration, e.g. "PT15M"
  cookTime?: string;
  totalTime?: string;
  recipeCategory?: string; // free text with autocomplete, not a controlled vocabulary — see flows/create-recipe-from-form.md
  recipeCuisine?: string; // free text with autocomplete, same as recipeCategory
  keywords?: string[]; // tags; free text with autocomplete
  author?: string;
  dateCreated: Timestamp; // written via serverTimestamp() — a FieldValue at write time, a Timestamp once read back
  isBasedOn?: string; // source URL — present only when importSourceType is "url"
  importSourceType: ImportSourceType;
  ownerId: string; // Firebase Auth uid; writes require request.auth.uid == ownerId, reads are always public
  // Cloud-Function-maintained only (onWrite trigger on favoriteRecipes/ratings) — firestore.rules rejects any client write to these three fields
  favoriteCount?: number;
  thumbsUpCount?: number;
  thumbsDownCount?: number;
}

export type { ImportSourceType, Recipe, RecipeIngredient, StandardUnit };
