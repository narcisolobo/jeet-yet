"use client";

import { AlertTriangle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RecipeIngredient } from "@/lib/firebase/recipe";

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
    <div className="border-destructive/30 flex items-start gap-2 rounded-md border p-2">
      <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        <Badge variant="destructive">Couldn&apos;t parse this line</Badge>
        <p className="text-sm wrap-break-word">
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

export default FlaggedIngredientRow;
