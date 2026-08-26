"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { useAuth } from "@/hooks/use-auth";
import { generateHandle } from "@/lib/utils";

function HandlePicker() {
  const { user, claimHandle } = useAuth();
  const [handle, setHandle] = useState(() =>
    user ? generateHandle(user) : "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);

    try {
      await claimHandle(handle);
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) {
        if (err.code === "functions/already-exists") {
          setError("That handle is already taken — try another.");
        } else if (
          err.code === "functions/internal" ||
          err.code === "functions/unavailable" ||
          err.code === "functions/deadline-exceeded"
        ) {
          setError("Couldn't connect. Please try again.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog defaultOpen>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Choose your public handle</AlertDialogTitle>
          <AlertDialogDescription>
            This is how other users will find you. You can change it later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <InputGroupText>@</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && handle && !submitting) {
                handleConfirm();
              }
            }}
            placeholder="your-handle"
            disabled={submitting}
          />
        </InputGroup>
        {error ? (
          <p className="text-destructive text-xs">{error}</p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={submitting || !handle}
          >
            {submitting ? "Confirming..." : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default HandlePicker;
