import { listRecipes } from "@/lib/firebase/recipe-read";
import RecipeList from "@/views/recipes/list/recipe-list";

async function RecipesPage() {
  const recipes = await listRecipes();

  return (
    <section className="flex flex-1 items-center">
      <div className="mx-auto max-w-7xl px-6">
        <h1 className="mb-4 text-2xl">Recipes</h1>
        <RecipeList recipes={recipes} />
      </div>
    </section>
  );
}

export default RecipesPage;
