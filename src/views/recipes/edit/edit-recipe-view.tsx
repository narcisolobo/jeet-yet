"use client";

import type { RecipeDetail } from "@/lib/firebase/recipe-read";
import { useAuth } from "@/hooks/use-auth";
import { isoDurationToMinutes } from "@/lib/utils/duration";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import RecipeForm from "@/views/recipes/form/recipe-form";

interface EditRecipeViewProps {
  recipe: RecipeDetail;
}

function EditRecipeView({ recipe }: EditRecipeViewProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const isOwner = user?.uid === recipe.ownerId;

  useEffect(() => {
    if (!loading && !isOwner) {
      router.replace(`/recipes/${recipe.id}`);
    }
  }, [loading, isOwner, router, recipe.id]);

  if (loading || !isOwner) {
    return null;
  }

  return (
    <RecipeForm
      mode="edit"
      recipeId={recipe.id}
      initialValues={{
        title: recipe.name,
        servings: recipe.recipeYield,
        description: recipe.description,
        ingredients: recipe.recipeIngredient,
        steps: recipe.recipeInstructions,
        prepTimeMinutes: isoDurationToMinutes(recipe.prepTime),
        cookTimeMinutes: isoDurationToMinutes(recipe.cookTime),
        category: recipe.recipeCategory,
        cuisine: recipe.recipeCuisine,
        tags: recipe.keywords,
        photoUrl: recipe.image,
      }}
    />
  );
}

export default EditRecipeView;
