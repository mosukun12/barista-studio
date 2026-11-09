import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  TableProperties,
  BookOpen,
  Wheat,
  FolderTree,
  Save,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Filter,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { recipeService } from '../services/recipeService';
import { ingredientService } from '../services/ingredientService';
import { Recipe, Ingredient, Category, MeasurementUnit } from '../types';
import { BatchRowItem, BatchTabType } from '../components/batch/BatchTypes';
import { BatchRecipesTable } from '../components/batch/BatchRecipesTable';
import { BatchIngredientsTable } from '../components/batch/BatchIngredientsTable';
import { BatchCategoriesTable } from '../components/batch/BatchCategoriesTable';
import { BatchQuickImportModal } from '../components/batch/BatchQuickImportModal';

export const BatchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabParam = (searchParams.get('tab') as BatchTabType) || 'recipes';
  const [activeTab, setActiveTab] = useState<BatchTabType>(
    ['recipes', 'ingredients', 'categories'].includes(tabParam) ? tabParam : 'recipes'
  );

  // Data states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Common reference data
  const [recipeCategories, setRecipeCategories] = useState<Category[]>([]);
  const [ingredientCategories, setIngredientCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);

  // Batch rows states
  const [recipeRows, setRecipeRows] = useState<BatchRowItem<Recipe>[]>([]);
  const [ingredientRows, setIngredientRows] = useState<BatchRowItem<Ingredient>[]>([]);
  const [categoryRows, setCategoryRows] = useState<BatchRowItem<Category>[]>([]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Sync tab with URL
  const handleTabChange = (newTab: BatchTabType) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
    setSearchQuery('');
  };

  // Load all master data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [recipes, ingredients, allCategories, allUnits] = await Promise.all([
        recipeService.getRecipes(),
        ingredientService.getIngredients(),
        ingredientService.getCategories('all'),
        ingredientService.getUnits(),
      ]);

      setRecipeCategories(allCategories.filter((c) => c.category_type === 'recipe'));
      setIngredientCategories(allCategories.filter((c) => c.category_type === 'ingredient'));
      setUnits(allUnits);

      // Initialize Recipe Rows
      setRecipeRows(
        recipes.map((r) => ({
          _rowId: r.id,
          _isNew: false,
          _isDeleted: false,
          _isModified: false,
          data: { ...r },
          original: { ...r },
        }))
      );

      // Initialize Ingredient Rows
      setIngredientRows(
        ingredients.map((i) => ({
          _rowId: i.id,
          _isNew: false,
          _isDeleted: false,
          _isModified: false,
          data: { ...i },
          original: { ...i },
        }))
      );

      // Initialize Category Rows
      setCategoryRows(
        allCategories.map((c) => ({
          _rowId: c.id,
          _isNew: false,
          _isDeleted: false,
          _isModified: false,
          data: { ...c },
          original: { ...c },
        }))
      );
    } catch (err: any) {
      console.error('Error loading batch data:', err);
      setSaveErrorMsg(err.message || 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Track changes count for active tab
  const activeStats = useMemo(() => {
    let rows: BatchRowItem<any>[] = [];
    if (activeTab === 'recipes') rows = recipeRows;
    else if (activeTab === 'ingredients') rows = ingredientRows;
    else if (activeTab === 'categories') rows = categoryRows;

    const newCount = rows.filter((r) => r._isNew && !r._isDeleted).length;
    const modCount = rows.filter((r) => r._isModified && !r._isNew && !r._isDeleted).length;
    const delCount = rows.filter((r) => r._isDeleted && !r._isNew).length;
    const totalCount = rows.filter((r) => !r._isDeleted).length;
    const hasChanges = newCount > 0 || modCount > 0 || delCount > 0;

    return { newCount, modCount, delCount, totalCount, hasChanges };
  }, [activeTab, recipeRows, ingredientRows, categoryRows]);

  // --- Handlers for RECIPES ---
  const handleRecipeChange = (rowId: string, updates: Partial<Recipe>) => {
    setRecipeRows((prev) =>
      prev.map((row) => {
        if (row._rowId !== rowId) return row;
        const updatedData = { ...row.data, ...updates };
        const isModified =
          row._isNew ||
          JSON.stringify(updatedData) !== JSON.stringify(row.original);
        return {
          ...row,
          data: updatedData,
          _isModified: isModified,
        };
      })
    );
  };

  const handleRecipeDelete = (rowId: string) => {
    setRecipeRows((prev) => {
      const target = prev.find((r) => r._rowId === rowId);
      if (!target) return prev;
      if (target._isNew) {
        return prev.filter((r) => r._rowId !== rowId);
      }
      return prev.map((r) =>
        r._rowId === rowId ? { ...r, _isDeleted: !r._isDeleted } : r
      );
    });
  };

  const handleRecipeDuplicate = (rowId: string) => {
    const target = recipeRows.find((r) => r._rowId === rowId);
    if (!target) return;
    const clonedData: Recipe = {
      ...target.data,
      id: crypto.randomUUID(),
      name_th: `${target.data.name_th} (สำเนา)`,
      name_en: target.data.name_en ? `${target.data.name_en} (Copy)` : null,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const newRow: BatchRowItem<Recipe> = {
      _rowId: crypto.randomUUID(),
      _isNew: true,
      _isDeleted: false,
      _isModified: true,
      data: clonedData,
      original: clonedData,
    };
    setRecipeRows((prev) => [newRow, ...prev]);
  };

  const handleRecipeAddEmpty = (count: number) => {
    const newItems: BatchRowItem<Recipe>[] = Array.from({ length: count }).map(() => {
      const initial: Recipe = {
        id: crypto.randomUUID(),
        user_id: 'default_user',
        name_th: '',
        name_en: null,
        description: null,
        cover_image_url: null,
        category_id: recipeCategories[0]?.id || null,
        drink_type: 'iced',
        glass_size: '16 oz',
        glass_type: null,
        lid_type: null,
        straw_type: null,
        serving_notes: null,
        status: 'draft',
        difficulty: 'medium',
        prep_time_seconds: 120,
        is_archived: false,
        current_version: 1,
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return {
        _rowId: crypto.randomUUID(),
        _isNew: true,
        _isDeleted: false,
        _isModified: true,
        data: initial,
        original: initial,
      };
    });
    setRecipeRows((prev) => [...newItems, ...prev]);
  };

  // --- Handlers for INGREDIENTS ---
  const handleIngredientChange = (rowId: string, updates: Partial<Ingredient>) => {
    setIngredientRows((prev) =>
      prev.map((row) => {
        if (row._rowId !== rowId) return row;
        const updatedData = { ...row.data, ...updates };
        const isModified =
          row._isNew ||
          JSON.stringify(updatedData) !== JSON.stringify(row.original);
        return {
          ...row,
          data: updatedData,
          _isModified: isModified,
        };
      })
    );
  };

  const handleIngredientDelete = (rowId: string) => {
    setIngredientRows((prev) => {
      const target = prev.find((r) => r._rowId === rowId);
      if (!target) return prev;
      if (target._isNew) {
        return prev.filter((r) => r._rowId !== rowId);
      }
      return prev.map((r) =>
        r._rowId === rowId ? { ...r, _isDeleted: !r._isDeleted } : r
      );
    });
  };

  const handleIngredientDuplicate = (rowId: string) => {
    const target = ingredientRows.find((r) => r._rowId === rowId);
    if (!target) return;
    const clonedData: Ingredient = {
      ...target.data,
      id: crypto.randomUUID(),
      name: `${target.data.name} (สำเนา)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const newRow: BatchRowItem<Ingredient> = {
      _rowId: crypto.randomUUID(),
      _isNew: true,
      _isDeleted: false,
      _isModified: true,
      data: clonedData,
      original: clonedData,
    };
    setIngredientRows((prev) => [newRow, ...prev]);
  };

  const handleIngredientAddEmpty = (count: number) => {
    const newItems: BatchRowItem<Ingredient>[] = Array.from({ length: count }).map(() => {
      const initial: Ingredient = {
        id: crypto.randomUUID(),
        user_id: 'default_user',
        name: '',
        brand: null,
        category_id: ingredientCategories[0]?.id || null,
        default_unit_id: units[0]?.id || null,
        description: null,
        image_url: null,
        notes: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return {
        _rowId: crypto.randomUUID(),
        _isNew: true,
        _isDeleted: false,
        _isModified: true,
        data: initial,
        original: initial,
      };
    });
    setIngredientRows((prev) => [...newItems, ...prev]);
  };

  // --- Handlers for CATEGORIES ---
  const handleCategoryChange = (rowId: string, updates: Partial<Category>) => {
    setCategoryRows((prev) =>
      prev.map((row) => {
        if (row._rowId !== rowId) return row;
        const updatedData = { ...row.data, ...updates };
        const isModified =
          row._isNew ||
          JSON.stringify(updatedData) !== JSON.stringify(row.original);
        return {
          ...row,
          data: updatedData,
          _isModified: isModified,
        };
      })
    );
  };

  const handleCategoryDelete = (rowId: string) => {
    setCategoryRows((prev) => {
      const target = prev.find((r) => r._rowId === rowId);
      if (!target) return prev;
      if (target._isNew) {
        return prev.filter((r) => r._rowId !== rowId);
      }
      return prev.map((r) =>
        r._rowId === rowId ? { ...r, _isDeleted: !r._isDeleted } : r
      );
    });
  };

  const handleCategoryDuplicate = (rowId: string) => {
    const target = categoryRows.find((r) => r._rowId === rowId);
    if (!target) return;
    const clonedData: Category = {
      ...target.data,
      id: crypto.randomUUID(),
      name: `${target.data.name} (สำเนา)`,
      created_at: new Date().toISOString(),
    };
    const newRow: BatchRowItem<Category> = {
      _rowId: crypto.randomUUID(),
      _isNew: true,
      _isDeleted: false,
      _isModified: true,
      data: clonedData,
      original: clonedData,
    };
    setCategoryRows((prev) => [newRow, ...prev]);
  };

  const handleCategoryAddEmpty = (count: number) => {
    const newItems: BatchRowItem<Category>[] = Array.from({ length: count }).map(() => {
      const initial: Category = {
        id: crypto.randomUUID(),
        user_id: 'default_user',
        category_type: 'recipe',
        name: '',
        slug: `category-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        description: null,
        icon: null,
        sort_order: (categoryRows.length + 1) * 10,
        created_at: new Date().toISOString(),
      };
      return {
        _rowId: crypto.randomUUID(),
        _isNew: true,
        _isDeleted: false,
        _isModified: true,
        data: initial,
        original: initial,
      };
    });
    setCategoryRows((prev) => [...newItems, ...prev]);
  };

  // Quick Import from Modal
  const handleQuickImport = (items: any[]) => {
    if (activeTab === 'recipes') {
      const rowsToAppend: BatchRowItem<Recipe>[] = items.map((item) => {
        const fullRecipe: Recipe = {
          id: crypto.randomUUID(),
          user_id: 'default_user',
          name_th: item.name_th,
          name_en: item.name_en || null,
          category_id: recipeCategories[0]?.id || null,
          drink_type: item.drink_type || 'iced',
          glass_size: item.glass_size || '16 oz',
          glass_type: null,
          lid_type: null,
          straw_type: null,
          serving_notes: null,
          status: item.status || 'draft',
          difficulty: item.difficulty || 'medium',
          prep_time_seconds: item.prep_time_seconds || 120,
          is_archived: false,
          current_version: 1,
          tags: item.tags || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return {
          _rowId: crypto.randomUUID(),
          _isNew: true,
          _isDeleted: false,
          _isModified: true,
          data: fullRecipe,
          original: fullRecipe,
        };
      });
      setRecipeRows((prev) => [...rowsToAppend, ...prev]);
    } else if (activeTab === 'ingredients') {
      const rowsToAppend: BatchRowItem<Ingredient>[] = items.map((item) => {
        const fullIng: Ingredient = {
          id: crypto.randomUUID(),
          user_id: 'default_user',
          name: item.name,
          brand: item.brand || null,
          category_id: ingredientCategories[0]?.id || null,
          default_unit_id: units[0]?.id || null,
          notes: item.notes || null,
          is_active: item.is_active !== false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return {
          _rowId: crypto.randomUUID(),
          _isNew: true,
          _isDeleted: false,
          _isModified: true,
          data: fullIng,
          original: fullIng,
        };
      });
      setIngredientRows((prev) => [...rowsToAppend, ...prev]);
    } else if (activeTab === 'categories') {
      const rowsToAppend: BatchRowItem<Category>[] = items.map((item, idx) => {
        const fullCat: Category = {
          id: crypto.randomUUID(),
          user_id: 'default_user',
          category_type: item.category_type || 'recipe',
          name: item.name,
          slug: `category-${Date.now()}-${idx}`,
          description: item.description || null,
          icon: null,
          sort_order: (categoryRows.length + idx + 1) * 10,
          created_at: new Date().toISOString(),
        };
        return {
          _rowId: crypto.randomUUID(),
          _isNew: true,
          _isDeleted: false,
          _isModified: true,
          data: fullCat,
          original: fullCat,
        };
      });
      setCategoryRows((prev) => [...rowsToAppend, ...prev]);
    }
    setSaveSuccessMsg(`นำเข้าข้อมูลใหม่สำเร็จ ${items.length} รายการ (กรุณากดบันทึกเพื่อจัดเก็บถาวร)`);
  };

  // Reset Changes
  const handleReset = () => {
    if (!window.confirm('คุณต้องการยกเลิกการเปลี่ยนแปลงทั้งหมดในหน้านี้และคืนค่าเดิมหรือไม่?')) {
      return;
    }
    loadData();
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
  };

  // Save All Changes for active tab
  const handleSaveAll = async () => {
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      setIsSaving(true);

      if (activeTab === 'recipes') {
        const creates = recipeRows
          .filter((r) => r._isNew && !r._isDeleted)
          .map((r) => r.data);
        const updates = recipeRows
          .filter((r) => r._isModified && !r._isNew && !r._isDeleted)
          .map((r) => ({ id: r.data.id, data: r.data }));
        const deletes = recipeRows
          .filter((r) => r._isDeleted && !r._isNew)
          .map((r) => r.data.id);

        // Validation: required name_th
        for (const item of creates) {
          if (!item.name_th?.trim()) {
            throw new Error('มีสูตรใหม่บางแถวที่ยังไม่ได้ระบุชื่อสูตรภาษาไทย');
          }
        }
        for (const item of updates) {
          if (!item.data.name_th?.trim()) {
            throw new Error('ชื่อสูตรภาษาไทยห้ามเป็นค่าว่าง');
          }
        }

        const res = await recipeService.batchSaveRecipes({ creates, updates, deletes });
        setSaveSuccessMsg(
          `บันทึกสูตรเครื่องดื่มสำเร็จ! (เพิ่มใหม่ ${res.created}, แก้ไข ${res.updated}, ลบ ${res.deleted})`
        );
      } else if (activeTab === 'ingredients') {
        const creates = ingredientRows
          .filter((r) => r._isNew && !r._isDeleted)
          .map((r) => r.data);
        const updates = ingredientRows
          .filter((r) => r._isModified && !r._isNew && !r._isDeleted)
          .map((r) => ({ id: r.data.id, data: r.data }));
        const deletes = ingredientRows
          .filter((r) => r._isDeleted && !r._isNew)
          .map((r) => r.data.id);

        for (const item of creates) {
          if (!item.name?.trim()) {
            throw new Error('มีวัตถุดิบใหม่บางแถวที่ยังไม่ได้ระบุชื่อวัตถุดิบ');
          }
        }
        for (const item of updates) {
          if (!item.data.name?.trim()) {
            throw new Error('ชื่อวัตถุดิบห้ามเป็นค่าว่าง');
          }
        }

        const res = await ingredientService.batchSaveIngredients({ creates, updates, deletes });
        setSaveSuccessMsg(
          `บันทึกคลังวัตถุดิบสำเร็จ! (เพิ่มใหม่ ${res.created}, แก้ไข ${res.updated}, ลบ ${res.deleted})`
        );
      } else if (activeTab === 'categories') {
        const creates = categoryRows
          .filter((r) => r._isNew && !r._isDeleted)
          .map((r) => r.data);
        const updates = categoryRows
          .filter((r) => r._isModified && !r._isNew && !r._isDeleted)
          .map((r) => ({ id: r.data.id, data: r.data }));
        const deletes = categoryRows
          .filter((r) => r._isDeleted && !r._isNew)
          .map((r) => r.data.id);

        for (const item of creates) {
          if (!item.name?.trim()) {
            throw new Error('มีหมวดหมู่ใหม่บางแถวที่ยังไม่ได้ระบุชื่อหมวดหมู่');
          }
        }
        for (const item of updates) {
          if (!item.data.name?.trim()) {
            throw new Error('ชื่อหมวดหมู่ห้ามเป็นค่าว่าง');
          }
        }

        const res = await ingredientService.batchSaveCategories({ creates, updates, deletes });
        setSaveSuccessMsg(
          `บันทึกหมวดหมู่สำเร็จ! (เพิ่มใหม่ ${res.created}, แก้ไข ${res.updated}, ลบ ${res.deleted})`
        );
      }

      await loadData();
    } catch (err: any) {
      console.error('Batch save error:', err);
      setSaveErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-cafe-muted hover:text-cafe-text dark:hover:text-cafe-cream hover:bg-cafe-cream/60 dark:hover:bg-cafe-darkCard transition-colors"
              title="ย้อนกลับ"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-cafe-copper/15 text-cafe-copper flex items-center justify-center font-bold">
              <TableProperties className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-cafe-text dark:text-cafe-cream">
                จัดการข้อมูลแบบชุด (Batch Management)
              </h1>
              <p className="text-xs sm:text-sm text-cafe-muted mt-0.5">
                เพิ่มและแก้ไขสูตร วัตถุดิบ และหมวดหมู่หลายรายการพร้อมกันในหน้าเดียว
              </p>
            </div>
          </div>
        </div>

        {/* Global Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cafe-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาในตาราง..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-cafe-border dark:border-cafe-darkBorder bg-cafe-surface dark:bg-cafe-darkSurface text-xs text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper/30 transition-all placeholder:text-cafe-muted"
          />
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder overflow-x-auto shadow-cafe-subtle">
        <button
          onClick={() => handleTabChange('recipes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'recipes'
              ? 'bg-cafe-espresso dark:bg-cafe-copper text-white shadow-sm'
              : 'text-cafe-muted hover:text-cafe-text dark:hover:text-cafe-cream hover:bg-cafe-cream/50 dark:hover:bg-cafe-darkSurface/50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>สูตรเครื่องดื่ม (Recipes)</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'recipes'
                ? 'bg-white/20 text-white'
                : 'bg-cafe-cream dark:bg-cafe-darkSurface text-cafe-muted'
            }`}
          >
            {recipeRows.filter((r) => !r._isDeleted).length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('ingredients')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'ingredients'
              ? 'bg-cafe-espresso dark:bg-cafe-copper text-white shadow-sm'
              : 'text-cafe-muted hover:text-cafe-text dark:hover:text-cafe-cream hover:bg-cafe-cream/50 dark:hover:bg-cafe-darkSurface/50'
          }`}
        >
          <Wheat className="w-4 h-4" />
          <span>คลังวัตถุดิบ (Ingredients)</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'ingredients'
                ? 'bg-white/20 text-white'
                : 'bg-cafe-cream dark:bg-cafe-darkSurface text-cafe-muted'
            }`}
          >
            {ingredientRows.filter((r) => !r._isDeleted).length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'categories'
              ? 'bg-cafe-espresso dark:bg-cafe-copper text-white shadow-sm'
              : 'text-cafe-muted hover:text-cafe-text dark:hover:text-cafe-cream hover:bg-cafe-cream/50 dark:hover:bg-cafe-darkSurface/50'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>หมวดหมู่ (Categories)</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'categories'
                ? 'bg-white/20 text-white'
                : 'bg-cafe-cream dark:bg-cafe-darkSurface text-cafe-muted'
            }`}
          >
            {categoryRows.filter((r) => !r._isDeleted).length}
          </span>
        </button>
      </div>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-2xl border border-emerald-200 text-xs font-medium flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {saveErrorMsg && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 rounded-2xl border border-rose-200 text-xs font-medium flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{saveErrorMsg}</span>
          </div>
          <button
            onClick={() => setSaveErrorMsg(null)}
            className="text-rose-700 hover:text-rose-900 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tables Content */}
      {isLoading ? (
        <div className="py-20 text-center text-cafe-muted text-sm space-y-2">
          <div className="w-7 h-7 border-2 border-cafe-copper border-t-transparent rounded-full animate-spin mx-auto" />
          <p>กำลังโหลดตารางข้อมูลแบบชุด...</p>
        </div>
      ) : (
        <>
          {activeTab === 'recipes' && (
            <BatchRecipesTable
              rows={recipeRows}
              onChangeRow={handleRecipeChange}
              onDeleteRow={handleRecipeDelete}
              onDuplicateRow={handleRecipeDuplicate}
              onAddEmptyRows={handleRecipeAddEmpty}
              categories={recipeCategories}
              filterQuery={searchQuery}
              onOpenImport={() => setIsImportModalOpen(true)}
            />
          )}

          {activeTab === 'ingredients' && (
            <BatchIngredientsTable
              rows={ingredientRows}
              onChangeRow={handleIngredientChange}
              onDeleteRow={handleIngredientDelete}
              onDuplicateRow={handleIngredientDuplicate}
              onAddEmptyRows={handleIngredientAddEmpty}
              categories={ingredientCategories}
              units={units}
              filterQuery={searchQuery}
              onOpenImport={() => setIsImportModalOpen(true)}
            />
          )}

          {activeTab === 'categories' && (
            <BatchCategoriesTable
              rows={categoryRows}
              onChangeRow={handleCategoryChange}
              onDeleteRow={handleCategoryDelete}
              onDuplicateRow={handleCategoryDuplicate}
              onAddEmptyRows={handleCategoryAddEmpty}
              filterQuery={searchQuery}
              onOpenImport={() => setIsImportModalOpen(true)}
            />
          )}
        </>
      )}

      {/* Quick Import Modal */}
      <BatchQuickImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        type={activeTab}
        onImport={handleQuickImport}
      />

      {/* Sticky Bottom Action Bar (Rule 2: Responsive & Touch-friendly) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-cafe-darkSurface/95 backdrop-blur-md border-t border-cafe-border dark:border-cafe-darkBorder p-3.5 sm:px-8 shadow-2xl transition-all">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Summary status */}
          <div className="text-xs text-cafe-text dark:text-cafe-cream flex items-center gap-2 flex-wrap text-center sm:text-left">
            <span className="font-semibold">
              รายการทั้งหมด {activeStats.totalCount} รายการ
            </span>
            <span className="text-cafe-muted">|</span>
            {activeStats.hasChanges ? (
              <span className="flex items-center gap-1.5 flex-wrap">
                {activeStats.newCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                    +{activeStats.newCount} เพิ่มใหม่
                  </span>
                )}
                {activeStats.modCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                    ✏️ {activeStats.modCount} มีการแก้ไข
                  </span>
                )}
                {activeStats.delCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
                    🗑️ {activeStats.delCount} ลบ
                  </span>
                )}
              </span>
            ) : (
              <span className="text-cafe-muted">ยังไม่มีการแก้ไข</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              variant="secondary"
              size="md"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={handleReset}
              disabled={!activeStats.hasChanges || isSaving}
              className="flex-1 sm:flex-none min-h-[42px]"
            >
              คืนค่าเดิม (Reset)
            </Button>

            <Button
              variant="primary"
              size="md"
              icon={<Save className="w-4 h-4" />}
              onClick={handleSaveAll}
              disabled={!activeStats.hasChanges}
              isLoading={isSaving}
              className="flex-1 sm:flex-none min-h-[42px] px-6 shadow-cafe-button"
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลงทั้งหมด'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
