import { Recipe, Ingredient, Category, MeasurementUnit, RecipeVersionItem } from '../types';
import { STANDARD_UNITS } from '../lib/units';

const RECIPES_KEY = 'barista_studio_recipes_v1';
const INGREDIENTS_KEY = 'barista_studio_ingredients_v1';
const CATEGORIES_KEY = 'barista_studio_categories_v1';
const UNITS_KEY = 'barista_studio_units_v1';
const VERSIONS_KEY = 'barista_studio_versions_v1';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-espresso', user_id: 'local-user', category_type: 'recipe', name: 'Espresso Bar', slug: 'espresso-bar', sort_order: 1, created_at: new Date().toISOString() },
  { id: 'cat-milk', user_id: 'local-user', category_type: 'recipe', name: 'Milk Based', slug: 'milk-based', sort_order: 2, created_at: new Date().toISOString() },
  { id: 'cat-slow', user_id: 'local-user', category_type: 'recipe', name: 'Slow Bar & Filter', slug: 'slow-bar-filter', sort_order: 3, created_at: new Date().toISOString() },
  { id: 'cat-signature', user_id: 'local-user', category_type: 'recipe', name: 'Signature / Mocktail', slug: 'signature', sort_order: 4, created_at: new Date().toISOString() },
  { id: 'cat-tea', user_id: 'local-user', category_type: 'recipe', name: 'Tea & Infusions', slug: 'tea-infusions', sort_order: 5, created_at: new Date().toISOString() },
  { id: 'cat-noncoffee', user_id: 'local-user', category_type: 'recipe', name: 'Non-Coffee & Cocoa', slug: 'non-coffee', sort_order: 6, created_at: new Date().toISOString() },
];

export const localStore = {
  getRecipes(): Recipe[] {
    const raw = localStorage.getItem(RECIPES_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveRecipes(recipes: Recipe[]) {
    localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
  },

  getIngredients(): Ingredient[] {
    const raw = localStorage.getItem(INGREDIENTS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveIngredients(ingredients: Ingredient[]) {
    localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));
  },

  getCategories(): Category[] {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategories(categories: Category[]) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  },

  getUnits(): MeasurementUnit[] {
    const raw = localStorage.getItem(UNITS_KEY);
    if (!raw) {
      localStorage.setItem(UNITS_KEY, JSON.stringify(STANDARD_UNITS));
      return STANDARD_UNITS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return STANDARD_UNITS;
    }
  },

  saveUnits(units: MeasurementUnit[]) {
    localStorage.setItem(UNITS_KEY, JSON.stringify(units));
  },

  getVersions(recipeId: string): RecipeVersionItem[] {
    const raw = localStorage.getItem(VERSIONS_KEY);
    if (!raw) return [];
    try {
      const all: RecipeVersionItem[] = JSON.parse(raw);
      return all.filter((v) => v.recipe_id === recipeId);
    } catch {
      return [];
    }
  },

  saveVersion(version: RecipeVersionItem) {
    const raw = localStorage.getItem(VERSIONS_KEY);
    const all: RecipeVersionItem[] = raw ? JSON.parse(raw) : [];
    all.unshift(version);
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(all));
  },
};
