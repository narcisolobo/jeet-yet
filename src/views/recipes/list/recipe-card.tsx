import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import type { RecipeDetail } from "@/lib/firebase/recipe-read";
import Link from "next/link";

interface RecipeCardProps {
  recipe: RecipeDetail;
}

function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        {recipe.image && (
          // eslint-disable-next-line @next/next/no-img-element -- Storage URLs vary by environment, not covered by next.config.ts's images.remotePatterns
          <img
            src={recipe.image}
            alt={recipe.name}
            className="aspect-video w-full object-cover"
          />
        )}
        <CardContent>
          <CardTitle>{recipe.name}</CardTitle>
          {recipe.description && (
            <CardDescription className="line-clamp-2">
              {recipe.description}
            </CardDescription>
          )}
          {(recipe.recipeCategory || recipe.recipeCuisine) && (
            <div className="flex flex-wrap gap-2">
              {recipe.recipeCategory && (
                <Badge variant="outline">{recipe.recipeCategory}</Badge>
              )}
              {recipe.recipeCuisine && (
                <Badge variant="outline">{recipe.recipeCuisine}</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default RecipeCard;
