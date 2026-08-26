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
  const { user } = useAuth();
  const [handle, setHandle] = useState(() =>
    user ? generateHandle(user) : "",
  );

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
        />
        <AlertDialogFooter>
          {/* Placeholder until claimHandle (the next sign-up-flow piece) exists. */}
          <AlertDialogAction disabled>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default HandlePicker;
