"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  STANDARD_UNITS,
  type RecipeIngredient,
  type StandardUnit,
} from "@/lib/firebase/recipe";
import { cn } from "@/lib/utils";

function FixIngredientRow({
  initialIngredient,
  onSave,
  onCancel,
}: {
  initialIngredient: RecipeIngredient;
  onSave: (ingredient: RecipeIngredient) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(
    initialIngredient.rawOverride ?? initialIngredient.name,
  );
  const [amount, setAmount] = useState(
    initialIngredient.amount != null ? String(initialIngredient.amount) : "",
  );
  const [unit, setUnit] = useState(initialIngredient.unit ?? "");
  const [preparation, setPreparation] = useState(
    initialIngredient.preparation ?? "",
  );
  const [notes, setNotes] = useState(initialIngredient.notes ?? "");

  function handleSave() {
    if (!name.trim()) return;
    const ingredient: RecipeIngredient = { name: name.trim() };
    if (amount.trim()) ingredient.amount = Number(amount);
    if (unit.trim()) ingredient.unit = unit.trim() as StandardUnit;
    if (preparation.trim()) ingredient.preparation = preparation.trim();
    if (notes.trim()) ingredient.notes = notes.trim();
    onSave(ingredient);
  }

  return (
    <div className="border-border space-y-2 rounded-md border p-2">
      <div className="flex gap-2">
        <Input
          value={amount}
          type="number"
          aria-label="Amount"
          placeholder="Amount"
          className="w-24 shrink-0"
          onChange={(event) => setAmount(event.target.value)}
        />
        <select
          value={unit}
          aria-label="Unit"
          className={cn(
            "border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-9 w-28 shrink-0 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-3 md:text-sm",
          )}
          onChange={(event) => setUnit(event.target.value)}
        >
          <option value="">No unit</option>
          {STANDARD_UNITS.map((standardUnit) => (
            <option key={standardUnit} value={standardUnit}>
              {standardUnit}
            </option>
          ))}
        </select>
        <Input
          value={name}
          aria-label="Ingredient name"
          placeholder="Name"
          className="min-w-0 flex-1"
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <Input
        value={preparation}
        aria-label="Preparation"
        placeholder="Preparation (optional), e.g. chopped, minced"
        onChange={(event) => setPreparation(event.target.value)}
      />
      <Input
        value={notes}
        aria-label="Notes"
        placeholder="Notes (optional), e.g. room temperature"
        onChange={(event) => setNotes(event.target.value)}
      />
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

export default FixIngredientRow;
