import RecipeForm from "@/views/recipes/form/recipe-form";

function NewRecipePage() {
  return (
    <section className="flex flex-1 items-center">
      <div className="mx-auto max-w-7xl space-y-4 px-6">
        <h1 className="text-2xl">Create New Recipe</h1>
        <RecipeForm mode="create" />
      </div>
    </section>
  );
}

export default NewRecipePage;
