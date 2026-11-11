import { Recipe, Ingredient, Category, MeasurementUnit, RecipeVersionItem, Team, TeamMember, TeamShare } from '../types';
import { STANDARD_UNITS } from '../lib/units';

const RECIPES_KEY = 'barista_studio_recipes_v1';
const INGREDIENTS_KEY = 'barista_studio_ingredients_v1';
const CATEGORIES_KEY = 'barista_studio_categories_v1';
const UNITS_KEY = 'barista_studio_units_v1';
const VERSIONS_KEY = 'barista_studio_versions_v1';
const TEAMS_KEY = 'barista_studio_teams_v1';
const MEMBERS_KEY = 'barista_studio_team_members_v1';
const SHARES_KEY = 'barista_studio_team_shares_v1';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-espresso', user_id: 'local-user', category_type: 'recipe', name: 'Espresso Bar', slug: 'espresso-bar', sort_order: 1, created_at: new Date().toISOString() },
  { id: 'cat-milk', user_id: 'local-user', category_type: 'recipe', name: 'Milk Based', slug: 'milk-based', sort_order: 2, created_at: new Date().toISOString() },
  { id: 'cat-slow', user_id: 'local-user', category_type: 'recipe', name: 'Slow Bar & Filter', slug: 'slow-bar-filter', sort_order: 3, created_at: new Date().toISOString() },
  { id: 'cat-signature', user_id: 'local-user', category_type: 'recipe', name: 'Signature / Mocktail', slug: 'signature', sort_order: 4, created_at: new Date().toISOString() },
  { id: 'cat-tea', user_id: 'local-user', category_type: 'recipe', name: 'Tea & Infusions', slug: 'tea-infusions', sort_order: 5, created_at: new Date().toISOString() },
  { id: 'cat-noncoffee', user_id: 'local-user', category_type: 'recipe', name: 'Non-Coffee & Cocoa', slug: 'non-coffee', sort_order: 6, created_at: new Date().toISOString() },
];

const DEFAULT_TEAMS: Team[] = [
  {
    id: 'team-flagship-01',
    name: 'Barista Studio - Flagship',
    description: 'ทีมกลางสาขาหลัก สำหรับแชร์สูตร วัตถุดิบ และหมวดหมู่มาตรฐานของร้าน',
    invite_code: 'BARISTA-7788',
    owner_id: 'local-barista-01',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: 'mem-1',
    team_id: 'team-flagship-01',
    user_id: 'local-barista-01',
    email: 'barista@studio.local',
    full_name: 'Studio Barista (คุณ)',
    role: 'owner',
    joined_at: new Date().toISOString(),
  },
  {
    id: 'mem-2',
    team_id: 'team-flagship-01',
    user_id: 'user-natthawut',
    email: 'natthawut@baristastudio.dev',
    full_name: 'ณัฐวุฒิ สมบูรณ์ทรัพย์',
    role: 'admin',
    joined_at: new Date().toISOString(),
  },
  {
    id: 'mem-3',
    team_id: 'team-flagship-01',
    user_id: 'user-somchai',
    email: 'somchai@baristastudio.dev',
    full_name: 'สมชาย กาแฟดี',
    role: 'barista',
    joined_at: new Date().toISOString(),
  },
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

  getTeams(): Team[] {
    const raw = localStorage.getItem(TEAMS_KEY);
    if (!raw) {
      localStorage.setItem(TEAMS_KEY, JSON.stringify(DEFAULT_TEAMS));
      return DEFAULT_TEAMS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_TEAMS;
    }
  },

  saveTeams(teams: Team[]) {
    localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
  },

  getTeamMembers(): TeamMember[] {
    const raw = localStorage.getItem(MEMBERS_KEY);
    if (!raw) {
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(DEFAULT_MEMBERS));
      return DEFAULT_MEMBERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_MEMBERS;
    }
  },

  saveTeamMembers(members: TeamMember[]) {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
  },

  getTeamShares(): TeamShare[] {
    const raw = localStorage.getItem(SHARES_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveTeamShares(shares: TeamShare[]) {
    localStorage.setItem(SHARES_KEY, JSON.stringify(shares));
  },
};
