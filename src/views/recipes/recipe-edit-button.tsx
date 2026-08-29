"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils/index";

interface RecipeEditButtonProps {
  recipeId: string;
  ownerId: string;
  className?: string;
}

function RecipeEditButton({
  recipeId,
  ownerId,
  className,
}: RecipeEditButtonProps) {
  const { user, loading } = useAuth();

  if (loading || user?.uid !== ownerId) {
    return null;
  }

  return (
    <Link
      href={`/recipes/${recipeId}/edit`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), className)}
    >
      <Pencil />
      Edit
    </Link>
  );
}

export default RecipeEditButton;
