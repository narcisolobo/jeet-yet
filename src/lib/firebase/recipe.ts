import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { minutesToISODuration } from "@/lib/utils/duration";

// Our own curated, cooking-focused vocabulary — NOT matched to any parsing
// library's unit set. `ingredient-parser` (the Python library that parses
// ingredient lines — see specs/recipe.md's Open Questions) is built on
// `pint`, an open-ended physical-units registry with no finite list to
// match; instead, the Cloud Function that calls it normalizes whatever unit
// it detects down to this list, and treats anything that doesn't map
// cleanly as low-confidence (flagged for the user, see
// flows/create-recipe-from-form.md) rather than coercing it. Grouped by
// conversion family per specs/recipe.md (mass⇄mass via grams, volume⇄volume
// via ml; no cross-family conversion yet). The "count" group has no
// conversion — these are discrete units. Size words ("large"/"medium"
// "small") aren't units and aren't included here; the parser reports them
// separately and they're folded into RecipeIngredient.notes.
//
// Exported as a const array (not just a type) so the new-recipe Server
// Action's Zod schema (src/app/recipes/new/schema.ts) can validate against
// the same list via z.enum, rather than duplicating it.
const STANDARD_UNITS = [
  // mass
  "gram",
  "kilogram",
  "ounce",
  "pound",
  // volume
  "teaspoon",
  "tablespoon",
  "fluid-ounce",
  "cup",
  "pint",
  "quart",
  "gallon",
  "milliliter",
  "liter",
  "pinch",
  "dash",
  // count
  "piece",
  "clove",
  "slice",
  "can",
  "package",
  "bunch",
  "head",
  "sprig",
  "stick",
] as const;

type StandardUnit = (typeof STANDARD_UNITS)[number];

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

interface NewRecipeData {
  title: string;
  servings?: string;
  description?: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  prepTimeMinutes?: string;
  cookTimeMinutes?: string;
  totalTimeMinutes?: string;
  category?: string;
  cuisine?: string;
  tags?: string[];
}

// Client-side write (not the Server Action — see
// src/app/recipes/new/actions.ts, which only validates). Firestore security
// rules require request.auth.uid == ownerId, so this has to run as the
// signed-in user via the client SDK rather than through the session-cookie/
// Admin SDK bridge. Returns the new doc's ID for redirecting to it.
async function createRecipe(
  input: NewRecipeData,
  ownerId: string,
): Promise<string> {
  const ref = doc(collection(db, "recipes"));

  const recipe: Record<string, unknown> = {
    name: input.title,
    recipeIngredient: input.ingredients,
    recipeInstructions: input.steps,
    dateCreated: serverTimestamp(),
    importSourceType: "manual",
    ownerId,
  };

  if (input.description) recipe.description = input.description;
  if (input.servings) recipe.recipeYield = input.servings;
  if (input.category) recipe.recipeCategory = input.category;
  if (input.cuisine) recipe.recipeCuisine = input.cuisine;
  if (input.tags?.length) recipe.keywords = input.tags;

  const prepTime = minutesToISODuration(input.prepTimeMinutes);
  if (prepTime) recipe.prepTime = prepTime;
  const cookTime = minutesToISODuration(input.cookTimeMinutes);
  if (cookTime) recipe.cookTime = cookTime;
  const totalTime = minutesToISODuration(input.totalTimeMinutes);
  if (totalTime) recipe.totalTime = totalTime;

  await setDoc(ref, recipe);
  return ref.id;
}

export { createRecipe, STANDARD_UNITS };
export type {
  ImportSourceType,
  NewRecipeData,
  Recipe,
  RecipeIngredient,
  StandardUnit,
};
