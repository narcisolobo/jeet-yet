// Seed data for the Firebase emulator suite. Pure data — no Firebase
// imports here, so this file has no side effects and can't accidentally
// touch a real project. See scripts/seed.mts for the logic that writes it.

interface SeedUser {
  uid: string;
  email: string;
  password: string;
  displayName: string;
  handle: string;
}

interface SeedIngredient {
  name: string;
  amount?: number;
  unit?: string;
  preparation?: string;
  notes?: string;
  rawOverride?: string;
}

interface SeedRecipe {
  ownerIndex: number;
  name: string;
  description?: string;
  recipeIngredient: SeedIngredient[];
  recipeInstructions: string[];
  recipeYield?: string;
  prepTimeIso?: string;
  cookTimeIso?: string;
  totalTimeIso?: string;
  recipeCategory?: string;
  recipeCuisine?: string;
  keywords?: string[];
  author?: string;
  importSourceType: "url" | "photo" | "manual";
  isBasedOn?: string;
  /** Filename under scripts/seed-assets/ to upload as this recipe's photo. */
  photoAsset?: string;
}

interface SeedFavorite {
  userIndex: number;
  recipeIndex: number;
}

const SEED_USERS: SeedUser[] = [
  {
    uid: "seed-user-1",
    email: "alice@example.com",
    password: "password123",
    displayName: "Alice Baker",
    handle: "alice",
  },
  {
    uid: "seed-user-2",
    email: "bob@example.com",
    password: "password123",
    displayName: "Bob Carter",
    handle: "bob",
  },
  {
    uid: "seed-user-3",
    email: "carol@example.com",
    password: "password123",
    displayName: "Carol Diaz",
    handle: "carol",
  },
];

const SEED_RECIPES: SeedRecipe[] = [
  // Alice
  {
    ownerIndex: 0,
    name: "Classic Margherita Pizza",
    description: "Simple weeknight pizza with fresh mozzarella and basil.",
    recipeIngredient: [
      { name: "pizza dough", amount: 1, unit: "piece" },
      { name: "crushed tomatoes", amount: 200, unit: "gram" },
      { name: "fresh mozzarella", amount: 8, unit: "ounce", preparation: "torn" },
      { name: "fresh basil leaves", amount: 10, unit: "piece" },
      { name: "olive oil", amount: 1, unit: "tablespoon" },
      { name: "salt", rawOverride: "salt, to taste" },
    ],
    recipeInstructions: [
      "Preheat oven to 500°F with a pizza stone or steel inside.",
      "Stretch the dough into a 12-inch round on a floured surface.",
      "Spread crushed tomatoes over the dough, leaving a 1-inch border.",
      "Scatter torn mozzarella over the sauce.",
      "Bake for 10-12 minutes until the crust is browned and cheese is bubbling.",
      "Top with fresh basil, a drizzle of olive oil, and salt before serving.",
    ],
    recipeYield: "1 pizza (4 servings)",
    prepTimeIso: "PT20M",
    cookTimeIso: "PT12M",
    totalTimeIso: "PT32M",
    recipeCategory: "Main",
    recipeCuisine: "Italian",
    keywords: ["pizza", "vegetarian", "weeknight"],
    author: "Alice Baker",
    importSourceType: "manual",
    photoAsset: "landscape-food.jpg",
  },
  {
    ownerIndex: 0,
    name: "Weeknight Chicken Stir-Fry",
    description: "Quick stir-fry with whatever vegetables are in the fridge.",
    recipeIngredient: [
      { name: "boneless chicken thighs", amount: 1, unit: "pound", preparation: "cut into strips" },
      { name: "soy sauce", amount: 3, unit: "tablespoon" },
      { name: "garlic", amount: 3, unit: "clove", preparation: "minced" },
      { name: "fresh ginger", amount: 1, unit: "piece", preparation: "grated" },
      { name: "broccoli florets", amount: 2, unit: "cup" },
      { name: "vegetable oil", amount: 2, unit: "tablespoon" },
      { name: "salt and pepper", rawOverride: "salt and pepper, to taste" },
    ],
    recipeInstructions: [
      "Toss chicken strips with 1 tablespoon soy sauce and set aside.",
      "Heat oil in a wok or large skillet over high heat.",
      "Stir-fry chicken until browned and cooked through, about 5 minutes; remove.",
      "Add garlic and ginger, stir-fry 30 seconds until fragrant.",
      "Add broccoli and stir-fry 3-4 minutes until crisp-tender.",
      "Return chicken to the pan, add remaining soy sauce, toss to combine, and season to taste.",
    ],
    recipeYield: "4 servings",
    prepTimeIso: "PT15M",
    cookTimeIso: "PT10M",
    totalTimeIso: "PT25M",
    recipeCategory: "Main",
    recipeCuisine: "Chinese-American",
    keywords: ["stir-fry", "chicken", "weeknight"],
    author: "Alice Baker",
    importSourceType: "manual",
  },
  {
    ownerIndex: 0,
    name: "Overnight Oats",
    description: "Make-ahead breakfast oats with banana and honey.",
    recipeIngredient: [
      { name: "rolled oats", amount: 0.5, unit: "cup" },
      { name: "milk", amount: 0.5, unit: "cup" },
      { name: "plain yogurt", amount: 0.25, unit: "cup" },
      { name: "honey", amount: 1, unit: "tablespoon" },
      { name: "banana", amount: 1, unit: "piece", preparation: "sliced" },
    ],
    recipeInstructions: [
      "Combine oats, milk, yogurt, and honey in a jar.",
      "Stir well, cover, and refrigerate overnight.",
      "Top with sliced banana before serving.",
    ],
    recipeYield: "1 serving",
    prepTimeIso: "PT5M",
    totalTimeIso: "PT5M",
    recipeCategory: "Breakfast",
    recipeCuisine: "American",
    keywords: ["breakfast", "make-ahead", "oats"],
    author: "Alice Baker",
    importSourceType: "url",
    isBasedOn: "https://example.com/recipes/overnight-oats",
  },

  // Bob
  {
    ownerIndex: 1,
    name: "Beef Chili",
    description: "Hearty chili for a cold night, best with cornbread.",
    recipeIngredient: [
      { name: "ground beef", amount: 1, unit: "pound" },
      { name: "yellow onion", amount: 1, unit: "piece", preparation: "diced" },
      { name: "diced tomatoes", amount: 1, unit: "can" },
      { name: "kidney beans", amount: 1, unit: "can", preparation: "drained" },
      { name: "chili powder", amount: 2, unit: "tablespoon" },
      { name: "cumin", amount: 1, unit: "teaspoon" },
    ],
    recipeInstructions: [
      "Brown the ground beef with the onion in a large pot over medium heat.",
      "Stir in chili powder and cumin, cook 1 minute until fragrant.",
      "Add diced tomatoes and kidney beans.",
      "Simmer uncovered for 45 minutes, stirring occasionally.",
      "Season to taste and serve hot.",
    ],
    recipeYield: "6 servings",
    prepTimeIso: "PT15M",
    cookTimeIso: "PT45M",
    totalTimeIso: "PT1H",
    recipeCategory: "Main",
    recipeCuisine: "Tex-Mex",
    keywords: ["chili", "beef", "comfort food"],
    author: "Bob Carter",
    importSourceType: "manual",
    photoAsset: "portrait-food.jpg",
  },
  {
    ownerIndex: 1,
    name: "Garlic Butter Shrimp",
    description: "Ten-minute shrimp in a garlicky butter sauce.",
    recipeIngredient: [
      { name: "large shrimp", amount: 1, unit: "pound", preparation: "peeled and deveined" },
      { name: "butter", amount: 4, unit: "tablespoon" },
      { name: "garlic", amount: 4, unit: "clove", preparation: "minced" },
      { name: "lemon juice", amount: 1, unit: "tablespoon" },
      { name: "parsley", amount: 2, unit: "tablespoon", preparation: "chopped" },
    ],
    recipeInstructions: [
      "Melt butter in a large skillet over medium-high heat.",
      "Add garlic and cook 30 seconds until fragrant.",
      "Add shrimp in a single layer and cook 2 minutes per side until pink.",
      "Remove from heat, stir in lemon juice and parsley.",
      "Serve immediately, ideally over rice or with crusty bread.",
    ],
    recipeYield: "4 servings",
    prepTimeIso: "PT10M",
    cookTimeIso: "PT8M",
    totalTimeIso: "PT18M",
    recipeCategory: "Main",
    recipeCuisine: "Seafood",
    keywords: ["shrimp", "quick", "garlic"],
    author: "Bob Carter",
    importSourceType: "manual",
  },
  {
    ownerIndex: 1,
    name: "Banana Bread",
    description: "Classic banana bread that uses up overripe bananas.",
    recipeIngredient: [
      { name: "ripe bananas", rawOverride: "3 ripe bananas, mashed" },
      { name: "all-purpose flour", amount: 1.5, unit: "cup" },
      { name: "sugar", amount: 0.75, unit: "cup" },
      { name: "butter", amount: 0.33, unit: "cup", preparation: "melted" },
      { name: "baking soda", amount: 1, unit: "teaspoon" },
      { name: "egg", amount: 1, unit: "piece" },
    ],
    recipeInstructions: [
      "Preheat oven to 350°F and grease a loaf pan.",
      "Mix mashed bananas, melted butter, sugar, and egg in a bowl.",
      "Sprinkle baking soda over the mixture and stir in.",
      "Fold in flour until just combined.",
      "Pour into the loaf pan and bake 55-60 minutes until a toothpick comes out clean.",
    ],
    recipeYield: "1 loaf",
    prepTimeIso: "PT15M",
    cookTimeIso: "PT1H",
    totalTimeIso: "PT1H15M",
    recipeCategory: "Baking",
    recipeCuisine: "American",
    keywords: ["banana bread", "baking", "breakfast"],
    author: "Bob Carter",
    importSourceType: "manual",
  },

  // Carol
  {
    ownerIndex: 2,
    name: "Thai Green Curry",
    description: "Weeknight green curry with chicken and vegetables.",
    recipeIngredient: [
      { name: "green curry paste", amount: 3, unit: "tablespoon" },
      { name: "coconut milk", amount: 1, unit: "can" },
      { name: "chicken breast", amount: 1, unit: "pound", preparation: "sliced" },
      { name: "bell pepper", amount: 1, unit: "piece", preparation: "sliced" },
      { name: "fish sauce", amount: 1, unit: "tablespoon" },
      { name: "Thai basil", amount: 0.25, unit: "cup" },
    ],
    recipeInstructions: [
      "Fry curry paste in a pot over medium heat until fragrant, about 1 minute.",
      "Add the thick part of the coconut milk and stir until it separates slightly.",
      "Add chicken and cook until no longer pink on the outside.",
      "Pour in remaining coconut milk and fish sauce, simmer 10 minutes.",
      "Add bell pepper and simmer 5 more minutes until chicken is cooked through.",
      "Stir in Thai basil just before serving.",
    ],
    recipeYield: "4 servings",
    prepTimeIso: "PT10M",
    cookTimeIso: "PT20M",
    totalTimeIso: "PT30M",
    recipeCategory: "Main",
    recipeCuisine: "Thai",
    keywords: ["curry", "chicken", "coconut"],
    author: "Carol Diaz",
    importSourceType: "manual",
  },
  {
    ownerIndex: 2,
    name: "Caprese Salad",
    description: "Tomato, mozzarella, and basil with olive oil and balsamic.",
    recipeIngredient: [
      { name: "ripe tomatoes", amount: 3, unit: "piece", preparation: "sliced" },
      { name: "fresh mozzarella", amount: 8, unit: "ounce", preparation: "sliced" },
      { name: "fresh basil leaves", amount: 12, unit: "piece" },
      { name: "olive oil", amount: 2, unit: "tablespoon" },
      { name: "balsamic glaze", amount: 1, unit: "tablespoon" },
    ],
    recipeInstructions: [
      "Arrange alternating slices of tomato and mozzarella on a platter.",
      "Tuck basil leaves between the slices.",
      "Drizzle with olive oil and balsamic glaze.",
      "Season with salt and pepper to taste and serve immediately.",
    ],
    recipeYield: "4 servings",
    prepTimeIso: "PT10M",
    totalTimeIso: "PT10M",
    recipeCategory: "Side",
    recipeCuisine: "Italian",
    keywords: ["salad", "tomato", "no-cook"],
    author: "Carol Diaz",
    importSourceType: "photo",
  },
  {
    ownerIndex: 2,
    name: "Chocolate Chip Cookies",
    description: "Classic chewy chocolate chip cookies.",
    recipeIngredient: [
      { name: "all-purpose flour", amount: 2.25, unit: "cup" },
      { name: "butter", amount: 1, unit: "cup", preparation: "softened" },
      { name: "brown sugar", amount: 0.75, unit: "cup" },
      { name: "granulated sugar", amount: 0.75, unit: "cup" },
      { name: "eggs", amount: 2, unit: "piece" },
      { name: "chocolate chips", amount: 1, unit: "package" },
      { name: "baking soda", amount: 1, unit: "teaspoon" },
    ],
    recipeInstructions: [
      "Preheat oven to 375°F and line baking sheets with parchment.",
      "Cream butter with both sugars until light and fluffy.",
      "Beat in eggs one at a time.",
      "Mix in flour and baking soda until just combined.",
      "Fold in chocolate chips.",
      "Drop rounded tablespoons of dough onto baking sheets and bake 9-11 minutes.",
    ],
    recipeYield: "about 24 cookies",
    prepTimeIso: "PT15M",
    cookTimeIso: "PT10M",
    totalTimeIso: "PT25M",
    recipeCategory: "Baking",
    recipeCuisine: "American",
    keywords: ["cookies", "chocolate", "baking"],
    author: "Carol Diaz",
    importSourceType: "manual",
  },
];

const SEED_FAVORITES: SeedFavorite[] = [
  { userIndex: 1, recipeIndex: 0 }, // Bob favorites Alice's pizza
  { userIndex: 2, recipeIndex: 3 }, // Carol favorites Bob's chili
  { userIndex: 0, recipeIndex: 6 }, // Alice favorites Carol's Thai curry
];

export { SEED_FAVORITES, SEED_RECIPES, SEED_USERS };
export type { SeedFavorite, SeedIngredient, SeedRecipe, SeedUser };
