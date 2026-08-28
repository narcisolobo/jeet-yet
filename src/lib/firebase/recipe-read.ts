import "server-only";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { Recipe } from "@/lib/firebase/recipe";

interface RecipeDetail extends Omit<Recipe, "dateCreated"> {
  id: string;
  dateCreated: string;
}

function toRecipeDetail(
  doc: QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
): RecipeDetail {
  const data = doc.data() as Omit<Recipe, "dateCreated"> & {
    dateCreated?: FirebaseFirestore.Timestamp;
  };
  return {
    ...data,
    id: doc.id,
    dateCreated: data.dateCreated?.toDate().toISOString() ?? "",
  };
}

/**
 * Server-only read (Admin SDK — recipes are publicly readable, so this
 * needs no auth). Returns null when the doc doesn't exist so the caller
 * can decide how to handle it (e.g. notFound()) rather than baking
 * Next.js control flow into this module.
 */
async function getRecipe(id: string): Promise<RecipeDetail | null> {
  const snapshot = await adminDb.collection("recipes").doc(id).get();
  if (!snapshot.exists) return null;
  return toRecipeDetail(snapshot);
}

async function listRecipes(): Promise<RecipeDetail[]> {
  const snapshot = await adminDb
    .collection("recipes")
    .orderBy("dateCreated", "desc")
    .get();
  return snapshot.docs.map(toRecipeDetail);
}

export { getRecipe, listRecipes };
export type { RecipeDetail };
