import NewRecipeForm from "@/views/recipes/new/new-recipe-form";

function NewRecipePage() {
  return (
    <section className="flex flex-1 items-center">
      <div className="mx-auto max-w-7xl space-y-4 px-6">
        <h1 className="text-2xl">Create New Recipe</h1>
        <NewRecipeForm />
      </div>
    </section>
  );
}

export default NewRecipePage;
