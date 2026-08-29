"use client";

import { validateRecipe } from "@/app/recipes/actions";
import type { RecipeFormFieldErrors } from "@/app/recipes/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { createRecipe, updateRecipe } from "@/lib/firebase/recipe";
import type { RecipeIngredient } from "@/lib/firebase/recipe";
import { useRouter } from "next/navigation";
import { type SyntheticEvent, useState } from "react";
import IngredientsField from "./ingredients-field";
import PhotoField from "./photo-field";
import StepsField from "./steps-field";
import TagsField from "./tags-field";

interface RecipeFormInitialValues {
  title: string;
  servings?: string;
  description?: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  prepTimeMinutes?: string;
  cookTimeMinutes?: string;
  category?: string;
  cuisine?: string;
  tags?: string[];
  photoUrl?: string;
}

type RecipeFormProps =
  | { mode: "create" }
  | { mode: "edit"; recipeId: string; initialValues: RecipeFormInitialValues };

function RecipeForm(props: RecipeFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [fieldErrors, setFieldErrors] = useState<RecipeFormFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const initialValues = props.mode === "edit" ? props.initialValues : undefined;

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setFormError(
        props.mode === "edit"
          ? "Please sign in to edit this recipe."
          : "Please sign in to create a recipe.",
      );
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const result = await validateRecipe({
      title: String(formData.get("title") ?? ""),
      servings: String(formData.get("servings") ?? ""),
      description: String(formData.get("description") ?? ""),
      ingredients: JSON.parse(String(formData.get("ingredients") ?? "[]")),
      steps: JSON.parse(String(formData.get("steps") ?? "[]")),
      prepTimeMinutes: String(formData.get("prepTimeMinutes") ?? ""),
      cookTimeMinutes: String(formData.get("cookTimeMinutes") ?? ""),
      category: String(formData.get("category") ?? ""),
      cuisine: String(formData.get("cuisine") ?? ""),
      tags: JSON.parse(String(formData.get("tags") ?? "[]")),
    });

    if (!result.success) {
      setFieldErrors(result.errors);
      setSubmitting(false);
      return;
    }

    const unresolvedCount = Number(
      formData.get("ingredientsUnresolvedCount") ?? 0,
    );
    if (unresolvedCount > 0) {
      setFieldErrors({
        ingredients: [
          `${unresolvedCount} ingredient${unresolvedCount > 1 ? "s" : ""} ` +
            `need${unresolvedCount === 1 ? "s" : ""} attention before you can save.`,
        ],
      });
      setSubmitting(false);
      return;
    }

    const photoFile = formData.get("photo");
    const photo =
      photoFile instanceof File && photoFile.size > 0 ? photoFile : null;

    try {
      if (props.mode === "edit") {
        await updateRecipe(props.recipeId, result.data, user.uid, photo);
        router.push(`/recipes/${props.recipeId}`);
      } else {
        const id = await createRecipe(result.data, user.uid, photo);
        router.push(`/recipes/${id}`);
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-[clamp(360px,50vw,540px)]">
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FieldSet className="border-border rounded-lg border p-4">
            <FieldLegend variant="label">Basics</FieldLegend>
            <div className="flex gap-4">
              <Field
                className="min-w-0 flex-1"
                data-invalid={Boolean(fieldErrors.title?.length)}
              >
                <FieldLabel htmlFor="title">
                  Recipe Title
                  <Badge className="bg-info text-info-foreground">
                    required
                  </Badge>
                </FieldLabel>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  defaultValue={initialValues?.title}
                  aria-required
                  aria-invalid={Boolean(fieldErrors.title?.length)}
                  disabled={submitting}
                  required
                />
                <FieldError
                  errors={fieldErrors.title?.map((message) => ({ message }))}
                />
              </Field>
              <Field className="w-24 shrink-0">
                <FieldLabel htmlFor="servings">Servings</FieldLabel>
                <Input
                  id="servings"
                  name="servings"
                  type="number"
                  min="1"
                  defaultValue={initialValues?.servings}
                  disabled={submitting}
                />
                <FieldError
                  errors={fieldErrors.servings?.map((message) => ({
                    message,
                  }))}
                />
              </Field>
            </div>
            <PhotoField initialPhotoUrl={initialValues?.photoUrl} />
            <Field className="w-full">
              <FieldLabel htmlFor="description">Recipe Description</FieldLabel>
              <Textarea
                id="description"
                name="description"
                defaultValue={initialValues?.description}
                disabled={submitting}
              />
            </Field>
          </FieldSet>
          <IngredientsField initialIngredients={initialValues?.ingredients} />
          <FieldError
            errors={fieldErrors.ingredients?.map((message) => ({ message }))}
          />
          <StepsField initialSteps={initialValues?.steps} />
          <FieldError
            errors={fieldErrors.steps?.map((message) => ({ message }))}
          />
          <FieldSet className="border-border rounded-lg border p-4">
            <FieldLegend variant="label">Timing</FieldLegend>
            <div className="flex gap-4">
              <Field className="min-w-0 flex-1">
                <FieldLabel htmlFor="prep-time">Prep (min)</FieldLabel>
                <Input
                  id="prep-time"
                  name="prepTimeMinutes"
                  type="number"
                  min="0"
                  defaultValue={initialValues?.prepTimeMinutes}
                  disabled={submitting}
                />
                <FieldError
                  errors={fieldErrors.prepTimeMinutes?.map((message) => ({
                    message,
                  }))}
                />
              </Field>
              <Field className="min-w-0 flex-1">
                <FieldLabel htmlFor="cook-time">Cook (min)</FieldLabel>
                <Input
                  id="cook-time"
                  name="cookTimeMinutes"
                  type="number"
                  min="0"
                  defaultValue={initialValues?.cookTimeMinutes}
                  disabled={submitting}
                />
                <FieldError
                  errors={fieldErrors.cookTimeMinutes?.map((message) => ({
                    message,
                  }))}
                />
              </Field>
            </div>
          </FieldSet>
          <FieldSet className="border-border rounded-lg border p-4">
            <FieldLegend variant="label">Details</FieldLegend>
            <div className="flex gap-4">
              <Field className="min-w-0 flex-1">
                <FieldLabel htmlFor="category">Category</FieldLabel>
                <Input
                  id="category"
                  name="category"
                  type="text"
                  placeholder="e.g. Entree, Dessert, Appetizer"
                  defaultValue={initialValues?.category}
                  disabled={submitting}
                />
              </Field>
              <Field className="min-w-0 flex-1">
                <FieldLabel htmlFor="cuisine">Cuisine</FieldLabel>
                <Input
                  id="cuisine"
                  name="cuisine"
                  type="text"
                  placeholder="e.g. Italian, Mexican, Thai"
                  defaultValue={initialValues?.cuisine}
                  disabled={submitting}
                />
              </Field>
            </div>
            <TagsField initialTags={initialValues?.tags} />
          </FieldSet>
          {formError ? <FieldError>{formError}</FieldError> : null}
          <Button type="submit" className="w-full" disabled={submitting}>
            {props.mode === "edit"
              ? submitting
                ? "Saving..."
                : "Save Changes"
              : submitting
                ? "Creating..."
                : "Create Recipe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default RecipeForm;
export type { RecipeFormInitialValues };
