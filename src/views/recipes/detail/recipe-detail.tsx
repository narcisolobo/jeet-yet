import type { RecipeDetail as RecipeDetailData } from "@/lib/firebase/recipe-read";
import RecipeHeader from "./recipe-header";
import RecipeIngredients from "./recipe-ingredients";
import RecipePhoto from "./recipe-photo";
import RecipeSteps from "./recipe-steps";

interface RecipeDetailProps {
  recipe: RecipeDetailData;
}

function RecipeDetail({ recipe }: RecipeDetailProps) {
  return (
    <section className="flex flex-1">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-6">
        {recipe.image && <RecipePhoto src={recipe.image} alt={recipe.name} />}
        <RecipeHeader recipe={recipe} />
        <RecipeIngredients ingredients={recipe.recipeIngredient} />
        <RecipeSteps steps={recipe.recipeInstructions} />
      </div>
    </section>
  );
}

export default RecipeDetail;
