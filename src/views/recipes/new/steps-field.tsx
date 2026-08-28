"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

interface StepRow {
  id: string;
  text: string;
}

function StepsField() {
  const [stepRows, setStepRows] = useState<StepRow[]>([]);

  function handleAddStep() {
    setStepRows((rows) => [...rows, { id: crypto.randomUUID(), text: "" }]);
  }

  function handleStepTextChange(id: string, value: string) {
    setStepRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, text: value } : row)),
    );
  }

  function handleRemoveStep(id: string) {
    setStepRows((rows) => rows.filter((row) => row.id !== id));
  }

  function handleMoveStep(id: string, direction: "up" | "down") {
    setStepRows((rows) => {
      const index = rows.findIndex((row) => row.id === id);
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || targetIndex < 0 || targetIndex >= rows.length) {
        return rows;
      }
      const next = [...rows];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  return (
    <Field className="w-full min-w-sm">
      <FieldLabel>Steps</FieldLabel>
      <input
        type="hidden"
        name="steps"
        value={JSON.stringify(stepRows.map((row) => row.text))}
      />
      {stepRows.length > 0 && (
        <ol className="space-y-3">
          {stepRows.map((row, index) => (
            <li key={row.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Step {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Move step up"
                    disabled={index === 0}
                    onClick={() => handleMoveStep(row.id, "up")}
                  >
                    <ChevronUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Move step down"
                    disabled={index === stepRows.length - 1}
                    onClick={() => handleMoveStep(row.id, "down")}
                  >
                    <ChevronDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Remove step"
                    onClick={() => handleRemoveStep(row.id)}
                  >
                    <X />
                  </Button>
                </div>
              </div>
              <Textarea
                value={row.text}
                aria-label={`Step ${index + 1} instructions`}
                onChange={(event) =>
                  handleStepTextChange(row.id, event.target.value)
                }
              />
            </li>
          ))}
        </ol>
      )}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={handleAddStep}
      >
        Add step
      </Button>
    </Field>
  );
}

export default StepsField;
