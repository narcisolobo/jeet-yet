"use client";

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { AlertTriangle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { functions } from "@/lib/firebase";
import type { RecipeIngredient, StandardUnit } from "@/lib/firebase/recipe";

interface IngredientRow {
  id: string;
  flagged: boolean;
  ingredient: RecipeIngredient;
}

interface ParsedIngredientRow {
  flagged: boolean;
  ingredient: RecipeIngredient;
}

// Server-side parser (Python Cloud Function, `ingredient-parser` — see
// docs/specs/recipe.md's Open Questions for why this isn't a client-side
// regex parser) — a confidence-scored ML model, unlike anything feasible to
// run in the browser. `parseIngredientLines` calls it with the pasted
// lines and gets back one row per line, each either structured or flagged
// for the user to fix/dismiss (see create-recipe-from-form.md).
const parseIngredientLines = httpsCallable<
  { lines: string[] },
  ParsedIngredientRow[]
>(functions, "parse_ingredients");

function formatIngredientLine(ingredient: RecipeIngredient): string {
  const amountUnit = [
    ingredient.amount != null ? String(ingredient.amount) : null,
    ingredient.unit ?? null,
  ]
    .filter(Boolean)
    .join(" ");
  const line = [amountUnit, ingredient.name].filter(Boolean).join(" ");
  const extras = [ingredient.preparation, ingredient.notes].filter(Boolean);
  return extras.length > 0 ? `${line} (${extras.join(", ")})` : line;
}

function FlaggedIngredientRow({
  ingredient,
  onFix,
  onDismiss,
  onRemove,
}: {
  ingredient: RecipeIngredient;
  onFix: () => void;
  onDismiss: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/30 p-2">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1 space-y-1">
        <Badge variant="destructive">Couldn&apos;t parse this line</Badge>
        <p className="text-sm break-words">
          {ingredient.rawOverride ?? ingredient.name}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button type="button" size="sm" variant="secondary" onClick={onFix}>
          Fix
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onDismiss}>
          Dismiss
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Remove ingredient"
          onClick={onRemove}
        >
          <X />
        </Button>
      </div>
    </div>
  );
}

function FixIngredientRow({
  initialText,
  onSave,
  onCancel,
}: {
  initialText: string;
  onSave: (ingredient: RecipeIngredient) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialText);
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("");

  function handleSave() {
    if (!name.trim()) return;
    const ingredient: RecipeIngredient = { name: name.trim() };
    if (amount.trim()) ingredient.amount = Number(amount);
    if (unit.trim()) ingredient.unit = unit.trim() as StandardUnit;
    onSave(ingredient);
  }

  return (
    <div className="space-y-2 rounded-md border border-border p-2">
      <div className="flex gap-2">
        <Input
          value={name}
          aria-label="Ingredient name"
          placeholder="Name"
          className="min-w-0 flex-1"
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          value={amount}
          type="number"
          aria-label="Amount"
          placeholder="Amount"
          className="w-24 shrink-0"
          onChange={(event) => setAmount(event.target.value)}
        />
        <Input
          value={unit}
          aria-label="Unit"
          placeholder="Unit"
          className="w-28 shrink-0"
          onChange={(event) => setUnit(event.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!name.trim()}
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

function IngredientsField() {
  const [ingredientDraft, setIngredientDraft] = useState("");
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([]);
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
    <Field className="w-full min-w-sm">
      <FieldLabel htmlFor="ingredients-draft">Ingredients</FieldLabel>
      <Textarea
        id="ingredients-draft"
        placeholder={"Paste ingredients, one per line, e.g.\n2 cups flour\n1 tsp salt"}
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
                  initialText={row.ingredient.rawOverride ?? row.ingredient.name}
                  onSave={(ingredient) => handleSaveFixedRow(row.id, ingredient)}
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
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm">
                    {formatIngredientLine(row.ingredient)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Remove ingredient"
                    onClick={() => handleRemoveIngredient(row.id)}
                  >
                    <X />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Field>
  );
}

export default IngredientsField;
