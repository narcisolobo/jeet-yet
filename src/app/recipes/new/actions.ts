"use server";

import { z } from "zod";
import {
  newRecipeSchema,
  type NewRecipeInput,
  type NewRecipeFieldErrors,
} from "./schema";

type ValidateNewRecipeResult =
  | { success: true; data: NewRecipeInput }
  | { success: false; errors: NewRecipeFieldErrors };

async function validateNewRecipe(input: unknown): Promise<ValidateNewRecipeResult> {
  const result = newRecipeSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: z.flattenError(result.error).fieldErrors,
    };
  }

  return { success: true, data: result.data };
}

export { validateNewRecipe };
