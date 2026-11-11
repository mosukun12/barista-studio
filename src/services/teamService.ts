import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Team,
  TeamMember,
  TeamShare,
  TeamRole,
  TeamShareItemType,
  TeamExportBundle,
  Recipe,
  Ingredient,
  Category,
} from '../types';
import { localStore } from './localStore';
import { authService } from './authService';
import { recipeService } from './recipeService';
import { ingredientService } from './ingredientService';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'BARISTA-';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const teamService = {
  /**
   * Get all teams accessible by the current user with computed statistics.
   */
  async getTeams(): Promise<Team[]> {
    const profile = await authService.getCurrentProfile();
    const userId = profile.id;

    if (isSupabaseConfigured && supabase) {
      try {
        // Query teams where user is owner or member
        const { data: teamsData, error } = await supabase
          .from('teams')
          .select(`
            id, name, description, invite_code, owner_id, created_at, updated_at,
            team_members (id, user_id, role)
          `)
          .order('created_at', { ascending: false });

        if (!error && teamsData) {
          // Count shares for each team
          const { data: sharesData } = await supabase
            .from('team_shares')
            .select('team_id, item_type');

          return teamsData.map((t: any) => {
            const members = t.team_members || [];
            const userMember = members.find((m: any) => m.user_id === userId);
            const userRole: TeamRole = t.owner_id === userId ? 'owner' : (userMember?.role || 'barista');

            const teamShares = (sharesData || []).filter((s: any) => s.team_id === t.id);
            const recipeCount = teamShares.filter((s: any) => s.item_type === 'recipe').length;
            const ingCount = teamShares.filter((s: any) => s.item_type === 'ingredient').length;
            const catCount = teamShares.filter((s: any) => s.item_type === 'category').length;

            return {
              id: t.id,
              name: t.name,
              description: t.description,
              invite_code: t.invite_code,
              owner_id: t.owner_id,
              created_at: t.created_at,
              updated_at: t.updated_at,
              members_count: members.length || 1,
              shared_recipes_count: recipeCount,
              shared_ingredients_count: ingCount,
              shared_categories_count: catCount,
              current_user_role: userRole,
            };
          });
        }
      } catch (err) {
        console.warn('Supabase getTeams error, falling back to localStore:', err);
      }
    }

    // Local fallback
    const allTeams = localStore.getTeams();
    const allMembers = localStore.getTeamMembers();
    const allShares = localStore.getTeamShares();

    return allTeams.map((t) => {
      const members = allMembers.filter((m) => m.team_id === t.id);
      const userMember = members.find((m) => m.user_id === userId || m.email === profile.email);
      const userRole: TeamRole = t.owner_id === userId ? 'owner' : (userMember?.role || 'owner');

      const teamShares = allShares.filter((s) => s.team_id === t.id);
      const recipeCount = teamShares.filter((s) => s.item_type === 'recipe').length;
      const ingCount = teamShares.filter((s) => s.item_type === 'ingredient').length;
      const catCount = teamShares.filter((s) => s.item_type === 'category').length;

      return {
        ...t,
        members_count: members.length,
        shared_recipes_count: recipeCount,
        shared_ingredients_count: ingCount,
        shared_categories_count: catCount,
        current_user_role: userRole,
      };
    });
  },

  /**
   * Get single team by ID.
   */
  async getTeamById(teamId: string): Promise<Team | null> {
    const teams = await this.getTeams();
    return teams.find((t) => t.id === teamId) || null;
  },

  /**
   * Create a new team and add creator as owner.
   */
  async createTeam(input: { name: string; description?: string }): Promise<Team> {
    const profile = await authService.getCurrentProfile();
    const userId = profile.id;
    const inviteCode = generateInviteCode();
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: newTeam, error } = await supabase
          .from('teams')
          .insert({
            name: input.name.trim(),
            description: input.description?.trim() || null,
            invite_code: inviteCode,
            owner_id: userId,
          })
          .select()
          .single();

        if (!error && newTeam) {
          // Add owner to members table
          await supabase.from('team_members').insert({
            team_id: newTeam.id,
            user_id: userId,
            role: 'owner',
          });

          return {
            id: newTeam.id,
            name: newTeam.name,
            description: newTeam.description,
            invite_code: newTeam.invite_code,
            owner_id: newTeam.owner_id,
            created_at: newTeam.created_at,
            updated_at: newTeam.updated_at,
            members_count: 1,
            shared_recipes_count: 0,
            shared_ingredients_count: 0,
            shared_categories_count: 0,
            current_user_role: 'owner',
          };
        }
      } catch (err) {
        console.warn('Supabase createTeam error, using localStore:', err);
      }
    }

    // LocalStore
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      invite_code: inviteCode,
      owner_id: userId,
      created_at: now,
      updated_at: now,
      members_count: 1,
      shared_recipes_count: 0,
      shared_ingredients_count: 0,
      shared_categories_count: 0,
      current_user_role: 'owner',
    };

    const currentTeams = localStore.getTeams();
    localStore.saveTeams([newTeam, ...currentTeams]);

    const newMember: TeamMember = {
      id: `mem-${Date.now()}`,
      team_id: newTeam.id,
      user_id: userId,
      email: profile.email || 'barista@studio.local',
      full_name: `${profile.full_name || 'Studio Barista'} (คุณ)`,
      role: 'owner',
      joined_at: now,
    };

    const currentMembers = localStore.getTeamMembers();
    localStore.saveTeamMembers([newMember, ...currentMembers]);

    return newTeam;
  },

  /**
   * Update team information.
   */
  async updateTeam(teamId: string, input: { name?: string; description?: string }): Promise<Team> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('teams')
          .update({
            name: input.name?.trim(),
            description: input.description?.trim() || null,
            updated_at: now,
          })
          .eq('id', teamId)
          .select()
          .single();

        if (!error && data) {
          const full = await this.getTeamById(teamId);
          return full!;
        }
      } catch (err) {
        console.warn('Supabase updateTeam error:', err);
      }
    }

    const currentTeams = localStore.getTeams();
    const updated = currentTeams.map((t) => {
      if (t.id === teamId) {
        return {
          ...t,
          ...(input.name ? { name: input.name.trim() } : {}),
          ...(input.description !== undefined ? { description: input.description.trim() || null } : {}),
          updated_at: now,
        };
      }
      return t;
    });

    localStore.saveTeams(updated);
    const result = await this.getTeamById(teamId);
    return result!;
  },

  /**
   * Delete team and its members and shares.
   */
  async deleteTeam(teamId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('teams').delete().eq('id', teamId);
        return;
      } catch (err) {
        console.warn('Supabase deleteTeam error:', err);
      }
    }

    const currentTeams = localStore.getTeams().filter((t) => t.id !== teamId);
    localStore.saveTeams(currentTeams);

    const currentMembers = localStore.getTeamMembers().filter((m) => m.team_id !== teamId);
    localStore.saveTeamMembers(currentMembers);

    const currentShares = localStore.getTeamShares().filter((s) => s.team_id !== teamId);
    localStore.saveTeamShares(currentShares);
  },

  /**
   * Get members of a specific team.
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select(`
            id, team_id, user_id, role, joined_at,
            profiles:user_id (id, full_name, avatar_url)
          `)
          .eq('team_id', teamId)
          .order('joined_at', { ascending: true });

        if (!error && data) {
          return data.map((row: any) => ({
            id: row.id,
            team_id: row.team_id,
            user_id: row.user_id,
            email: row.profiles?.email || 'barista@team.cloud',
            full_name: row.profiles?.full_name || 'Barista Member',
            avatar_url: row.profiles?.avatar_url,
            role: row.role,
            joined_at: row.joined_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase getTeamMembers error:', err);
      }
    }

    return localStore.getTeamMembers().filter((m) => m.team_id === teamId);
  },

  /**
   * Add a member to the team (by email and name).
   */
  async addMember(
    teamId: string,
    input: { email: string; full_name?: string; role?: TeamRole }
  ): Promise<TeamMember> {
    const trimmedEmail = input.email.trim().toLowerCase();
    const role: TeamRole = input.role || 'barista';
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        // Find user by email in profiles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('email', trimmedEmail)
          .single();

        const userId = profileData?.id || `user-invite-${Date.now()}`;

        const { data, error } = await supabase
          .from('team_members')
          .insert({
            team_id: teamId,
            user_id: userId,
            role,
          })
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            team_id: data.team_id,
            user_id: data.user_id,
            email: trimmedEmail,
            full_name: input.full_name || profileData?.full_name || trimmedEmail.split('@')[0],
            role,
            joined_at: data.joined_at,
          };
        }
      } catch (err) {
        console.warn('Supabase addMember error:', err);
      }
    }

    const currentMembers = localStore.getTeamMembers();
    // Check if already in team
    const exists = currentMembers.some(
      (m) => m.team_id === teamId && m.email.toLowerCase() === trimmedEmail
    );
    if (exists) {
      throw new Error(`อีเมล ${trimmedEmail} เป็นสมาชิกในทีมนี้อยู่แล้ว`);
    }

    const newMember: TeamMember = {
      id: `mem-${Date.now()}`,
      team_id: teamId,
      user_id: `user-${Date.now()}`,
      email: trimmedEmail,
      full_name: input.full_name?.trim() || trimmedEmail.split('@')[0],
      role,
      joined_at: now,
    };

    localStore.saveTeamMembers([...currentMembers, newMember]);
    return newMember;
  },

  /**
   * Remove a member from the team.
   */
  async removeMember(teamId: string, memberId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('team_members').delete().eq('id', memberId);
        return;
      } catch (err) {
        console.warn('Supabase removeMember error:', err);
      }
    }

    const currentMembers = localStore.getTeamMembers().filter((m) => m.id !== memberId);
    localStore.saveTeamMembers(currentMembers);
  },

  /**
   * Update role of a member.
   */
  async updateMemberRole(teamId: string, memberId: string, role: TeamRole): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('team_members').update({ role }).eq('id', memberId);
        return;
      } catch (err) {
        console.warn('Supabase updateMemberRole error:', err);
      }
    }

    const currentMembers = localStore.getTeamMembers().map((m) => {
      if (m.id === memberId) {
        return { ...m, role };
      }
      return m;
    });
    localStore.saveTeamMembers(currentMembers);
  },

  /**
   * Join a team by invite code.
   */
  async joinTeamByInviteCode(inviteCode: string): Promise<Team> {
    const code = inviteCode.trim().toUpperCase();
    const profile = await authService.getCurrentProfile();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: team, error } = await supabase
          .from('teams')
          .select('*')
          .eq('invite_code', code)
          .single();

        if (error || !team) {
          throw new Error('ไม่พบทีมจากรหัสเชิญนี้ กรุณาตรวจสอบรหัสอีกครั้ง');
        }

        // Add member
        await supabase.from('team_members').upsert({
          team_id: team.id,
          user_id: profile.id,
          role: 'barista',
        });

        const fullTeam = await this.getTeamById(team.id);
        return fullTeam!;
      } catch (err: any) {
        if (err.message) throw err;
      }
    }

    const allTeams = localStore.getTeams();
    const matched = allTeams.find((t) => t.invite_code.toUpperCase() === code);
    if (!matched) {
      throw new Error('ไม่พบทีมจากรหัสเชิญนี้ กรุณาตรวจสอบรหัสอีกครั้ง');
    }

    const currentMembers = localStore.getTeamMembers();
    const isAlreadyMember = currentMembers.some(
      (m) => m.team_id === matched.id && (m.user_id === profile.id || m.email === profile.email)
    );

    if (!isAlreadyMember) {
      const newMember: TeamMember = {
        id: `mem-${Date.now()}`,
        team_id: matched.id,
        user_id: profile.id,
        email: profile.email || 'barista@studio.local',
        full_name: `${profile.full_name || 'Studio Barista'} (คุณ)`,
        role: 'barista',
        joined_at: new Date().toISOString(),
      };
      localStore.saveTeamMembers([...currentMembers, newMember]);
    }

    const fullTeam = await this.getTeamById(matched.id);
    return fullTeam!;
  },

  /**
   * Get all shared item IDs for a team by item type.
   */
  async getSharedItemIds(teamId: string, itemType: TeamShareItemType): Promise<string[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('team_shares')
          .select('item_id')
          .eq('team_id', teamId)
          .eq('item_type', itemType);

        if (!error && data) {
          return data.map((d: any) => d.item_id);
        }
      } catch (err) {
        console.warn('Supabase getSharedItemIds error:', err);
      }
    }

    const shares = localStore.getTeamShares();
    return shares
      .filter((s) => s.team_id === teamId && s.item_type === itemType)
      .map((s) => s.item_id);
  },

  /**
   * Share single item to team.
   */
  async shareItem(teamId: string, itemType: TeamShareItemType, itemId: string): Promise<void> {
    const profile = await authService.getCurrentProfile();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('team_shares').upsert(
          {
            team_id: teamId,
            item_type: itemType,
            item_id: itemId,
            shared_by: profile.id,
          },
          { onConflict: 'team_id,item_type,item_id' }
        );
        return;
      } catch (err) {
        console.warn('Supabase shareItem error:', err);
      }
    }

    const shares = localStore.getTeamShares();
    const exists = shares.some(
      (s) => s.team_id === teamId && s.item_type === itemType && s.item_id === itemId
    );
    if (!exists) {
      const newShare: TeamShare = {
        id: `share-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        team_id: teamId,
        item_type: itemType,
        item_id: itemId,
        shared_by: profile.id,
        created_at: new Date().toISOString(),
      };
      localStore.saveTeamShares([...shares, newShare]);
    }
  },

  /**
   * Unshare single item from team.
   */
  async unshareItem(teamId: string, itemType: TeamShareItemType, itemId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('team_shares')
          .delete()
          .eq('team_id', teamId)
          .eq('item_type', itemType)
          .eq('item_id', itemId);
        return;
      } catch (err) {
        console.warn('Supabase unshareItem error:', err);
      }
    }

    const shares = localStore
      .getTeamShares()
      .filter(
        (s) => !(s.team_id === teamId && s.item_type === itemType && s.item_id === itemId)
      );
    localStore.saveTeamShares(shares);
  },

  /**
   * Bulk share or unshare items for a team.
   */
  async bulkShare(
    teamId: string,
    itemType: TeamShareItemType,
    itemIds: string[],
    share: boolean
  ): Promise<void> {
    const profile = await authService.getCurrentProfile();
    const idSet = new Set(itemIds);

    if (isSupabaseConfigured && supabase) {
      try {
        if (share) {
          const insertPayloads = itemIds.map((itemId) => ({
            team_id: teamId,
            item_type: itemType,
            item_id: itemId,
            shared_by: profile.id,
          }));
          await supabase.from('team_shares').upsert(insertPayloads, {
            onConflict: 'team_id,item_type,item_id',
          });
        } else {
          await supabase
            .from('team_shares')
            .delete()
            .eq('team_id', teamId)
            .eq('item_type', itemType)
            .in('item_id', itemIds);
        }
        return;
      } catch (err) {
        console.warn('Supabase bulkShare error:', err);
      }
    }

    // LocalStore bulk handling
    let currentShares = localStore.getTeamShares();

    if (share) {
      // Remove any that already exist to avoid duplication
      const existingKeys = new Set(
        currentShares
          .filter((s) => s.team_id === teamId && s.item_type === itemType)
          .map((s) => s.item_id)
      );

      const toAdd: TeamShare[] = itemIds
        .filter((id) => !existingKeys.has(id))
        .map((itemId) => ({
          id: `share-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          team_id: teamId,
          item_type: itemType,
          item_id: itemId,
          shared_by: profile.id,
          created_at: new Date().toISOString(),
        }));

      localStore.saveTeamShares([...currentShares, ...toAdd]);
    } else {
      currentShares = currentShares.filter(
        (s) => !(s.team_id === teamId && s.item_type === itemType && idSet.has(s.item_id))
      );
      localStore.saveTeamShares(currentShares);
    }
  },

  /**
   * Get teams where a specific item is shared.
   */
  async getItemSharedTeams(itemType: TeamShareItemType, itemId: string): Promise<Team[]> {
    const allTeams = await this.getTeams();
    const shares = localStore.getTeamShares();
    const sharedTeamIds = new Set(
      shares
        .filter((s) => s.item_type === itemType && s.item_id === itemId)
        .map((s) => s.team_id)
    );

    return allTeams.filter((t) => sharedTeamIds.has(t.id));
  },

  /**
   * Export all shared recipes, ingredients, and categories for a team into a bundle.
   */
  async exportTeamBundle(teamId: string): Promise<TeamExportBundle> {
    const team = await this.getTeamById(teamId);
    if (!team) {
      throw new Error('ไม่พบข้อมูลทีมที่ต้องการส่งออก');
    }

    const [recipeIds, ingredientIds, categoryIds] = await Promise.all([
      this.getSharedItemIds(teamId, 'recipe'),
      this.getSharedItemIds(teamId, 'ingredient'),
      this.getSharedItemIds(teamId, 'category'),
    ]);

    const recipeIdSet = new Set(recipeIds);
    const ingredientIdSet = new Set(ingredientIds);
    const categoryIdSet = new Set(categoryIds);

    const [allRecipes, allIngredients, allCategories] = await Promise.all([
      recipeService.getRecipes(),
      ingredientService.getIngredients(),
      ingredientService.getCategories('all'),
    ]);

    const sharedRecipes = allRecipes.filter((r) => recipeIdSet.has(r.id) || r.team_id === teamId);
    const sharedIngredients = allIngredients.filter(
      (i) => ingredientIdSet.has(i.id) || i.team_id === teamId
    );
    const sharedCategories = allCategories.filter(
      (c) => categoryIdSet.has(c.id) || c.team_id === teamId
    );

    return {
      version: '1.0.0',
      app: 'Barista Studio',
      exported_at: new Date().toISOString(),
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
      },
      recipes: sharedRecipes,
      ingredients: sharedIngredients,
      categories: sharedCategories,
    };
  },

  /**
   * Import bundle data directly into a team.
   */
  async importTeamBundle(
    teamId: string,
    bundle: TeamExportBundle
  ): Promise<{ recipesCount: number; ingredientsCount: number; categoriesCount: number }> {
    if (!bundle || (!bundle.recipes && !bundle.ingredients && !bundle.categories)) {
      throw new Error('ไฟล์แพ็กเกจไม่ถูกต้อง หรือไม่มีข้อมูลที่สามารถนำเข้าได้');
    }

    const importedCategoryIds: string[] = [];
    const importedIngredientIds: string[] = [];
    const importedRecipeIds: string[] = [];

    // 1. Import Categories
    if (Array.isArray(bundle.categories) && bundle.categories.length > 0) {
      const existingCategories = await ingredientService.getCategories('all');
      const catMap = new Map(existingCategories.map((c) => [c.name.trim().toLowerCase(), c]));

      for (const cat of bundle.categories) {
        const key = cat.name.trim().toLowerCase();
        let catId = '';
        if (catMap.has(key)) {
          catId = catMap.get(key)!.id;
        } else {
          try {
            const created = await ingredientService.createCategory({
              name: cat.name,
              category_type: cat.category_type,
              description: cat.description || null,
            });
            catId = created.id;
            catMap.set(key, created);
          } catch (e) {
            console.error('Failed to import category:', e);
          }
        }
        if (catId) {
          importedCategoryIds.push(catId);
        }
      }
    }

    // 2. Import Ingredients
    if (Array.isArray(bundle.ingredients) && bundle.ingredients.length > 0) {
      const existingIngredients = await ingredientService.getIngredients();
      const ingMap = new Map(existingIngredients.map((i) => [i.name.trim().toLowerCase(), i]));

      for (const ing of bundle.ingredients) {
        const key = ing.name.trim().toLowerCase();
        let ingId = '';
        if (ingMap.has(key)) {
          ingId = ingMap.get(key)!.id;
        } else {
          try {
            const created = await ingredientService.createIngredient({
              name: ing.name,
              brand: ing.brand || null,
              category_id: ing.category_id || null,
              default_unit_id: ing.default_unit_id || null,
              description: ing.description || null,
              notes: ing.notes || null,
            });
            ingId = created.id;
            ingMap.set(key, created);
          } catch (e) {
            console.error('Failed to import ingredient:', e);
          }
        }
        if (ingId) {
          importedIngredientIds.push(ingId);
        }
      }
    }

    // 3. Import Recipes
    if (Array.isArray(bundle.recipes) && bundle.recipes.length > 0) {
      const existingRecipes = await recipeService.getRecipes();
      const recipeMap = new Map(existingRecipes.map((r) => [r.name_th.trim().toLowerCase(), r]));

      for (const rec of bundle.recipes) {
        const key = rec.name_th.trim().toLowerCase();
        let recId = '';
        if (recipeMap.has(key)) {
          recId = recipeMap.get(key)!.id;
        } else {
          try {
            const { id: _, created_at: __, updated_at: ___, ...recipePayload } = rec;
            const created = await recipeService.createRecipe({
              ...recipePayload,
              team_id: teamId,
            });
            recId = created.id;
            recipeMap.set(key, created);
          } catch (e) {
            console.error('Failed to import recipe:', e);
          }
        }
        if (recId) {
          importedRecipeIds.push(recId);
        }
      }
    }

    // Bulk share all imported items into this team
    if (importedCategoryIds.length > 0) {
      await this.bulkShare(teamId, 'category', importedCategoryIds, true);
    }
    if (importedIngredientIds.length > 0) {
      await this.bulkShare(teamId, 'ingredient', importedIngredientIds, true);
    }
    if (importedRecipeIds.length > 0) {
      await this.bulkShare(teamId, 'recipe', importedRecipeIds, true);
    }

    return {
      recipesCount: importedRecipeIds.length,
      ingredientsCount: importedIngredientIds.length,
      categoriesCount: importedCategoryIds.length,
    };
  },

  /**
   * Helper to download JSON bundle to user machine.
   */
  downloadBundleJson(bundle: TeamExportBundle, filename?: string) {
    const defaultName = `barista-studio-team-${bundle.team.name.replace(/\s+/g, '_').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    const jsonStr = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || defaultName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
