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
import { Input } from "@/components/ui/input";
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
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "functions/already-exists"
      ) {
        setError("That handle is already taken — try another.");
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
        <Input
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          placeholder="your-handle"
          disabled={submitting}
        />
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
