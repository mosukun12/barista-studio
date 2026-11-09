import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderTree,
  Plus,
  Search,
  Edit3,
  Trash2,
  Coffee,
  Wheat,
  Layers,
  Tag,
  CheckCircle2,
  X,
  SlidersHorizontal,
  TableProperties,
} from 'lucide-react';
import { Category } from '../types';
import { ingredientService } from '../services/ingredientService';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'recipe' | 'ingredient'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'recipe' | 'ingredient'>('recipe');
  const [formDescription, setFormDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirm State
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ingredientService.getCategories('all');
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Counts
  const recipeCount = useMemo(
    () => categories.filter((c) => c.category_type === 'recipe').length,
    [categories]
  );
  const ingredientCount = useMemo(
    () => categories.filter((c) => c.category_type === 'ingredient').length,
    [categories]
  );

  // In-memory instant filtering
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      // 1. Type filter
      if (filterType !== 'all' && c.category_type !== filterType) {
        return false;
      }
      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(q);
        const matchDesc = (c.description || '').toLowerCase().includes(q);
        const matchSlug = (c.slug || '').toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchSlug) return false;
      }
      return true;
    });
  }, [categories, filterType, searchQuery]);

  // Open Modal for Add
  const handleOpenAdd = (defaultType: 'recipe' | 'ingredient' = 'recipe') => {
    setEditingCategory(null);
    setFormName('');
    setFormType(filterType !== 'all' ? filterType : defaultType);
    setFormDescription('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormType(cat.category_type as 'recipe' | 'ingredient');
    setFormDescription(cat.description || '');
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('กรุณากรอกชื่อหมวดหมู่');
      return;
    }

    try {
      setIsSaving(true);
      if (editingCategory) {
        await ingredientService.updateCategory(editingCategory.id, {
          name: formName.trim(),
          description: formDescription.trim() || null,
        });
      } else {
        await ingredientService.createCategory({
          name: formName.trim(),
          category_type: formType,
          description: formDescription.trim() || null,
          sort_order: categories.length + 1,
        });
      }
      setIsModalOpen(false);
      await loadCategories();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการบันทึกหมวดหมู่');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Category
  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      setIsDeleting(true);
      await ingredientService.deleteCategory(deletingCategory.id);
      setDeletingCategory(null);
      await loadCategories();
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถลบหมวดหมู่ได้');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-28 lg:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cafe-copper/15 text-cafe-copper flex items-center justify-center font-bold">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-cafe-text dark:text-cafe-cream">
                จัดการหมวดหมู่ (Categories)
              </h1>
              <p className="text-xs text-cafe-muted mt-0.5">
                จัดหมวดหมู่สูตรเครื่องดื่ม และหมวดหมู่วัตถุดิบสำหรับการชง
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="md"
            icon={<TableProperties className="w-4 h-4 text-cafe-copper" />}
            onClick={() => navigate('/batch?tab=categories')}
          >
            จัดการแบบชุด (Batch Editor)
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => handleOpenAdd(filterType !== 'all' ? filterType : 'recipe')}
          >
            เพิ่มหมวดหมู่ใหม่
          </Button>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total */}
        <div
          onClick={() => setFilterType('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterType === 'all'
              ? 'bg-cafe-copper/10 border-cafe-copper dark:border-cafe-copper shadow-xs'
              : 'bg-cafe-surface dark:bg-cafe-darkCard border-cafe-border dark:border-cafe-darkBorder hover:border-cafe-copper/40'
          }`}
        >
          <div className="flex items-center justify-between text-cafe-muted mb-1">
            <span className="text-xs font-medium">หมวดหมู่ทั้งหมด</span>
            <Layers className="w-4 h-4 text-cafe-copper" />
          </div>
          <div className="text-2xl font-bold font-mono text-cafe-text dark:text-cafe-cream">
            {categories.length}
          </div>
          <span className="text-[10px] text-cafe-muted">รวมทุกประเภท</span>
        </div>

        {/* Recipe Categories */}
        <div
          onClick={() => setFilterType('recipe')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterType === 'recipe'
              ? 'bg-cafe-copper/10 border-cafe-copper dark:border-cafe-copper shadow-xs'
              : 'bg-cafe-surface dark:bg-cafe-darkCard border-cafe-border dark:border-cafe-darkBorder hover:border-cafe-copper/40'
          }`}
        >
          <div className="flex items-center justify-between text-cafe-muted mb-1">
            <span className="text-xs font-medium truncate">หมวดหมู่สูตร</span>
            <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cafe-text dark:text-cafe-cream">
            {recipeCount}
          </div>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            สำหรับสูตรเครื่องดื่ม
          </span>
        </div>

        {/* Ingredient Categories */}
        <div
          onClick={() => setFilterType('ingredient')}
          className={`col-span-2 sm:col-span-1 p-4 rounded-2xl border transition-all cursor-pointer ${
            filterType === 'ingredient'
              ? 'bg-cafe-copper/10 border-cafe-copper dark:border-cafe-copper shadow-xs'
              : 'bg-cafe-surface dark:bg-cafe-darkCard border-cafe-border dark:border-cafe-darkBorder hover:border-cafe-copper/40'
          }`}
        >
          <div className="flex items-center justify-between text-cafe-muted mb-1">
            <span className="text-xs font-medium truncate">หมวดหมู่วัตถุดิบ</span>
            <Wheat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cafe-text dark:text-cafe-cream">
            {ingredientCount}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            สำหรับคลังวัตถุดิบ
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Type Segmented Buttons */}
        <div className="flex items-center bg-cafe-cream dark:bg-cafe-darkSurface p-1 rounded-xl border border-cafe-border/70 dark:border-cafe-darkBorder">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-cafe-surface dark:bg-cafe-darkCard text-cafe-copper shadow-xs'
                : 'text-cafe-muted hover:text-cafe-text'
            }`}
          >
            ทั้งหมด ({categories.length})
          </button>
          <button
            onClick={() => setFilterType('recipe')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              filterType === 'recipe'
                ? 'bg-cafe-surface dark:bg-cafe-darkCard text-cafe-copper shadow-xs'
                : 'text-cafe-muted hover:text-cafe-text'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>สูตร ({recipeCount})</span>
          </button>
          <button
            onClick={() => setFilterType('ingredient')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              filterType === 'ingredient'
                ? 'bg-cafe-surface dark:bg-cafe-darkCard text-cafe-copper shadow-xs'
                : 'text-cafe-muted hover:text-cafe-text'
            }`}
          >
            <Wheat className="w-3.5 h-3.5" />
            <span>วัตถุดิบ ({ingredientCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cafe-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อหมวดหมู่..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-xs sm:text-sm text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-1 focus:ring-cafe-copper"
          />
        </div>
      </div>

      {/* Categories Grid List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-cafe-surface/60 dark:bg-cafe-darkCard/60 border border-cafe-border dark:border-cafe-darkBorder animate-pulse p-4"
            />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          title={
            searchQuery
              ? 'ไม่พบหมวดหมู่ที่ตรงกับการค้นหา'
              : filterType === 'recipe'
              ? 'ยังไม่มีหมวดหมู่สูตรเครื่องดื่ม'
              : filterType === 'ingredient'
              ? 'ยังไม่มีหมวดหมู่วัตถุดิบ'
              : 'ยังไม่มีหมวดหมู่ในระบบ'
          }
          description="คุณสามารถเพิ่มหมวดหมู่ใหม่เพื่อนำไปใช้จัดกลุ่มสูตรเครื่องดื่มและวัตถุดิบได้ทันที"
          actionLabel="เพิ่มหมวดหมู่แรก"
          onAction={() => handleOpenAdd(filterType !== 'all' ? filterType : 'recipe')}
          icon={<FolderTree className="w-8 h-8 text-cafe-copper" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((c) => {
            const isRecipeType = c.category_type === 'recipe';

            return (
              <div
                key={c.id}
                className="p-4 sm:p-5 rounded-2xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder hover:border-cafe-copper/50 transition-all shadow-cafe-subtle flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        isRecipeType
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                      }`}
                    >
                      {isRecipeType ? <Coffee className="w-3 h-3" /> : <Wheat className="w-3 h-3" />}
                      <span>{isRecipeType ? 'หมวดหมู่สูตร' : 'หมวดหมู่วัตถุดิบ'}</span>
                    </span>

                    <span className="text-[10px] text-cafe-muted font-mono truncate max-w-[120px]">
                      {c.slug}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-cafe-text dark:text-cafe-cream group-hover:text-cafe-copper transition-colors">
                      {c.name}
                    </h3>
                    {c.description ? (
                      <p className="text-xs text-cafe-muted mt-1 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                    ) : (
                      <p className="text-xs text-cafe-muted/60 italic mt-1">
                        ไม่มีคำอธิบายเพิ่มเติม
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions bottom bar */}
                <div className="pt-3 border-t border-cafe-border/50 dark:border-cafe-darkBorder/60 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-2 text-cafe-muted hover:text-cafe-copper rounded-xl hover:bg-cafe-cream/70 dark:hover:bg-cafe-darkSurface transition-colors"
                    title="แก้ไขหมวดหมู่นี้"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeletingCategory(c)}
                    className="p-2 text-cafe-muted hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="ลบหมวดหมู่นี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add or Edit Category */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md max-h-[90vh] bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-cafe-border/60 dark:border-cafe-darkBorder flex items-center justify-between bg-cafe-cream/40 dark:bg-cafe-darkSurface/60 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cafe-copper/15 text-cafe-copper flex items-center justify-center font-bold">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-cafe-text dark:text-cafe-cream">
                    {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
                  </h3>
                  <p className="text-[11px] text-cafe-muted">
                    {editingCategory ? 'ปรับปรุงข้อมูลหมวดหมู่' : 'สร้างหมวดหมู่สำหรับจัดกลุ่มสูตรหรือวัตถุดิบ'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-cafe-muted hover:text-cafe-text dark:hover:text-cafe-cream hover:bg-cafe-cream/60 dark:hover:bg-cafe-darkSurface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body (Scrollable) */}
            <form id="category-form" onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Category Type */}
              <div>
                <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
                  ประเภทหมวดหมู่ <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={Boolean(editingCategory)}
                    onClick={() => setFormType('recipe')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      formType === 'recipe'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 shadow-xs ring-1 ring-amber-500/30'
                        : 'bg-cafe-surface dark:bg-cafe-darkSurface border-cafe-border dark:border-cafe-darkBorder text-cafe-muted'
                    } ${editingCategory ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <Coffee className="w-4 h-4" />
                    <span>สูตรเครื่องดื่ม (Recipe)</span>
                  </button>

                  <button
                    type="button"
                    disabled={Boolean(editingCategory)}
                    onClick={() => setFormType('ingredient')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      formType === 'ingredient'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/30'
                        : 'bg-cafe-surface dark:bg-cafe-darkSurface border-cafe-border dark:border-cafe-darkBorder text-cafe-muted'
                    } ${editingCategory ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <Wheat className="w-4 h-4" />
                    <span>วัตถุดิบ (Ingredient)</span>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
                  ชื่อหมวดหมู่ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={
                    formType === 'recipe'
                      ? "เช่น 'Specialty Coffee', 'Cold Brew & Nitro', 'Tea & Refreshment'"
                      : "เช่น 'Coffee Beans', 'Dairy & Milks', 'Syrups & Sauces', 'Powders'"
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-xs sm:text-sm text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
                  คำอธิบายเพิ่มเติม
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="รายละเอียดสั้นๆ เกี่ยวกับหมวดหมู่นี้..."
                  className="w-full px-3.5 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper resize-none"
                />
              </div>
            </form>

            {/* Modal Sticky Footer (Always visible per Rule 2) */}
            <div className="p-3 sm:p-4 border-t border-cafe-border/60 dark:border-cafe-darkBorder bg-cafe-cream/30 dark:bg-cafe-darkSurface/90 flex items-center justify-end gap-2.5 flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                ยกเลิก
              </Button>
              <Button
                form="category-form"
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSaving}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                {editingCategory ? 'บันทึกการแก้ไข' : 'สร้างหมวดหมู่'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDelete}
        title="ยืนยันการลบหมวดหมู่"
        message={`คุณต้องการลบหมวดหมู่ "${deletingCategory?.name}" หรือไม่? หากมีสูตรหรือวัตถุดิบที่ใช้หมวดหมู่นี้อยู่ ข้อมูลจะยังคงอยู่แต่จะถูกปลดหมวดหมู่ออก`}
        confirmLabel="ลบหมวดหมู่"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
