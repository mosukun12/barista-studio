import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Coffee, Sparkles, TableProperties } from 'lucide-react';
import { Recipe, RecipeFilterOptions, Category } from '../types';
import { recipeService } from '../services/recipeService';
import { ingredientService } from '../services/ingredientService';
import { RecipeFilterBar } from '../components/recipes/RecipeFilterBar';
import { RecipeCard } from '../components/recipes/RecipeCard';
import { RecipeTableRow } from '../components/recipes/RecipeTableRow';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const RecipesPage: React.FC = () => {
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [filters, setFilters] = useState<RecipeFilterOptions>({
    searchQuery: '',
    category: 'all',
    status: 'all',
    drinkType: 'all',
    sortBy: 'updated_at',
    sortOrder: 'desc',
    showArchived: false,
  });

  const [deletingRecipeId, setDeletingRecipeId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load backend data only when underlying query parameters change (not on search typing)
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams: Partial<RecipeFilterOptions> = {
        category: filters.category,
        status: filters.status,
        drinkType: filters.drinkType,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        showArchived: filters.showArchived,
      };

      const [recipeData, categoryData] = await Promise.all([
        recipeService.getRecipes(queryParams),
        ingredientService.getCategories('recipe'),
      ]);
      setRecipes(recipeData);
      setCategories(categoryData);
    } catch (err) {
      console.error('Error loading recipes page:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    filters.category,
    filters.status,
    filters.drinkType,
    filters.sortBy,
    filters.sortOrder,
    filters.showArchived,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side instant filter: ensures 0 layout jitter, 0 skeleton flash when typing
  const filteredRecipes = useMemo(() => {
    if (!filters.searchQuery?.trim()) return recipes;
    const q = filters.searchQuery.toLowerCase().trim();
    return recipes.filter(
      (r) =>
        r.name_th?.toLowerCase().includes(q) ||
        (r.name_en && r.name_en.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        r.tags?.some((t) => t.toLowerCase().includes(q)) ||
        r.ingredients?.some((ing) => ing.ingredient_name?.toLowerCase().includes(q))
    );
  }, [recipes, filters.searchQuery]);

  const handleFilterChange = (updates: Partial<RecipeFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleDuplicate = async (id: string) => {
    try {
      const copy = await recipeService.duplicateRecipe(id);
      loadData();
      navigate(`/recipes/${copy.id}`);
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถทำสำเนาได้');
    }
  };

  const handleArchive = async (id: string, currentState: boolean) => {
    try {
      await recipeService.toggleArchiveRecipe(id, !currentState);
      loadData();
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถเปลี่ยนสถานะ Archive ได้');
    }
  };

  const handleDelete = async () => {
    if (!deletingRecipeId) return;
    try {
      setIsDeleting(true);
      await recipeService.deleteRecipe(deletingRecipeId);
      setDeletingRecipeId(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถลบสูตรได้');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-cafe-text dark:text-cafe-cream">
            คลังสูตรเครื่องดื่ม (Recipe Book)
          </h1>
          <p className="text-xs sm:text-sm text-cafe-muted mt-0.5">
            รวบรวม จัดหมวดหมู่ และพัฒนาสูตรเครื่องดื่มประจำตัวของคุณ
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="md"
            icon={<TableProperties className="w-4 h-4 text-cafe-copper" />}
            onClick={() => navigate('/batch?tab=recipes')}
          >
            จัดการแบบชุด (Batch Editor)
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/recipes/new')}
          >
            สร้างสูตรเครื่องดื่มใหม่
          </Button>
        </div>
      </div>

      {/* Filter and search toolbar */}
      <RecipeFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={filteredRecipes.length}
      />

      {/* Content representation */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-72 rounded-2xl bg-cafe-surface/60 dark:bg-cafe-darkCard/60 border border-cafe-border dark:border-cafe-darkBorder animate-pulse p-4"
            />
          ))}
        </div>
      ) : filteredRecipes.length === 0 ? (
        <EmptyState
          title={
            filters.searchQuery || filters.category !== 'all' || filters.status !== 'all'
              ? 'ไม่พบสูตรที่ตรงกับเงื่อนไขการค้นหา'
              : 'ยังไม่มีสูตรเครื่องดื่มในคลังของคุณ'
          }
          description={
            filters.searchQuery || filters.category !== 'all' || filters.status !== 'all'
              ? 'ลองปรับเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองเพื่อดูสูตรทั้งหมด'
              : 'เริ่มต้นสร้างสูตรแรกของคุณได้ทันที ไม่จำกัดจำนวนส่วนผสมและขั้นตอน พร้อมระบบติดตามเวอร์ชัน'
          }
          actionLabel="สร้างสูตรเครื่องดื่มแรก"
          onAction={() => navigate('/recipes/new')}
          icon={<Coffee className="w-8 h-8 text-cafe-copper" />}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onDuplicate={handleDuplicate}
              onArchive={handleArchive}
              onDelete={(id) => setDeletingRecipeId(id)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cafe-border dark:border-cafe-darkBorder bg-cafe-surface dark:bg-cafe-darkCard shadow-cafe-subtle">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cafe-border/80 dark:border-cafe-darkBorder bg-cafe-cream/60 dark:bg-cafe-darkSurface/60 text-xs font-bold text-cafe-muted uppercase tracking-wider">
                <th className="py-3 px-4 w-14">รูป</th>
                <th className="py-3 px-4">ชื่อเครื่องดื่ม</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4">ประเภท/แก้ว</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4">โครงสร้างสูตร</th>
                <th className="py-3 px-4">แก้ไขล่าสุด</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecipes.map((recipe) => (
                <RecipeTableRow
                  key={recipe.id}
                  recipe={recipe}
                  onDuplicate={handleDuplicate}
                  onArchive={handleArchive}
                  onDelete={(id) => setDeletingRecipeId(id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingRecipeId)}
        onClose={() => setDeletingRecipeId(null)}
        onConfirm={handleDelete}
        title="ยืนยันการลบสูตรเครื่องดื่ม"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบสูตรนี้อย่างถาวร? การกระทำนี้ไม่สามารถย้อนคืนได้"
        confirmLabel="ลบสูตรถาวร"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
