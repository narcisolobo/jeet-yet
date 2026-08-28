"use client";

import { type SyntheticEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { validateNewRecipe } from "@/app/recipes/new/actions";
import type { NewRecipeFieldErrors } from "@/app/recipes/new/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { createRecipe } from "@/lib/firebase/recipe";
import IngredientsField from "./ingredients-field";
import PhotoField from "./photo-field";
import StepsField from "./steps-field";
import TagsField from "./tags-field";

function NewRecipeForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [fieldErrors, setFieldErrors] = useState<NewRecipeFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setFormError("Please sign in to create a recipe.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const result = await validateNewRecipe({
      title: String(formData.get("title") ?? ""),
      servings: String(formData.get("servings") ?? ""),
      description: String(formData.get("description") ?? ""),
      ingredients: JSON.parse(String(formData.get("ingredients") ?? "[]")),
      steps: JSON.parse(String(formData.get("steps") ?? "[]")),
      prepTimeMinutes: String(formData.get("prepTimeMinutes") ?? ""),
      cookTimeMinutes: String(formData.get("cookTimeMinutes") ?? ""),
      totalTimeMinutes: String(formData.get("totalTimeMinutes") ?? ""),
      category: String(formData.get("category") ?? ""),
      cuisine: String(formData.get("cuisine") ?? ""),
      tags: JSON.parse(String(formData.get("tags") ?? "[]")),
    });

    if (!result.success) {
      setFieldErrors(result.errors);
      setSubmitting(false);
      return;
    }

    try {
      await createRecipe(result.data, user.uid);
      // No recipe detail route exists yet — land on the list instead of a
      // dead link. Revisit once /recipes/[id] exists.
      router.push("/recipes");
    } catch {
      setFormError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-[clamp(360px,50vw,540px)]">
      <CardHeader>
        <CardTitle as="h2" className="text-lg">
          Create New Recipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex gap-4">
            <Field
              className="min-w-0 flex-1"
              data-invalid={Boolean(fieldErrors.title?.length)}
            >
              <FieldLabel htmlFor="title">
                Recipe Title
                <Badge className="bg-info text-info-foreground">required</Badge>
              </FieldLabel>
              <Input
                id="title"
                name="title"
                type="text"
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
                disabled={submitting}
              />
              <FieldError
                errors={fieldErrors.servings?.map((message) => ({ message }))}
              />
            </Field>
          </div>
          <PhotoField />
          <Field className="w-full min-w-sm">
            <FieldLabel htmlFor="description">Recipe Description</FieldLabel>
            <Textarea id="description" name="description" disabled={submitting} />
          </Field>
          <IngredientsField />
          <FieldError
            errors={fieldErrors.ingredients?.map((message) => ({ message }))}
          />
          <StepsField />
          <FieldError
            errors={fieldErrors.steps?.map((message) => ({ message }))}
          />
          <div className="flex gap-4">
            <Field className="min-w-0 flex-1">
              <FieldLabel htmlFor="prep-time">Prep (min)</FieldLabel>
              <Input
                id="prep-time"
                name="prepTimeMinutes"
                type="number"
                min="0"
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
                disabled={submitting}
              />
              <FieldError
                errors={fieldErrors.cookTimeMinutes?.map((message) => ({
                  message,
                }))}
              />
            </Field>
            <Field className="min-w-0 flex-1">
              <FieldLabel htmlFor="total-time">Total (min)</FieldLabel>
              <Input
                id="total-time"
                name="totalTimeMinutes"
                type="number"
                min="0"
                disabled={submitting}
              />
              <FieldError
                errors={fieldErrors.totalTimeMinutes?.map((message) => ({
                  message,
                }))}
              />
            </Field>
          </div>
          <div className="flex gap-4">
            <Field className="min-w-0 flex-1">
              <FieldLabel htmlFor="category">Category</FieldLabel>
              <Input
                id="category"
                name="category"
                type="text"
                placeholder="e.g. Entree, Dessert, Appetizer"
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
                disabled={submitting}
              />
            </Field>
          </div>
          <TagsField />
          {formError ? <FieldError>{formError}</FieldError> : null}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating..." : "Create Recipe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default NewRecipeForm;
