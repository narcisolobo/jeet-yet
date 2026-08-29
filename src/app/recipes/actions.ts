"use server";

import { z } from "zod";
import {
  recipeSchema,
  type RecipeFormInput,
  type RecipeFormFieldErrors,
} from "./schema";

type ValidateRecipeResult =
  | { success: true; data: RecipeFormInput }
  | { success: false; errors: RecipeFormFieldErrors };

async function validateRecipe(input: unknown): Promise<ValidateRecipeResult> {
  const result = recipeSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: z.flattenError(result.error).fieldErrors,
    };
  }

  return { success: true, data: result.data };
}

export { validateRecipe };
