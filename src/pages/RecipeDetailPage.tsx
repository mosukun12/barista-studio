import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Edit3,
  Copy,
  Archive,
  Trash2,
  Clock,
  Coffee,
  ArrowLeft,
  Scale,
  ListOrdered,
  BookOpen,
  GitBranch,
  History,
  CheckCircle2,
  Share2,
  Beaker,
} from 'lucide-react';
import { Recipe, RecipeVersionItem } from '../types';
import {
  recipeService,
  deduplicateIngredients,
  deduplicateSteps,
  deduplicateNotes,
} from '../services/recipeService';
import { StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { VersionHistoryDrawer } from '../components/recipes/editor/VersionHistoryDrawer';
import { DRINK_TYPE_CONFIG, NOTE_TYPE_CONFIG, formatDuration, formatDate } from '../lib/utils';

export const RecipeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<RecipeVersionItem[]>([]);

  // Sanitized & Deduplicated collections for robust UI display
  const displayIngredients = useMemo(
    () => (recipe?.ingredients ? deduplicateIngredients(recipe.ingredients) : []),
    [recipe?.ingredients]
  );
  const displaySteps = useMemo(
    () => (recipe?.steps ? deduplicateSteps(recipe.steps) : []),
    [recipe?.steps]
  );
  const displayNotes = useMemo(
    () => (recipe?.notes ? deduplicateNotes(recipe.notes) : []),
    [recipe?.notes]
  );

  const loadRecipe = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await recipeService.getRecipeById(id);
      setRecipe(data);
      if (data) {
        const v = await recipeService.getRecipeVersions(data.id);
        setVersions(v);
      }
    } catch (err) {
      console.error('Error fetching recipe:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const handleDuplicate = async () => {
    if (!recipe) return;
    try {
      const copy = await recipeService.duplicateRecipe(recipe.id);
      navigate(`/recipes/${copy.id}`);
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถทำสำเนาได้');
    }
  };

  const handleToggleArchive = async () => {
    if (!recipe) return;
    try {
      const updated = await recipeService.toggleArchiveRecipe(recipe.id, !recipe.is_archived);
      setRecipe(updated);
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถเปลี่ยนสถานะได้');
    }
  };

  const handleDelete = async () => {
    if (!recipe) return;
    try {
      setIsDeleting(true);
      await recipeService.deleteRecipe(recipe.id);
      navigate('/recipes');
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถลบสูตรได้');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    if (!recipe) return;
    try {
      const restored = await recipeService.restoreVersion(recipe.id, versionNumber);
      setRecipe(restored);
      const v = await recipeService.getRecipeVersions(recipe.id);
      setVersions(v);
      alert(`กู้คืนสูตรจาก Version ${versionNumber} สำเร็จ`);
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถกู้คืนได้');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3">
        <span className="w-8 h-8 border-2 border-cafe-copper border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-cafe-muted">กำลังโหลดสูตรเครื่องดื่ม...</span>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-lg font-bold text-cafe-text dark:text-cafe-cream">
          ไม่พบสูตรเครื่องดื่มที่ค้นหา
        </h2>
        <Button variant="secondary" onClick={() => navigate('/recipes')}>
          กลับไปคลังสูตร
        </Button>
      </div>
    );
  }

  const drinkConfig = recipe.drink_type ? DRINK_TYPE_CONFIG[recipe.drink_type] : null;

  return (
    <div className="space-y-6 pb-20">
      {/* Back button & top toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => navigate('/recipes')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-cafe-muted hover:text-cafe-text dark:hover:text-cafe-cream"
        >
          <ArrowLeft className="w-4 h-4" /> กลับไปคลังสูตร
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<History className="w-4 h-4 text-cafe-copper" />}
            onClick={() => setIsHistoryOpen(true)}
          >
            ประวัติ (v{recipe.current_version || 1})
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Copy className="w-4 h-4 text-cafe-muted" />}
            onClick={handleDuplicate}
          >
            ทำสำเนา
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Archive className="w-4 h-4 text-amber-600" />}
            onClick={handleToggleArchive}
          >
            {recipe.is_archived ? 'เลิกเก็บถาวร' : 'เก็บถาวร'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Edit3 className="w-4 h-4" />}
            onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
          >
            แก้ไขสูตร
          </Button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-cafe-muted hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="ลบสูตร"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder overflow-hidden shadow-cafe-card">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Cover photo or coffee placeholder */}
          <div className="h-64 md:h-auto bg-cafe-cream dark:bg-cafe-darkSurface relative overflow-hidden">
            {recipe.cover_image_url ? (
              <img
                src={recipe.cover_image_url}
                alt={recipe.name_th}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-cafe-muted/60">
                <Coffee className="w-16 h-16 stroke-1 text-cafe-brass mb-2" />
                <span className="font-mono text-xs uppercase tracking-wider">
                  {recipe.glass_size || 'Barista Spec'}
                </span>
              </div>
            )}
            <div className="absolute top-4 left-4">
              <StatusBadge status={recipe.status} size="md" />
            </div>
          </div>

          {/* Details header */}
          <div className="md:col-span-2 p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {drinkConfig && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cafe-cream dark:bg-cafe-darkSurface text-cafe-copper border border-cafe-border dark:border-cafe-darkBorder">
                    {drinkConfig.icon} {drinkConfig.label}
                  </span>
                )}
                {recipe.category_name && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cafe-cream dark:bg-cafe-darkSurface text-cafe-muted border border-cafe-border dark:border-cafe-darkBorder">
                    {recipe.category_name}
                  </span>
                )}
                {recipe.glass_size && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-cafe-copper/10 text-cafe-copper border border-cafe-copper/20">
                    ขนาดแก้ว: {recipe.glass_size}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-cafe-text dark:text-cafe-cream">
                {recipe.name_th}
              </h1>
              {recipe.name_en && (
                <p className="text-base text-cafe-muted font-mono mt-1">
                  {recipe.name_en}
                </p>
              )}

              {recipe.description && (
                <p className="mt-4 text-sm text-cafe-muted dark:text-stone-300 leading-relaxed">
                  {recipe.description}
                </p>
              )}

              {/* Tags */}
              {recipe.tags && recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {recipe.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md text-[11px] bg-cafe-cream/80 dark:bg-cafe-darkSurface text-cafe-muted border border-cafe-border/60 dark:border-cafe-darkBorder"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Serving & Prep specs */}
            <div className="pt-4 border-t border-cafe-border/60 dark:border-cafe-darkBorder grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="block text-cafe-muted">ประเภทแก้ว</span>
                <span className="font-semibold text-cafe-text dark:text-cafe-cream">
                  {recipe.glass_type || '-'}
                </span>
              </div>
              <div>
                <span className="block text-cafe-muted">ประเภทฝา</span>
                <span className="font-semibold text-cafe-text dark:text-cafe-cream">
                  {recipe.lid_type || '-'}
                </span>
              </div>
              <div>
                <span className="block text-cafe-muted">ประเภทหลอด</span>
                <span className="font-semibold text-cafe-text dark:text-cafe-cream">
                  {recipe.straw_type || '-'}
                </span>
              </div>
              <div>
                <span className="block text-cafe-muted">เวลาชงโดยเฉลี่ย</span>
                <span className="font-semibold text-cafe-text dark:text-cafe-cream font-mono">
                  {formatDuration(recipe.prep_time_seconds)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two columns: Ingredients & Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Ingredients Workbench Table */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-5 sm:p-6 shadow-cafe-subtle space-y-4">
            <h2 className="text-base font-bold text-cafe-text dark:text-cafe-cream flex items-center gap-2">
              <Scale className="w-5 h-5 text-cafe-copper" />
              ส่วนผสมและสัดส่วน (Ingredients)
            </h2>

            {displayIngredients.length > 0 ? (
              <div className="divide-y divide-cafe-border/60 dark:divide-cafe-darkBorder">
                {displayIngredients.map((ing, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="font-semibold text-cafe-text dark:text-cafe-cream">
                        {ing.ingredient_name || 'ส่วนผสม'}
                      </div>
                      {ing.note && (
                        <div className="text-xs text-cafe-muted mt-0.5">{ing.note}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-cafe-copper text-base">
                        {ing.quantity}
                      </span>{' '}
                      <span className="text-xs text-cafe-muted font-mono">
                        {ing.unit_symbol || ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-cafe-muted py-4 text-center">
                ยังไม่มีข้อมูลส่วนผสมในสูตรนี้
              </p>
            )}
          </div>

          {/* Variations Card if any */}
          {recipe.variants && recipe.variants.length > 0 && (
            <div className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-5 sm:p-6 shadow-cafe-subtle space-y-3">
              <h2 className="text-sm font-bold text-cafe-text dark:text-cafe-cream flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-cafe-copper" />
                รูปแบบย่อย (Variations)
              </h2>
              <div className="space-y-2">
                {recipe.variants.map((v, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-cafe-cream/50 dark:bg-cafe-darkSurface/60 border border-cafe-border/60 dark:border-cafe-darkBorder text-xs"
                  >
                    <div className="font-bold text-cafe-text dark:text-cafe-cream">
                      {v.variant_name}
                    </div>
                    {v.description && (
                      <div className="text-cafe-muted mt-1 leading-relaxed">
                        {v.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Preparation Steps & Barista Notes */}
        <div className="lg:col-span-7 space-y-6">
          {/* Steps */}
          <div className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-5 sm:p-6 shadow-cafe-subtle space-y-4">
            <h2 className="text-base font-bold text-cafe-text dark:text-cafe-cream flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-cafe-copper" />
              ขั้นตอนการทำ (Preparation Steps)
            </h2>

            {displaySteps.length > 0 ? (
              <div className="space-y-4">
                {displaySteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-cafe-cream/40 dark:bg-cafe-darkSurface/60 border border-cafe-border/60 dark:border-cafe-darkBorder space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-cafe-copper text-white font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {step.step_number}
                        </span>
                        <h3 className="font-semibold text-sm text-cafe-text dark:text-cafe-cream">
                          {step.title}
                        </h3>
                      </div>

                      {step.duration_seconds > 0 && (
                        <span className="text-xs font-mono text-cafe-muted flex items-center gap-1 bg-white/60 dark:bg-black/30 px-2 py-0.5 rounded-md border border-cafe-border/50 dark:border-cafe-darkBorder">
                          <Clock className="w-3 h-3 text-cafe-copper" />
                          {step.duration_seconds} วินาที
                        </span>
                      )}
                    </div>

                    {step.description && (
                      <p className="text-xs text-cafe-muted dark:text-stone-300 leading-relaxed pl-8">
                        {step.description}
                      </p>
                    )}

                    {/* Step Ingredients List */}
                    {step.ingredients && step.ingredients.length > 0 && (
                      <div className="pl-8 flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[11px] text-cafe-muted flex items-center gap-1 font-medium mr-0.5">
                          <Beaker className="w-3 h-3 text-cafe-copper" />
                          วัตถุดิบ:
                        </span>
                        {step.ingredients.map((ing, iIdx) => (
                          <span
                            key={iIdx}
                            className="px-2 py-0.5 rounded-md text-[11px] bg-cafe-copper/10 text-cafe-copper dark:text-cafe-cream border border-cafe-copper/20 font-medium"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    )}

                    {step.equipment && (
                      <div className="pl-8 text-[11px] text-cafe-muted font-mono">
                        อุปกรณ์: <span className="text-cafe-text dark:text-cafe-cream">{step.equipment}</span>
                      </div>
                    )}

                    {step.image_url && (
                      <div className="pl-8 pt-1">
                        <img
                          src={step.image_url}
                          alt={step.title}
                          className="max-h-48 rounded-lg object-cover border border-cafe-border dark:border-cafe-darkBorder"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-cafe-muted py-4 text-center">
                ยังไม่มีการบันทึกขั้นตอนการชง
              </p>
            )}
          </div>

          {/* Notes & Barista Tips */}
          {displayNotes.length > 0 && (
            <div className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-5 sm:p-6 shadow-cafe-subtle space-y-3">
              <h2 className="text-base font-bold text-cafe-text dark:text-cafe-cream flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cafe-copper" />
                เทคนิคและโน้ตบาริสต้า (Techniques & Notes)
              </h2>

              <div className="space-y-3">
                {displayNotes.map((n, idx) => {
                  const config = NOTE_TYPE_CONFIG[n.note_type] || NOTE_TYPE_CONFIG.tip;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border ${config.bgClass} ${config.borderClass}`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs mb-1">
                        <span>{config.icon}</span>
                        <span className={config.textClass}>
                          {n.title || config.label}
                        </span>
                      </div>
                      <p className="text-xs text-cafe-text dark:text-stone-300 leading-relaxed pl-6">
                        {n.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="ยืนยันการลบสูตรเครื่องดื่ม"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบสูตร "${recipe.name_th}"? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        confirmLabel="ลบสูตรถาวร"
        isDestructive={true}
        isLoading={isDeleting}
      />

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
