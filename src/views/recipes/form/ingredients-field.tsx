"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLegend, FieldSet } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { functions } from "@/lib/firebase";
import type { RecipeIngredient } from "@/lib/firebase/recipe";
import { formatIngredientLine } from "@/lib/utils/format-ingredient";
import { httpsCallable } from "firebase/functions";
import { Pencil, X } from "lucide-react";
import { useState } from "react";
import FixIngredientRow from "./ingredients/fix-ingredient-row";
import FlaggedIngredientRow from "./ingredients/flagged-ingredient-row";

interface IngredientRow {
  id: string;
  flagged: boolean;
  ingredient: RecipeIngredient;
}

interface ParsedIngredientRow {
  flagged: boolean;
  ingredient: RecipeIngredient;
}

/**
 * Server-side parser (Python Cloud Function, `ingredient-parser` — see
 * `docs/specs/recipe.md`'s Open Questions for why this isn't a client-side
 * regex parser) — a confidence-scored ML model, unlike anything feasible to
 * run in the browser. `parseIngredientLines` calls it with the pasted
 * lines and gets back one row per line, each either structured or flagged
 * for the user to fix/dismiss (see create-recipe-from-form.md).
 */
const parseIngredientLines = httpsCallable<
  { lines: string[] },
  ParsedIngredientRow[]
>(functions, "parse_ingredients");

interface IngredientsFieldProps {
  initialIngredients?: RecipeIngredient[];
}

function IngredientsField({ initialIngredients = [] }: IngredientsFieldProps) {
  const [ingredientDraft, setIngredientDraft] = useState("");
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>(() =>
    initialIngredients.map((ingredient) => ({
      id: crypto.randomUUID(),
      flagged: false,
      ingredient,
    })),
  );
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fixingRowId, setFixingRowId] = useState<string | null>(null);

  async function handleAddIngredientsFromDraft() {
    const lines = ingredientDraft
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    setIsParsing(true);
    setParseError(null);
    try {
      const { data } = await parseIngredientLines({ lines });
      const newRows: IngredientRow[] = data.map((row) => ({
        id: crypto.randomUUID(),
        flagged: row.flagged,
        ingredient: row.ingredient,
      }));
      setIngredientRows((rows) => [...rows, ...newRows]);
      setIngredientDraft("");
    } catch {
      setParseError("Couldn't parse those ingredients. Please try again.");
    } finally {
      setIsParsing(false);
    }
  }

  function handleDismissFlag(id: string) {
    setIngredientRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, flagged: false } : row)),
    );
  }

  function handleSaveFixedRow(id: string, ingredient: RecipeIngredient) {
    setIngredientRows((rows) =>
      rows.map((row) =>
        row.id === id ? { ...row, flagged: false, ingredient } : row,
      ),
    );
    setFixingRowId(null);
  }

  function handleRemoveIngredient(id: string) {
    setIngredientRows((rows) => rows.filter((row) => row.id !== id));
    if (fixingRowId === id) setFixingRowId(null);
  }

  return (
    <FieldSet className="border-border w-full rounded-lg border p-4">
      <FieldLegend variant="label">
        Ingredients
        <Badge className="bg-info text-info-foreground">required</Badge>
      </FieldLegend>
      <input
        type="hidden"
        name="ingredients"
        value={JSON.stringify(ingredientRows.map((row) => row.ingredient))}
      />
      <input
        type="hidden"
        name="ingredientsUnresolvedCount"
        value={ingredientRows.filter((row) => row.flagged).length}
      />
      <Textarea
        id="ingredients-draft"
        aria-label="Ingredients"
        placeholder={
          "Paste ingredients, one per line, e.g.\n2 cups flour\n1 tsp salt"
        }
        value={ingredientDraft}
        onChange={(event) => setIngredientDraft(event.target.value)}
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={!ingredientDraft.trim() || isParsing}
        onClick={handleAddIngredientsFromDraft}
      >
        {isParsing && <Spinner className="size-4" />}
        Add ingredients
      </Button>
      {parseError && <FieldError>{parseError}</FieldError>}
      {ingredientRows.length > 0 && (
        <ul className="space-y-2">
          {ingredientRows.map((row) => (
            <li key={row.id}>
              {fixingRowId === row.id ? (
                <FixIngredientRow
                  initialIngredient={row.ingredient}
                  onSave={(ingredient) =>
                    handleSaveFixedRow(row.id, ingredient)
                  }
                  onCancel={() => setFixingRowId(null)}
                />
              ) : row.flagged ? (
                <FlaggedIngredientRow
                  ingredient={row.ingredient}
                  onFix={() => setFixingRowId(row.id)}
                  onDismiss={() => handleDismissFlag(row.id)}
                  onRemove={() => handleRemoveIngredient(row.id)}
                />
              ) : (
                <div className="group flex items-center gap-2">
                  <span className="flex-1 text-sm">
                    {formatIngredientLine(row.ingredient)}
                  </span>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Edit ingredient"
                          className="cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                          onClick={() => setFixingRowId(row.id)}
                        >
                          <Pencil />
                        </Button>
                      }
                    />
                    <TooltipContent>Edit</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Remove ingredient"
                          className="cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                          onClick={() => handleRemoveIngredient(row.id)}
                        >
                          <X />
                        </Button>
                      }
                    />
                    <TooltipContent>Remove</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </FieldSet>
  );
}

export default IngredientsField;
