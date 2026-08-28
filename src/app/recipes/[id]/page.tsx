import { notFound } from "next/navigation";
import { getRecipe } from "@/lib/firebase/recipe-read";
import RecipeDetail from "@/views/recipes/detail/recipe-detail";

async function RecipePage(props: PageProps<"/recipes/[id]">) {
  const { id } = await props.params;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  return <RecipeDetail recipe={recipe} />;
}

export default RecipePage;
