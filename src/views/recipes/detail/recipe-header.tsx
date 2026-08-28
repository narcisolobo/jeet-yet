import { Badge } from "@/components/ui/badge";
import type { RecipeDetail } from "@/lib/firebase/recipe-read";
import { formatISODuration } from "@/lib/utils/duration";

interface RecipeHeaderProps {
  recipe: RecipeDetail;
}

function RecipeHeader({ recipe }: RecipeHeaderProps) {
  const prepTime = formatISODuration(recipe.prepTime);
  const cookTime = formatISODuration(recipe.cookTime);
  const totalTime = formatISODuration(recipe.totalTime);

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-medium">{recipe.name}</h1>
      {recipe.description && (
        <p className="text-muted-foreground">{recipe.description}</p>
      )}
      {(recipe.recipeCategory || recipe.recipeCuisine || recipe.keywords?.length) && (
        <div className="flex flex-wrap gap-2">
          {recipe.recipeCategory && (
            <Badge variant="outline">{recipe.recipeCategory}</Badge>
          )}
          {recipe.recipeCuisine && (
            <Badge variant="outline">{recipe.recipeCuisine}</Badge>
          )}
          {recipe.keywords?.map((keyword) => (
            <Badge key={keyword} variant="outline">
              {keyword}
            </Badge>
          ))}
        </div>
      )}
      {(recipe.recipeYield || prepTime || cookTime || totalTime) && (
        <div className="text-muted-foreground flex flex-wrap gap-x-4 text-sm">
          {recipe.recipeYield && <span>{recipe.recipeYield}</span>}
          {prepTime && <span>Prep: {prepTime}</span>}
          {cookTime && <span>Cook: {cookTime}</span>}
          {totalTime && <span>Total: {totalTime}</span>}
        </div>
      )}
      {recipe.isBasedOn && (
        <p className="text-muted-foreground text-sm">
          Imported from{" "}
          <a
            href={recipe.isBasedOn}
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {recipe.isBasedOn}
          </a>
        </p>
      )}
    </div>
  );
}

export default RecipeHeader;
