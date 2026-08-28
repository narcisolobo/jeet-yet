import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecipeStepsProps {
  steps: string[];
}

function RecipeSteps({ steps }: RecipeStepsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Steps</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          {steps.map((step, index) => (
            // eslint-disable-next-line @eslint-react/no-array-index-key -- steps are implicit array position with no stable identity
            <li key={index}>{step}</li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export default RecipeSteps;
