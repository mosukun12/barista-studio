import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, History, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Recipe, Category, Ingredient, MeasurementUnit, RecipeVersionItem } from '../../../types';
import { GeneralSection } from './GeneralSection';
import { ServingSection } from './ServingSection';
import { IngredientsSection } from './IngredientsSection';
import { StepsSection } from './StepsSection';
import { NotesSection } from './NotesSection';
import { VariationsSection } from './VariationsSection';
import { VersionHistoryDrawer } from './VersionHistoryDrawer';
import { AutosaveBadge, AutosaveStatus } from '../../common/AutosaveBadge';
import { Button } from '../../common/Button';
import { recipeService } from '../../../services/recipeService';
import { ingredientService } from '../../../services/ingredientService';

interface RecipeEditorProps {
  initialRecipe?: Recipe;
  isNew?: boolean;
}

export const RecipeEditor: React.FC<RecipeEditorProps> = ({ initialRecipe, isNew = false }) => {
  const navigate = useNavigate();

  // Recipe master state
  const [recipe, setRecipe] = useState<Partial<Recipe>>(() => {
    if (initialRecipe) return initialRecipe;
    return {
      name_th: '',
      name_en: '',
      description: '',
      cover_image_url: null,
      category_id: null,
      drink_type: null,
      glass_size: '',
      glass_type: '',
      lid_type: '',
      straw_type: '',
      serving_notes: '',
      status: 'draft',
      difficulty: 'medium',
      prep_time_seconds: 120,
      tags: [],
      ingredients: [],
      steps: [],
      notes: [],
      variants: [],
    };
  });

  // Supporting registries
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);

  // Autosave and version history state
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<RecipeVersionItem[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentRecipeRef = useRef(recipe);
  currentRecipeRef.current = recipe;

  // Load supporting data
  const loadRegistries = useCallback(async () => {
    try {
      const [catData, ingData, unitData] = await Promise.all([
        ingredientService.getCategories('recipe'),
        ingredientService.getIngredients(),
        ingredientService.getUnits(),
      ]);
      setCategories(catData);
      setInventory(ingData);
      setUnits(unitData);
    } catch (err) {
      console.error('Error loading editor registries:', err);
    }
  }, []);

  const loadVersions = useCallback(async (recipeId: string) => {
    try {
      const v = await recipeService.getRecipeVersions(recipeId);
      setVersions(v);
    } catch (err) {
      console.error('Error loading versions:', err);
    }
  }, []);

  useEffect(() => {
    loadRegistries();
    if (initialRecipe?.id) {
      loadVersions(initialRecipe.id);
    }
  }, [initialRecipe?.id, loadRegistries, loadVersions]);

  // Handle updates from subcomponents
  const handleRecipeChange = (updates: Partial<Recipe>) => {
    setIsDirty(true);
    setRecipe((prev) => ({
      ...prev,
      ...updates,
    }));

    // Trigger debounced autosave only for existing recipes with a valid ID
    if (!isNew && initialRecipe?.id) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      setAutosaveStatus('saving');

      debounceTimerRef.current = setTimeout(async () => {
        try {
          await recipeService.updateRecipe(initialRecipe.id, {
            ...currentRecipeRef.current,
            ...updates,
          });
          setAutosaveStatus('saved');
          setLastSavedAt(new Date());
          setIsDirty(false);
        } catch (err: any) {
          console.error('Autosave failed:', err);
          setAutosaveStatus('error');
          setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการบันทึกอัตโนมัติ');
        }
      }, 1500);
    }
  };

  // Manual save
  const handleSaveManual = async () => {
    if (!recipe.name_th?.trim()) {
      alert('กรุณาระบุชื่อเครื่องดื่ม (ภาษาไทย)');
      return;
    }

    try {
      setIsSavingManual(true);
      setErrorMessage(null);

      if (isNew) {
        const created = await recipeService.createRecipe(recipe);
        setIsDirty(false);
        navigate(`/recipes/${created.id}`);
      } else if (initialRecipe?.id) {
        const changeSummary = prompt('ระบุสรุปการเปลี่ยนแปลงสำหรับบันทึก Version History:', 'อัปเดตสูตรและอัตราส่วน');
        const updated = await recipeService.updateRecipe(
          initialRecipe.id,
          recipe,
          changeSummary || 'อัปเดตสูตร'
        );
        setRecipe(updated);
        setIsDirty(false);
        setAutosaveStatus('saved');
        setLastSavedAt(new Date());
        loadVersions(initialRecipe.id);
        alert('บันทึกสูตรและสร้าง Version ใหม่เรียบร้อยแล้ว');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      alert(`บันทึกล้มเหลว: ${err.message}`);
    } finally {
      setIsSavingManual(false);
    }
  };

  // Restore past version handler
  const handleRestoreVersion = async (versionNumber: number) => {
    if (!initialRecipe?.id) return;
    try {
      const restored = await recipeService.restoreVersion(initialRecipe.id, versionNumber);
      setRecipe(restored);
      setIsDirty(false);
      loadVersions(initialRecipe.id);
      alert(`กู้คืนข้อมูลจาก Version ${versionNumber} สำเร็จ`);
    } catch (err: any) {
      alert(`ไม่สามารถกู้คืนได้: ${err.message}`);
    }
  };

  // Warn on browser leave if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return (
    <div className="space-y-6 pb-20">
      {/* Sticky Action Toolbar */}
      <div className="sticky top-16 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-cafe-surface/90 dark:bg-cafe-darkSurface/90 backdrop-blur-md rounded-2xl border border-cafe-border dark:border-cafe-darkBorder shadow-cafe-card">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (isDirty && !confirm('คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้หรือไม่?')) {
                return;
              }
              navigate(initialRecipe?.id ? `/recipes/${initialRecipe.id}` : '/recipes');
            }}
            className="p-2 text-cafe-muted hover:text-cafe-text rounded-xl hover:bg-cafe-cream dark:hover:bg-cafe-darkCard transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-base sm:text-lg text-cafe-text dark:text-cafe-cream">
              {isNew ? 'สร้างสูตรเครื่องดื่มใหม่' : `แก้ไขสูตร: ${recipe.name_th || 'ไม่มีชื่อ'}`}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <AutosaveBadge
                status={autosaveStatus}
                lastSavedAt={lastSavedAt}
                errorMessage={errorMessage}
              />
              {isDirty && autosaveStatus === 'idle' && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  • มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {!isNew && initialRecipe?.id && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<History className="w-4 h-4 text-cafe-copper" />}
              onClick={() => setIsHistoryOpen(true)}
            >
              ประวัติ (v{recipe.current_version || 1})
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            size="md"
            icon={<Save className="w-4 h-4" />}
            isLoading={isSavingManual}
            onClick={handleSaveManual}
          >
            {isNew ? 'บันทึกสูตรใหม่' : 'บันทึกสูตร (Save Version)'}
          </Button>
        </div>
      </div>

      {/* Editor Sections Stack */}
      <div className="space-y-6">
        {/* Section A: General */}
        <GeneralSection
          recipe={recipe}
          onChange={handleRecipeChange}
          categories={categories}
        />

        {/* Section B: Serving & Container */}
        <ServingSection
          recipe={recipe}
          onChange={handleRecipeChange}
        />

        {/* Section C: Ingredients */}
        <IngredientsSection
          ingredients={recipe.ingredients || []}
          onChange={(items) => handleRecipeChange({ ingredients: items })}
          inventory={inventory}
          units={units}
          onRefreshInventory={loadRegistries}
        />

        {/* Section D: Preparation Steps */}
        <StepsSection
          steps={recipe.steps || []}
          onChange={(items) => handleRecipeChange({ steps: items })}
          availableIngredients={recipe.ingredients || []}
        />

        {/* Section E: Techniques & Notes */}
        <NotesSection
          notes={recipe.notes || []}
          onChange={(items) => handleRecipeChange({ notes: items })}
        />

        {/* Section F: Variations */}
        <VariationsSection
          variants={recipe.variants || []}
          onChange={(items) => handleRecipeChange({ variants: items })}
          recipeId={initialRecipe?.id}
        />
      </div>

      {/* Version History Drawer */}
      <VersionHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        versions={versions}
        onRestore={handleRestoreVersion}
      />
    </div>
  );
};
