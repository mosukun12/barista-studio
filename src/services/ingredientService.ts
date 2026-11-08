import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Ingredient, Category, MeasurementUnit } from '../types';
import { localStore } from './localStore';

export const ingredientService = {
  async getIngredients(): Promise<Ingredient[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('ingredients')
        .select(`
          *,
          categories:category_id (name),
          measurement_units:default_unit_id (symbol)
        `)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching ingredients from Supabase:', error);
        throw new Error(error.message);
      }

      return (data || []).map((row: any) => ({
        ...row,
        category_name: row.categories?.name,
        default_unit_symbol: row.measurement_units?.symbol,
      }));
    }

    return localStore.getIngredients();
  },

  async getIngredientById(id: string): Promise<Ingredient | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data as Ingredient;
    }

    const items = localStore.getIngredients();
    return items.find((i) => i.id === id) || null;
  },

  async createIngredient(data: Partial<Ingredient>): Promise<Ingredient> {
    const now = new Date().toISOString();
    const newIngredient: Ingredient = {
      id: crypto.randomUUID(),
      user_id: 'default_user',
      name: data.name?.trim() || 'New Ingredient',
      brand: data.brand?.trim() || null,
      category_id: data.category_id || null,
      default_unit_id: data.default_unit_id || null,
      description: data.description?.trim() || null,
      image_url: data.image_url || null,
      notes: data.notes?.trim() || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { data: user } = await supabase.auth.getUser();
      if (user?.user) {
        newIngredient.user_id = user.user.id;
      }

      const { data: inserted, error } = await (supabase as any)
        .from('ingredients')
        .insert({
          id: newIngredient.id,
          user_id: newIngredient.user_id,
          name: newIngredient.name,
          brand: newIngredient.brand,
          category_id: newIngredient.category_id,
          default_unit_id: newIngredient.default_unit_id,
          description: newIngredient.description,
          image_url: newIngredient.image_url,
          notes: newIngredient.notes,
          is_active: newIngredient.is_active,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting ingredient:', error);
        throw new Error(error.message);
      }
      return inserted as Ingredient;
    }

    const current = localStore.getIngredients();
    current.push(newIngredient);
    localStore.saveIngredients(current);
    return newIngredient;
  },

  async updateIngredient(id: string, updates: Partial<Ingredient>): Promise<Ingredient> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await (supabase as any)
        .from('ingredients')
        .update({
          name: updates.name,
          brand: updates.brand,
          category_id: updates.category_id,
          default_unit_id: updates.default_unit_id,
          description: updates.description,
          image_url: updates.image_url,
          notes: updates.notes,
          is_active: updates.is_active,
          updated_at: now,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Ingredient;
    }

    const current = localStore.getIngredients();
    const index = current.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('ไม่พบวัตถุดิบที่ต้องการแก้ไข');

    current[index] = {
      ...current[index],
      ...updates,
      updated_at: now,
    };
    localStore.saveIngredients(current);
    return current[index];
  },

  async checkIngredientUsage(ingredientId: string): Promise<{ isUsed: boolean; recipeNames: string[] }> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('recipe_ingredients')
        .select(`
          recipe_id,
          recipes:recipe_id (name_th, name_en)
        `)
        .eq('ingredient_id', ingredientId);

      if (error || !data) return { isUsed: false, recipeNames: [] };
      const recipeNames = (data as any[])
        .map((r) => r.recipes?.name_th || r.recipes?.name_en)
        .filter(Boolean);
      return { isUsed: recipeNames.length > 0, recipeNames };
    }

    const recipes = localStore.getRecipes();
    const affected = recipes.filter((r) =>
      r.ingredients?.some((ing) => ing.ingredient_id === ingredientId)
    );
    return {
      isUsed: affected.length > 0,
      recipeNames: affected.map((r) => r.name_th),
    };
  },

  async deleteIngredient(id: string, force = false): Promise<void> {
    const usage = await this.checkIngredientUsage(id);
    if (usage.isUsed && !force) {
      throw new Error(
        `วัตถุดิบนี้กำลังถูกใช้งานอยู่ในสูตร: ${usage.recipeNames.join(', ')} กรุณายืนยันการลบหรือปิดการใช้งานแทน`
      );
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('ingredients').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    const current = localStore.getIngredients();
    const filtered = current.filter((i) => i.id !== id);
    localStore.saveIngredients(filtered);
  },

  async getCategories(type: 'recipe' | 'ingredient' | 'guide' | 'all' = 'recipe'): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('categories').select('*').order('sort_order', { ascending: true });
      if (type !== 'all') {
        query = query.eq('category_type', type);
      }
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching categories:', error);
        return type !== 'all'
          ? localStore.getCategories().filter((c) => c.category_type === type)
          : localStore.getCategories();
      }
      return data as Category[];
    }
    return type !== 'all'
      ? localStore.getCategories().filter((c) => c.category_type === type)
      : localStore.getCategories();
  },

  async createCategory(cat: Partial<Category>): Promise<Category> {
    const newCat: Category = {
      id: crypto.randomUUID(),
      user_id: 'default_user',
      category_type: cat.category_type || 'recipe',
      name: cat.name?.trim() || 'New Category',
      slug: (cat.name?.toLowerCase().replace(/\s+/g, '-') || 'new-category') + `-${Date.now()}`,
      description: cat.description?.trim() || null,
      icon: cat.icon || null,
      sort_order: cat.sort_order || 99,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data: user } = await supabase.auth.getUser();
      if (user?.user) newCat.user_id = user.user.id;

      const { data, error } = await (supabase as any)
        .from('categories')
        .insert(newCat)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Category;
    }

    const all = localStore.getCategories();
    all.push(newCat);
    localStore.saveCategories(all);
    return newCat;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await (supabase as any)
        .from('categories')
        .update({
          name: updates.name,
          description: updates.description,
          icon: updates.icon,
          sort_order: updates.sort_order,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Category;
    }

    const all = localStore.getCategories();
    const idx = all.findIndex((c) => c.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      localStore.saveCategories(all);
      return all[idx];
    }
    throw new Error('ไม่พบหมวดหมู่ที่ต้องการแก้ไข');
  },

  async deleteCategory(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await (supabase as any).from('categories').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    const all = localStore.getCategories().filter((c) => c.id !== id);
    localStore.saveCategories(all);
  },

  async getUnits(): Promise<MeasurementUnit[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('measurement_units')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching units:', error);
        return localStore.getUnits();
      }
      return data as MeasurementUnit[];
    }
    return localStore.getUnits();
  },

  async createUnit(unit: Partial<MeasurementUnit>): Promise<MeasurementUnit> {
    const newUnit: MeasurementUnit = {
      id: crypto.randomUUID(),
      name: unit.name?.trim() || 'Custom Unit',
      symbol: unit.symbol?.trim() || 'unit',
      unit_type: unit.unit_type || 'custom',
      is_convertible: Boolean(unit.is_convertible),
      conversion_factor_to_base: unit.conversion_factor_to_base || null,
      sort_order: unit.sort_order || 99,
    };

    if (isSupabaseConfigured && supabase) {
      const { data: user } = await supabase.auth.getUser();
      const insertPayload = {
        ...newUnit,
        user_id: user?.user ? user.user.id : null,
      };
      const { data, error } = await (supabase as any)
        .from('measurement_units')
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as MeasurementUnit;
    }

    const all = localStore.getUnits();
    all.push(newUnit);
    localStore.saveUnits(all);
    return newUnit;
  },

  async deleteUnit(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await (supabase as any).from('measurement_units').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    const all = localStore.getUnits().filter((u) => u.id !== id);
    localStore.saveUnits(all);
  },
};
