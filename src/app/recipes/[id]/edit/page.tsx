import { notFound } from "next/navigation";
import { getRecipe } from "@/lib/firebase/recipe-read";
import EditRecipeView from "@/views/recipes/edit/edit-recipe-view";

async function EditRecipePage(props: PageProps<"/recipes/[id]/edit">) {
  const { id } = await props.params;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  return (
    <section className="flex flex-1 items-center">
      <div className="mx-auto max-w-7xl space-y-4 px-6">
        <h1 className="text-2xl">Edit Recipe</h1>
        <EditRecipeView recipe={recipe} />
      </div>
    </section>
  );
}

export default EditRecipePage;
