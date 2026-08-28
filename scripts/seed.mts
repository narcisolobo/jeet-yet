/**
 * Seeds the Firebase emulator suite (Auth + Firestore + Storage) with test
 * users and recipes, so the list/detail views have realistic data to render
 * without signing up and filling out the recipe form by hand every time the
 * emulators restart. Run via `pnpm seed` while `pnpm emulators` is running.
 *
 * The emulator hosts below are forced unconditionally, before any Firebase
 * import runs — this is what makes it structurally impossible for this
 * script to ever write to a real project, regardless of ambient env vars.
 */

process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "localhost:9199";
// This script only ever talks to the emulators above — there's no real
// credential to find. Without this, the Admin SDK's default-credential
// lookup falls through to probing the GCE metadata server, which fails
// (we're not on GCP) and logs a MetadataLookupWarning on the first call.
process.env.METADATA_SERVER_DETECTION = "none";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { SEED_FAVORITES, SEED_RECIPES, SEED_USERS } from "./seed-data.mts";

const PROJECT_ID = "jeet-yet";
const STORAGE_BUCKET = "jeet-yet.firebasestorage.app";
const SEED_ASSETS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "seed-assets",
);

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const app = initializeApp({
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
});
const adminAuth = getAuth(app);
const adminDb = getFirestore(app);
const bucket = getStorage(app).bucket();

async function wipeAll() {
  const uids: string[] = [];
  let pageToken: string | undefined;
  do {
    const result = await adminAuth.listUsers(1000, pageToken);
    uids.push(...result.users.map((user) => user.uid));
    pageToken = result.pageToken;
  } while (pageToken);
  if (uids.length > 0) {
    await adminAuth.deleteUsers(uids);
  }

  for (const collectionName of [
    "profiles",
    "handles",
    "recipes",
    "favoriteRecipes",
  ]) {
    await adminDb.recursiveDelete(adminDb.collection(collectionName));
  }

  const [files] = await bucket.getFiles({ prefix: "recipes/" });
  await Promise.all(files.map((file) => file.delete()));

  console.log(
    `Wiped ${uids.length} auth user(s), Firestore collections, and ${files.length} storage object(s).`,
  );
}

async function seedUsers(): Promise<string[]> {
  const uids: string[] = [];
  for (const user of SEED_USERS) {
    await adminAuth.createUser({
      uid: user.uid,
      email: user.email,
      password: user.password,
      displayName: user.displayName,
      emailVerified: true,
    });

    await adminDb.doc(`profiles/${user.uid}`).set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: null,
      handle: user.handle,
      createdAt: FieldValue.serverTimestamp(),
    });

    await adminDb.doc(`handles/${user.handle}`).set({ uid: user.uid });

    uids.push(user.uid);
  }
  console.log(`Seeded ${uids.length} user(s).`);
  return uids;
}

async function uploadPhoto(
  ownerId: string,
  recipeId: string,
  filename: string,
): Promise<string> {
  const filePath = path.join(SEED_ASSETS_DIR, filename);
  const buffer = await readFile(filePath);
  const contentType = CONTENT_TYPES[path.extname(filename).toLowerCase()];
  if (!contentType) {
    throw new Error(`Unrecognized image extension for seed asset: ${filename}`);
  }

  const storagePath = `recipes/${ownerId}/${recipeId}/photo`;
  await bucket.file(storagePath).save(buffer, { contentType });

  return `http://localhost:9199/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(storagePath)}?alt=media`;
}

async function seedRecipes(userUids: string[]): Promise<string[]> {
  const recipeIds: string[] = [];
  let photoCount = 0;

  for (const recipe of SEED_RECIPES) {
    const ownerId = userUids[recipe.ownerIndex];
    const ref = adminDb.collection("recipes").doc();

    const doc: Record<string, unknown> = {
      name: recipe.name,
      recipeIngredient: recipe.recipeIngredient,
      recipeInstructions: recipe.recipeInstructions,
      dateCreated: FieldValue.serverTimestamp(),
      importSourceType: recipe.importSourceType,
      ownerId,
    };

    if (recipe.description) doc.description = recipe.description;
    if (recipe.recipeYield) doc.recipeYield = recipe.recipeYield;
    if (recipe.prepTimeIso) doc.prepTime = recipe.prepTimeIso;
    if (recipe.cookTimeIso) doc.cookTime = recipe.cookTimeIso;
    if (recipe.totalTimeIso) doc.totalTime = recipe.totalTimeIso;
    if (recipe.recipeCategory) doc.recipeCategory = recipe.recipeCategory;
    if (recipe.recipeCuisine) doc.recipeCuisine = recipe.recipeCuisine;
    if (recipe.keywords?.length) doc.keywords = recipe.keywords;
    if (recipe.author) doc.author = recipe.author;
    if (recipe.isBasedOn) doc.isBasedOn = recipe.isBasedOn;

    if (recipe.photoAsset) {
      doc.image = await uploadPhoto(ownerId, ref.id, recipe.photoAsset);
      photoCount += 1;
    }

    await ref.set(doc);
    recipeIds.push(ref.id);
  }

  console.log(
    `Seeded ${recipeIds.length} recipe(s), ${photoCount} with a photo.`,
  );
  return recipeIds;
}

async function seedFavorites(userUids: string[], recipeIds: string[]) {
  let count = 0;
  for (const favorite of SEED_FAVORITES) {
    const userId = userUids[favorite.userIndex];
    const recipeId = recipeIds[favorite.recipeIndex];
    await adminDb.doc(`favoriteRecipes/${userId}_${recipeId}`).set({
      userId,
      recipeId,
    });
    count += 1;
  }
  console.log(`Seeded ${count} favorite(s).`);
}

async function main() {
  await wipeAll();
  const userUids = await seedUsers();
  const recipeIds = await seedRecipes(userUids);
  await seedFavorites(userUids, recipeIds);
  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
