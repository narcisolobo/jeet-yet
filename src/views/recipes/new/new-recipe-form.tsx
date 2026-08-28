import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import IngredientsField from "./ingredients-field";
import PhotoField from "./photo-field";
import StepsField from "./steps-field";
import TagsField from "./tags-field";

function NewRecipeForm() {
  return (
    <Card className="w-[clamp(360px,50vw,540px)]">
      <CardHeader>
        <CardTitle as="h2" className="text-lg">
          Create New Recipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="flex gap-4">
            <Field className="min-w-0 flex-1">
              <FieldLabel htmlFor="title">
                Recipe Title
                <Badge className="bg-info text-info-foreground">required</Badge>
              </FieldLabel>
              <Input
                id="title"
                name="title"
                type="text"
                aria-required
                required
              />
              <FieldError></FieldError>
            </Field>
            <Field className="w-24 shrink-0">
              <FieldLabel htmlFor="servings">Servings</FieldLabel>
              <Input id="servings" name="servings" type="number" min="1" />
            </Field>
          </div>
          <PhotoField />
          <Field className="w-full min-w-sm">
            <FieldLabel htmlFor="description">Recipe Description</FieldLabel>
            <Textarea id="description" name="description" />
          </Field>
          <IngredientsField />
          <StepsField />
          <div className="flex gap-4">
            <Field className="min-w-0 flex-1">
              <FieldLabel htmlFor="prep-time">Prep (min)</FieldLabel>
              <Input
                id="prep-time"
                name="prepTimeMinutes"
                type="number"
                min="0"
              />
            </Field>
            <Field className="min-w-0 flex-1">
              <FieldLabel htmlFor="cook-time">Cook (min)</FieldLabel>
              <Input
                id="cook-time"
                name="cookTimeMinutes"
                type="number"
                min="0"
              />
            </Field>
            <Field className="min-w-0 flex-1">
              <FieldLabel htmlFor="total-time">Total (min)</FieldLabel>
              <Input
                id="total-time"
                name="totalTimeMinutes"
                type="number"
                min="0"
              />
            </Field>
          </div>
          <div className="flex gap-4">
            <Field className="min-w-0 flex-1">
              <FieldLabel htmlFor="category">Category</FieldLabel>
              <Input
                id="category"
                name="category"
                type="text"
                placeholder="e.g. Entree, Dessert, Appetizer"
              />
            </Field>
            <Field className="min-w-0 flex-1">
              <FieldLabel htmlFor="cuisine">Cuisine</FieldLabel>
              <Input
                id="cuisine"
                name="cuisine"
                type="text"
                placeholder="e.g. Italian, Mexican, Thai"
              />
            </Field>
          </div>
          <TagsField />
        </form>
      </CardContent>
    </Card>
  );
}

export default NewRecipeForm;
