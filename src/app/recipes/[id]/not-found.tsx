function RecipeNotFound() {
  return (
    <section className="flex flex-1 items-center">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h1 className="text-2xl">Recipe not found</h1>
        <p className="text-muted-foreground">
          This recipe has been deleted by the owner.
        </p>
      </div>
    </section>
  );
}

export default RecipeNotFound;
