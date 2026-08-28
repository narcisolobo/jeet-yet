import type { RecipeDetail } from "@/lib/firebase/recipe-read";
import RecipeCard from "./recipe-card";

interface RecipeListProps {
  recipes: RecipeDetail[];
}

function RecipeList({ recipes }: RecipeListProps) {
  if (recipes.length === 0) {
    return <p className="text-muted-foreground">No recipes yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}

export default RecipeList;
