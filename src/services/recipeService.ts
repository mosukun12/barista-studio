import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Recipe,
  RecipeFilterOptions,
  RecipeStepItem,
  RecipeVersionItem,
  RecipeIngredientItem,
  RecipeNoteItem,
} from '../types';
import { localStore } from './localStore';

/**
 * Deduplicate recipe ingredients by ingredient_id or name + quantity + unit.
 * Normalizes sort_order sequentially.
 */
export function deduplicateIngredients(
  ingredients?: RecipeIngredientItem[]
): RecipeIngredientItem[] {
  if (!Array.isArray(ingredients)) return [];
  const seen = new Set<string>();
  const result: RecipeIngredientItem[] = [];

  for (const ing of ingredients) {
    if (!ing) continue;
    const idKey = (ing.ingredient_id || '').trim().toLowerCase();
    const nameKey = (ing.ingredient_name || '').trim().toLowerCase();
    const qtyKey = Number(ing.quantity || 0);
    const unitKey = (ing.unit_id || ing.unit_symbol || ing.custom_unit_symbol || '').trim().toLowerCase();

    // Unique identity key: combination of identity (id or name), quantity, and unit
    const key = `${idKey || nameKey}:${qtyKey}:${unitKey}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ ...ing });
    }
  }

  return result.map((item, idx) => ({ ...item, sort_order: idx + 1 }));
}

/**
 * Deduplicate recipe steps by step_number, title, and description.
 * Normalizes step_number sequentially.
 */
export function deduplicateSteps(steps?: RecipeStepItem[]): RecipeStepItem[] {
  if (!Array.isArray(steps)) return [];
  const seen = new Set<string>();
  const result: RecipeStepItem[] = [];

  for (const step of steps) {
    if (!step) continue;
    const titleKey = (step.title || '').trim().toLowerCase();
    const descKey = (step.description || '').trim().toLowerCase();
    const numKey = step.step_number;

    const key = `${numKey}:${titleKey}:${descKey}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ ...step });
    }
  }

  return result.map((item, idx) => ({ ...item, step_number: idx + 1 }));
}

/**
 * Deduplicate recipe barista notes by type, title, and content.
 * Normalizes sort_order sequentially.
 */
export function deduplicateNotes(notes?: RecipeNoteItem[]): RecipeNoteItem[] {
  if (!Array.isArray(notes)) return [];
  const seen = new Set<string>();
  const result: RecipeNoteItem[] = [];

  for (const note of notes) {
    if (!note) continue;
    const typeKey = (note.note_type || '').trim().toLowerCase();
    const titleKey = (note.title || '').trim().toLowerCase();
    const contentKey = (note.content || '').trim().toLowerCase();

    const key = `${typeKey}:${titleKey}:${contentKey}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ ...note });
    }
  }

  return result.map((item, idx) => ({ ...item, sort_order: idx + 1 }));
}

// Mutex lock map to prevent concurrent writes to the same recipe
const recipeUpdateLocks = new Map<string, Promise<any>>();

async function withRecipeLock<T>(recipeId: string, operation: () => Promise<T>): Promise<T> {
  const currentLock = recipeUpdateLocks.get(recipeId) || Promise.resolve();
  let releaseLock: () => void;
  const newLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  recipeUpdateLocks.set(recipeId, currentLock.then(() => newLock, () => newLock));

  try {
    await currentLock;
    return await operation();
  } finally {
    releaseLock!();
    if (recipeUpdateLocks.get(recipeId) === newLock) {
      recipeUpdateLocks.delete(recipeId);
    }
  }
}

function parseStep(st: any): RecipeStepItem {
  let ingredients: string[] = Array.isArray(st.ingredients) ? st.ingredients : [];
  let additional_note = st.additional_note;
  if (additional_note && typeof additional_note === 'string') {
    try {
      if (additional_note.startsWith('{') && additional_note.includes('"ingredients"')) {
        const parsed = JSON.parse(additional_note);
        if (Array.isArray(parsed.ingredients)) {
          ingredients = parsed.ingredients;
        }
        additional_note = parsed.note || null;
      }
    } catch {
      // not JSON format, keep as is
    }
  }
  return {
    ...st,
    additional_note,
    ingredients,
  };
}

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
        ingredients: deduplicateIngredients(
          (row.recipe_ingredients || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((ing: any) => ({
              ...ing,
              ingredient_name: ing.ingredients?.name,
              ingredient_brand: ing.ingredients?.brand,
              unit_symbol: ing.measurement_units?.symbol || ing.custom_unit_symbol,
            }))
        ),
        steps: deduplicateSteps(
          (row.recipe_steps || [])
            .sort((a: any, b: any) => a.step_number - b.step_number)
            .map(parseStep)
        ),
        notes: deduplicateNotes(
          (row.recipe_notes || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
        ),
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
        ingredients: deduplicateIngredients(
          (row.recipe_ingredients || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((ing: any) => ({
              ...ing,
              ingredient_name: ing.ingredients?.name,
              ingredient_brand: ing.ingredients?.brand,
              unit_symbol: ing.measurement_units?.symbol || ing.custom_unit_symbol,
            }))
        ),
        steps: deduplicateSteps(
          (row.recipe_steps || [])
            .sort((a: any, b: any) => a.step_number - b.step_number)
            .map(parseStep)
        ),
        notes: deduplicateNotes(
          (row.recipe_notes || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
        ),
      };
    }

    const items = localStore.getRecipes();
    const found = items.find((r) => r.id === id);
    if (!found) return null;
    return {
      ...found,
      ingredients: deduplicateIngredients(found.ingredients),
      steps: deduplicateSteps(found.steps),
      notes: deduplicateNotes(found.notes),
    };
  },

  async createRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
    const now = new Date().toISOString();
    const cleanIngredients = deduplicateIngredients(recipe.ingredients);
    const cleanSteps = deduplicateSteps(recipe.steps);
    const cleanNotes = deduplicateNotes(recipe.notes);

    const newRecipe: Recipe = {
      id: crypto.randomUUID(),
      user_id: 'default_user',
      name_th: recipe.name_th?.trim() || 'สูตรไม่มีชื่อ',
      name_en: recipe.name_en?.trim() || null,
      description: recipe.description?.trim() || null,
      cover_image_url: recipe.cover_image_url || null,
      category_id: recipe.category_id || null,
      drink_type: recipe.drink_type || null,
      glass_size: recipe.glass_size || null,
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
      ingredients: cleanIngredients,
      steps: cleanSteps,
      notes: cleanNotes,
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
      if (cleanIngredients.length > 0) {
        const ingRows = cleanIngredients.map((ing, idx) => ({
          recipe_id: newRecipe.id,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit_id: ing.unit_id || null,
          custom_unit_symbol: ing.custom_unit_symbol || null,
          sort_order: idx + 1,
          note: ing.note || null,
        }));
        const { error: ingError } = await client.from('recipe_ingredients').insert(ingRows);
        if (ingError) throw new Error(`บันทึกส่วนผสมเริ่มต้นไม่สำเร็จ: ${ingError.message}`);
      }

      // 3. Insert steps if any
      if (cleanSteps.length > 0) {
        const stepRows = cleanSteps.map((st, idx) => {
          let additional_note = st.additional_note || null;
          if (st.ingredients && st.ingredients.length > 0) {
            additional_note = JSON.stringify({
              ingredients: st.ingredients,
              note: st.additional_note || '',
            });
          }
          return {
            recipe_id: newRecipe.id,
            step_number: idx + 1,
            title: st.title,
            description: st.description || null,
            duration_seconds: st.duration_seconds || 0,
            equipment: st.equipment || null,
            image_url: st.image_url || null,
            additional_note,
          };
        });
        const { error: stepError } = await client.from('recipe_steps').insert(stepRows);
        if (stepError) throw new Error(`บันทึกขั้นตอนเริ่มต้นไม่สำเร็จ: ${stepError.message}`);
      }

      // 4. Insert notes if any
      if (cleanNotes.length > 0) {
        const noteRows = cleanNotes.map((nt, idx) => ({
          recipe_id: newRecipe.id,
          note_type: nt.note_type,
          title: nt.title || null,
          content: nt.content,
          sort_order: idx + 1,
        }));
        const { error: noteError } = await client.from('recipe_notes').insert(noteRows);
        if (noteError) throw new Error(`บันทึกโน้ตเริ่มต้นไม่สำเร็จ: ${noteError.message}`);
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
    return withRecipeLock(id, async () => {
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

        if (updateError) throw new Error(`อัปเดตข้อมูลสูตรหลักไม่สำเร็จ: ${updateError.message}`);

        // 2. Refresh ingredients with deduplication and error check
        if (updates.ingredients !== undefined) {
          const cleanIngs = deduplicateIngredients(updates.ingredients);
          const { error: delIngError } = await client
            .from('recipe_ingredients')
            .delete()
            .eq('recipe_id', id);

          if (delIngError) {
            console.error('Error deleting recipe ingredients:', delIngError);
            throw new Error(`ลบส่วนผสมเดิมไม่สำเร็จ: ${delIngError.message}`);
          }

          if (cleanIngs.length > 0) {
            const ingRows = cleanIngs.map((ing, idx) => ({
              recipe_id: id,
              ingredient_id: ing.ingredient_id,
              quantity: ing.quantity,
              unit_id: ing.unit_id || null,
              custom_unit_symbol: ing.custom_unit_symbol || null,
              sort_order: idx + 1,
              note: ing.note || null,
            }));
            const { error: insIngError } = await client.from('recipe_ingredients').insert(ingRows);
            if (insIngError) {
              console.error('Error inserting recipe ingredients:', insIngError);
              throw new Error(`บันทึกส่วนผสมใหม่ไม่สำเร็จ: ${insIngError.message}`);
            }
          }
        }

        // 3. Refresh steps with deduplication and error check
        if (updates.steps !== undefined) {
          const cleanSteps = deduplicateSteps(updates.steps);
          const { error: delStepError } = await client
            .from('recipe_steps')
            .delete()
            .eq('recipe_id', id);

          if (delStepError) {
            console.error('Error deleting recipe steps:', delStepError);
            throw new Error(`ลบขั้นตอนเดิมไม่สำเร็จ: ${delStepError.message}`);
          }

          if (cleanSteps.length > 0) {
            const stepRows = cleanSteps.map((st, idx) => {
              let additional_note = st.additional_note || null;
              if (st.ingredients && st.ingredients.length > 0) {
                additional_note = JSON.stringify({
                  ingredients: st.ingredients,
                  note: st.additional_note || '',
                });
              }
              return {
                recipe_id: id,
                step_number: idx + 1,
                title: st.title,
                description: st.description || null,
                duration_seconds: st.duration_seconds || 0,
                equipment: st.equipment || null,
                image_url: st.image_url || null,
                additional_note,
              };
            });
            const { error: insStepError } = await client.from('recipe_steps').insert(stepRows);
            if (insStepError) {
              console.error('Error inserting recipe steps:', insStepError);
              throw new Error(`บันทึกขั้นตอนใหม่ไม่สำเร็จ: ${insStepError.message}`);
            }
          }
        }

        // 4. Refresh notes with deduplication and error check
        if (updates.notes !== undefined) {
          const cleanNotes = deduplicateNotes(updates.notes);
          const { error: delNoteError } = await client
            .from('recipe_notes')
            .delete()
            .eq('recipe_id', id);

          if (delNoteError) {
            console.error('Error deleting recipe notes:', delNoteError);
            throw new Error(`ลบโน้ตเดิมไม่สำเร็จ: ${delNoteError.message}`);
          }

          if (cleanNotes.length > 0) {
            const noteRows = cleanNotes.map((nt, idx) => ({
              recipe_id: id,
              note_type: nt.note_type,
              title: nt.title || null,
              content: nt.content,
              sort_order: idx + 1,
            }));
            const { error: insNoteError } = await client.from('recipe_notes').insert(noteRows);
            if (insNoteError) {
              console.error('Error inserting recipe notes:', insNoteError);
              throw new Error(`บันทึกโน้ตใหม่ไม่สำเร็จ: ${insNoteError.message}`);
            }
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
        ingredients: updates.ingredients ? deduplicateIngredients(updates.ingredients) : current[index].ingredients,
        steps: updates.steps ? deduplicateSteps(updates.steps) : current[index].steps,
        notes: updates.notes ? deduplicateNotes(updates.notes) : current[index].notes,
        updated_at: now,
      };
      current[index] = updatedRecipe;
      localStore.saveRecipes(current);

      if (changeSummary) {
        await this.saveVersionSnapshot(id, changeSummary, undefined, updatedRecipe);
      }

      return updatedRecipe;
    });
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

    const cleanIngredients = deduplicateIngredients(original.ingredients || []);
    const cleanSteps = deduplicateSteps(original.steps || []);
    const cleanNotes = deduplicateNotes(original.notes || []);

    const clone: Partial<Recipe> = {
      ...original,
      name_th: `${original.name_th} (สำเนา)`,
      name_en: original.name_en ? `${original.name_en} (Copy)` : null,
      status: 'draft', // Clones start as draft
      is_archived: false,
      ingredients: cleanIngredients.map((ing) => ({ ...ing, id: undefined, recipe_id: undefined })),
      steps: cleanSteps.map((st) => ({ ...st, id: undefined, recipe_id: undefined })),
      notes: cleanNotes.map((nt) => ({ ...nt, id: undefined, recipe_id: undefined })),
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
        ingredients: deduplicateIngredients(fullRecipe.ingredients || []),
        steps: deduplicateSteps(fullRecipe.steps || []),
        notes: deduplicateNotes(fullRecipe.notes || []),
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
      ingredients: deduplicateIngredients(snapshot.ingredients),
      steps: deduplicateSteps(snapshot.steps),
      notes: deduplicateNotes(snapshot.notes),
    };

    // Creating a brand-new forward version on restore, preserving all history!
    return this.updateRecipe(
      recipeId,
      restoredRecipeUpdates,
      `กู้คืนข้อมูลจาก Version ${versionNumber}`
    );
  },
};
