import { z } from "zod";
import { STANDARD_UNITS } from "@/lib/firebase/recipe";

const optionalWholeNumber = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : undefined))
  .refine((value) => value === undefined || /^\d+$/.test(value), {
    message: "Must be a whole number.",
  });

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : undefined));

const recipeIngredientSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive().optional(),
  unit: z.enum(STANDARD_UNITS).optional(),
  preparation: z.string().optional(),
  notes: z.string().optional(),
  rawOverride: z.string().optional(),
});

const recipeSchema = z.object({
  title: z.string().trim().min(1, "Please enter a recipe title."),
  servings: optionalWholeNumber,
  description: optionalText,
  ingredients: z
    .array(recipeIngredientSchema)
    .min(1, "Please add at least one ingredient."),
  steps: z
    .array(z.string().min(1, "Step cannot be empty."))
    .min(1, "Please add at least one step."),
  prepTimeMinutes: optionalWholeNumber,
  cookTimeMinutes: optionalWholeNumber,
  category: optionalText,
  cuisine: optionalText,
  tags: z.array(z.string()).optional(),
});

type RecipeFormInput = z.infer<typeof recipeSchema>;
type RecipeFormFieldErrors = Partial<Record<keyof RecipeFormInput, string[]>>;

export { recipeSchema, type RecipeFormInput, type RecipeFormFieldErrors };
