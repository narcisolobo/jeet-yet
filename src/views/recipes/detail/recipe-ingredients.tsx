import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecipeIngredient } from "@/lib/firebase/recipe";
import { formatIngredientLine } from "@/lib/utils/format-ingredient";

interface RecipeIngredientsProps {
  ingredients: RecipeIngredient[];
}

function RecipeIngredients({ ingredients }: RecipeIngredientsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingredients</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {ingredients.map((ingredient, index) => (
            // eslint-disable-next-line @eslint-react/no-array-index-key -- ingredient order is implicit array position with no stable identity
            <li key={index}>{formatIngredientLine(ingredient)}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default RecipeIngredients;
