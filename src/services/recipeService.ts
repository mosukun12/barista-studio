import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Recipe, RecipeFilterOptions, RecipeVersionItem } from '../types';
import { localStore } from './localStore';

export const recipeService = {
  async getRecipes(filters?: Partial<RecipeFilterOptions>): Promise<Recipe[]> {
    let recipes: Recipe[] = [];

    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('recipes')
        .select(`
          *,
          categories:category_id (name),
          recipe_ingredients (
            id, ingredient_id, quantity, unit_id, custom_unit_symbol, sort_order, note,
            ingredients:ingredient_id (name, brand),
            measurement_units:unit_id (symbol)
          ),
          recipe_steps (
            id, step_number, title, description, duration_seconds, equipment, image_url, additional_note
          ),
          recipe_notes (
            id, note_type, title, content, sort_order
          )
        `);

      if (!filters?.showArchived) {
        query = query.eq('is_archived', false);
      }

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category_id', filters.category);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.drinkType && filters.drinkType !== 'all') {
        query = query.eq('drink_type', filters.drinkType);
      }

      if (filters?.sortBy === 'name') {
        query = query.order('name_th', { ascending: filters.sortOrder === 'asc' });
      } else if (filters?.sortBy === 'created_at') {
        query = query.order('created_at', { ascending: filters.sortOrder === 'asc' });
      } else {
        query = query.order('updated_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching recipes from Supabase:', error);
        throw new Error(error.message);
      }

      recipes = (data || []).map((row: any) => ({
        ...row,
        category_name: row.categories?.name,
        ingredients: (row.recipe_ingredients || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((ing: any) => ({
            ...ing,
            ingredient_name: ing.ingredients?.name,
            ingredient_brand: ing.ingredients?.brand,
            unit_symbol: ing.measurement_units?.symbol || ing.custom_unit_symbol,
          })),
        steps: (row.recipe_steps || []).sort((a: any, b: any) => a.step_number - b.step_number),
        notes: (row.recipe_notes || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      }));
    } else {
      recipes = localStore.getRecipes();

      if (!filters?.showArchived) {
        recipes = recipes.filter((r) => !r.is_archived);
      }

      if (filters?.category && filters.category !== 'all') {
        recipes = recipes.filter((r) => r.category_id === filters.category);
      }

      if (filters?.status && filters.status !== 'all') {
        recipes = recipes.filter((r) => r.status === filters.status);
      }

      if (filters?.drinkType && filters.drinkType !== 'all') {
        recipes = recipes.filter((r) => r.drink_type === filters.drinkType);
      }

      // Sort
      const order = filters?.sortOrder === 'asc' ? 1 : -1;
      if (filters?.sortBy === 'name') {
        recipes.sort((a, b) => a.name_th.localeCompare(b.name_th) * order);
      } else if (filters?.sortBy === 'created_at') {
        recipes.sort((a, b) => (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * order);
      } else {
        recipes.sort((a, b) => (new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
      }
    }

    // Client search filter across TH/EN name, tags, description
    if (filters?.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      recipes = recipes.filter(
        (r) =>
          r.name_th.toLowerCase().includes(q) ||
          (r.name_en && r.name_en.toLowerCase().includes(q)) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          r.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return recipes;
  },

  async getRecipeById(id: string): Promise<Recipe | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          categories:category_id (name),
          recipe_ingredients (
            id, ingredient_id, quantity, unit_id, custom_unit_symbol, sort_order, note,
            ingredients:ingredient_id (name, brand),
            measurement_units:unit_id (symbol)
          ),
          recipe_steps (
            id, step_number, title, description, duration_seconds, equipment, image_url, additional_note
          ),
          recipe_notes (
            id, note_type, title, content, sort_order
          )
        `)
        .eq('id', id)
        .single();

      if (error || !data) return null;

      const row: any = data;
      return {
        ...row,
        category_name: row.categories?.name,
        ingredients: (row.recipe_ingredients || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((ing: any) => ({
            ...ing,
            ingredient_name: ing.ingredients?.name,
            ingredient_brand: ing.ingredients?.brand,
            unit_symbol: ing.measurement_units?.symbol || ing.custom_unit_symbol,
          })),
        steps: (row.recipe_steps || []).sort((a: any, b: any) => a.step_number - b.step_number),
        notes: (row.recipe_notes || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      };
    }

    const items = localStore.getRecipes();
    return items.find((r) => r.id === id) || null;
  },

  async createRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
    const now = new Date().toISOString();
    const newRecipe: Recipe = {
      id: crypto.randomUUID(),
      user_id: 'default_user',
      name_th: recipe.name_th?.trim() || 'สูตรไม่มีชื่อ',
      name_en: recipe.name_en?.trim() || null,
      description: recipe.description?.trim() || null,
      cover_image_url: recipe.cover_image_url || null,
      category_id: recipe.category_id || null,
      drink_type: recipe.drink_type || 'iced',
      glass_size: recipe.glass_size || '16 oz',
      glass_type: recipe.glass_type || null,
      lid_type: recipe.lid_type || null,
      straw_type: recipe.straw_type || null,
      serving_notes: recipe.serving_notes || null,
      status: recipe.status || 'draft',
      difficulty: recipe.difficulty || 'medium',
      prep_time_seconds: recipe.prep_time_seconds || 120,
      is_archived: false,
      current_version: 1,
      tags: recipe.tags || [],
      created_at: now,
      updated_at: now,
      ingredients: recipe.ingredients || [],
      steps: recipe.steps || [],
      notes: recipe.notes || [],
    };

    if (isSupabaseConfigured && supabase) {
      const client = supabase as any;
      const { data: user } = await supabase.auth.getUser();
      if (user?.user) {
        newRecipe.user_id = user.user.id;
      }

      // 1. Insert parent recipe
      const { error: recipeError } = await client.from('recipes').insert({
        id: newRecipe.id,
        user_id: newRecipe.user_id,
        name_th: newRecipe.name_th,
        name_en: newRecipe.name_en,
        description: newRecipe.description,
        cover_image_url: newRecipe.cover_image_url,
        category_id: newRecipe.category_id,
        drink_type: newRecipe.drink_type,
        glass_size: newRecipe.glass_size,
        glass_type: newRecipe.glass_type,
        lid_type: newRecipe.lid_type,
        straw_type: newRecipe.straw_type,
        serving_notes: newRecipe.serving_notes,
        status: newRecipe.status,
        difficulty: newRecipe.difficulty,
        prep_time_seconds: newRecipe.prep_time_seconds,
        is_archived: false,
        current_version: 1,
        tags: newRecipe.tags,
      });

      if (recipeError) throw new Error(recipeError.message);

      // 2. Insert ingredients if any
      if (newRecipe.ingredients && newRecipe.ingredients.length > 0) {
        const ingRows = newRecipe.ingredients.map((ing, idx) => ({
          recipe_id: newRecipe.id,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit_id: ing.unit_id || null,
          custom_unit_symbol: ing.custom_unit_symbol || null,
          sort_order: idx + 1,
          note: ing.note || null,
        }));
        await client.from('recipe_ingredients').insert(ingRows);
      }

      // 3. Insert steps if any
      if (newRecipe.steps && newRecipe.steps.length > 0) {
        const stepRows = newRecipe.steps.map((st, idx) => ({
          recipe_id: newRecipe.id,
          step_number: idx + 1,
          title: st.title,
          description: st.description || null,
          duration_seconds: st.duration_seconds || 0,
          equipment: st.equipment || null,
          image_url: st.image_url || null,
          additional_note: st.additional_note || null,
        }));
        await client.from('recipe_steps').insert(stepRows);
      }

      // 4. Insert notes if any
      if (newRecipe.notes && newRecipe.notes.length > 0) {
        const noteRows = newRecipe.notes.map((nt, idx) => ({
          recipe_id: newRecipe.id,
          note_type: nt.note_type,
          title: nt.title || null,
          content: nt.content,
          sort_order: idx + 1,
        }));
        await client.from('recipe_notes').insert(noteRows);
      }

      // 5. Create initial version snapshot
      await this.saveVersionSnapshot(newRecipe.id, 'สร้างสูตรเริ่มต้น', 'Initial creation', newRecipe);

      return (await this.getRecipeById(newRecipe.id)) || newRecipe;
    }

    const current = localStore.getRecipes();
    current.unshift(newRecipe);
    localStore.saveRecipes(current);

    // Initial snapshot
    await this.saveVersionSnapshot(newRecipe.id, 'สร้างสูตรเริ่มต้น', 'Initial creation', newRecipe);

    return newRecipe;
  },

  async updateRecipe(id: string, updates: Partial<Recipe>, changeSummary?: string): Promise<Recipe> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      const client = supabase as any;
      // 1. Update parent recipe
      const { error: updateError } = await client
        .from('recipes')
        .update({
          name_th: updates.name_th,
          name_en: updates.name_en,
          description: updates.description,
          cover_image_url: updates.cover_image_url,
          category_id: updates.category_id,
          drink_type: updates.drink_type,
          glass_size: updates.glass_size,
          glass_type: updates.glass_type,
          lid_type: updates.lid_type,
          straw_type: updates.straw_type,
          serving_notes: updates.serving_notes,
          status: updates.status,
          difficulty: updates.difficulty,
          prep_time_seconds: updates.prep_time_seconds,
          is_archived: updates.is_archived,
          tags: updates.tags,
          updated_at: now,
        })
        .eq('id', id);

      if (updateError) throw new Error(updateError.message);

      // 2. Refresh ingredients
      if (updates.ingredients !== undefined) {
        await client.from('recipe_ingredients').delete().eq('recipe_id', id);
        if (updates.ingredients.length > 0) {
          const ingRows = updates.ingredients.map((ing, idx) => ({
            recipe_id: id,
            ingredient_id: ing.ingredient_id,
            quantity: ing.quantity,
            unit_id: ing.unit_id || null,
            custom_unit_symbol: ing.custom_unit_symbol || null,
            sort_order: idx + 1,
            note: ing.note || null,
          }));
          await client.from('recipe_ingredients').insert(ingRows);
        }
      }

      // 3. Refresh steps
      if (updates.steps !== undefined) {
        await client.from('recipe_steps').delete().eq('recipe_id', id);
        if (updates.steps.length > 0) {
          const stepRows = updates.steps.map((st, idx) => ({
            recipe_id: id,
            step_number: idx + 1,
            title: st.title,
            description: st.description || null,
            duration_seconds: st.duration_seconds || 0,
            equipment: st.equipment || null,
            image_url: st.image_url || null,
            additional_note: st.additional_note || null,
          }));
          await client.from('recipe_steps').insert(stepRows);
        }
      }

      // 4. Refresh notes
      if (updates.notes !== undefined) {
        await client.from('recipe_notes').delete().eq('recipe_id', id);
        if (updates.notes.length > 0) {
          const noteRows = updates.notes.map((nt, idx) => ({
            recipe_id: id,
            note_type: nt.note_type,
            title: nt.title || null,
            content: nt.content,
            sort_order: idx + 1,
          }));
          await client.from('recipe_notes').insert(noteRows);
        }
      }

      const updated = await this.getRecipeById(id);
      if (!updated) throw new Error('ไม่พบข้อมูลสูตรหลังบันทึก');

      if (changeSummary) {
        await this.saveVersionSnapshot(id, changeSummary, undefined, updated);
      }

      return updated;
    }

    const current = localStore.getRecipes();
    const index = current.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('ไม่พบสูตรที่ต้องการแก้ไข');

    const updatedRecipe: Recipe = {
      ...current[index],
      ...updates,
      updated_at: now,
    };
    current[index] = updatedRecipe;
    localStore.saveRecipes(current);

    if (changeSummary) {
      await this.saveVersionSnapshot(id, changeSummary, undefined, updatedRecipe);
    }

    return updatedRecipe;
  },

  async deleteRecipe(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    const current = localStore.getRecipes();
    const filtered = current.filter((r) => r.id !== id);
    localStore.saveRecipes(filtered);
  },

  async duplicateRecipe(id: string): Promise<Recipe> {
    const original = await this.getRecipeById(id);
    if (!original) throw new Error('ไม่พบสูตรต้นแบบที่จะทำสำเนา');

    const clone: Partial<Recipe> = {
      ...original,
      name_th: `${original.name_th} (สำเนา)`,
      name_en: original.name_en ? `${original.name_en} (Copy)` : null,
      status: 'draft', // Clones start as draft
      is_archived: false,
      ingredients: (original.ingredients || []).map((ing) => ({ ...ing, id: undefined })),
      steps: (original.steps || []).map((st) => ({ ...st, id: undefined })),
      notes: (original.notes || []).map((nt) => ({ ...nt, id: undefined })),
    };

    return this.createRecipe(clone);
  },

  async toggleArchiveRecipe(id: string, archiveState: boolean): Promise<Recipe> {
    return this.updateRecipe(id, { is_archived: archiveState });
  },

  async saveVersionSnapshot(
    recipeId: string,
    changeSummary: string,
    changeReason?: string,
    recipeSnapshot?: Recipe
  ): Promise<RecipeVersionItem> {
    const fullRecipe = recipeSnapshot || (await this.getRecipeById(recipeId));
    if (!fullRecipe) throw new Error('ไม่พบสูตรสำหรับบันทึก Version History');

    const nextVersionNum = (fullRecipe.current_version || 1) + 1;

    const versionItem: RecipeVersionItem = {
      id: crypto.randomUUID(),
      recipe_id: recipeId,
      version_number: nextVersionNum,
      created_by: fullRecipe.user_id,
      change_summary: changeSummary,
      change_reason: changeReason || null,
      snapshot: {
        recipe: {
          name_th: fullRecipe.name_th,
          name_en: fullRecipe.name_en,
          description: fullRecipe.description,
          drink_type: fullRecipe.drink_type,
          glass_size: fullRecipe.glass_size,
          glass_type: fullRecipe.glass_type,
          lid_type: fullRecipe.lid_type,
          straw_type: fullRecipe.straw_type,
          serving_notes: fullRecipe.serving_notes,
          status: fullRecipe.status,
          difficulty: fullRecipe.difficulty,
          prep_time_seconds: fullRecipe.prep_time_seconds,
          tags: fullRecipe.tags,
        },
        ingredients: fullRecipe.ingredients || [],
        steps: fullRecipe.steps || [],
        notes: fullRecipe.notes || [],
      },
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const client = supabase as any;
      await client.from('recipe_versions').insert({
        id: versionItem.id,
        recipe_id: versionItem.recipe_id,
        version_number: versionItem.version_number,
        created_by: versionItem.created_by,
        change_summary: versionItem.change_summary,
        change_reason: versionItem.change_reason,
        snapshot: versionItem.snapshot as any,
      });

      // Increment current_version on parent
      await client
        .from('recipes')
        .update({ current_version: nextVersionNum })
        .eq('id', recipeId);

      return versionItem;
    }

    localStore.saveVersion(versionItem);
    return versionItem;
  },

  async getRecipeVersions(recipeId: string): Promise<RecipeVersionItem[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('recipe_versions')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('version_number', { ascending: false });

      if (error) {
        console.error('Error fetching recipe versions:', error);
        return [];
      }
      return data as RecipeVersionItem[];
    }
    return localStore.getVersions(recipeId);
  },

  async restoreVersion(recipeId: string, versionNumber: number): Promise<Recipe> {
    const versions = await this.getRecipeVersions(recipeId);
    const target = versions.find((v) => v.version_number === versionNumber);
    if (!target) throw new Error('ไม่พบ Version ที่ต้องการกู้คืน');

    const { snapshot } = target;
    const restoredRecipeUpdates: Partial<Recipe> = {
      ...snapshot.recipe,
      ingredients: snapshot.ingredients,
      steps: snapshot.steps,
      notes: snapshot.notes,
    };

    // Creating a brand-new forward version on restore, preserving all history!
    return this.updateRecipe(
      recipeId,
      restoredRecipeUpdates,
      `กู้คืนข้อมูลจาก Version ${versionNumber}`
    );
  },
};
