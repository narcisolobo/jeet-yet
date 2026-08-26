import type { User } from "firebase/auth";
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
  type Config,
} from "unique-names-generator";

function generateRandomHandle(): string {
  const config: Config = {
    dictionaries: [adjectives, colors, animals],
    separator: "-",
    style: "lowerCase",
  };

  return uniqueNamesGenerator(config);
}

function generateSuggestedHandle(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateHandle(user: User): string {
  if (user.displayName) {
    const handle = generateSuggestedHandle(user.displayName);
    if (handle) return handle;
  }

  if (user.email) {
    const handle = generateSuggestedHandle(user.email.split("@")[0]);
    if (handle) return handle;
  }

  return generateRandomHandle();
}

export { generateHandle };
