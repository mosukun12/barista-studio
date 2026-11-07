import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Wheat, Edit3, Trash2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Ingredient, Category, MeasurementUnit } from '../types';
import { ingredientService } from '../services/ingredientService';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { STANDARD_UNITS } from '../lib/units';

export const IngredientsPage: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal create/edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Partial<Ingredient> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Deletion confirm state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [usageWarning, setUsageWarning] = useState<{ isUsed: boolean; recipeNames: string[] } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [ingList, catList, unitList] = await Promise.all([
        ingredientService.getIngredients(),
        ingredientService.getCategories('ingredient'),
        ingredientService.getUnits(),
      ]);
      setIngredients(ingList);
      setCategories(catList);
      setUnits(unitList.length > 0 ? unitList : STANDARD_UNITS);
    } catch (err) {
      console.error('Error loading ingredients page:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered ingredients
  const filtered = ingredients.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || item.category_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleOpenNew = () => {
    setEditingIngredient({
      name: '',
      brand: '',
      category_id: categories[0]?.id || null,
      default_unit_id: units[0]?.id || 'u-ml',
      description: '',
      notes: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Ingredient) => {
    setEditingIngredient(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIngredient?.name?.trim()) {
      alert('กรุณาระบุชื่อวัตถุดิบ');
      return;
    }

    try {
      setIsSaving(true);
      if (editingIngredient.id) {
        await ingredientService.updateIngredient(editingIngredient.id, editingIngredient);
      } else {
        await ingredientService.createIngredient(editingIngredient);
      }
      setIsModalOpen(false);
      setEditingIngredient(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'บันทึกวัตถุดิบล้มเหลว');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePromptDelete = async (item: Ingredient) => {
    const usage = await ingredientService.checkIngredientUsage(item.id);
    setUsageWarning(usage);
    setDeleteTarget({ id: item.id, name: item.name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await ingredientService.deleteIngredient(deleteTarget.id, true);
      setDeleteTarget(null);
      setUsageWarning(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถลบวัตถุดิบได้');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-cafe-text dark:text-cafe-cream">
            คลังวัตถุดิบ (Ingredient Inventory)
          </h1>
          <p className="text-xs sm:text-sm text-cafe-muted mt-0.5">
            จัดการรายการวัตถุดิบ แบรนด์ หน่วยวัดเริ่มต้น และตรวจสอบการใช้งานในสูตร
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenNew}
        >
          เพิ่มวัตถุดิบใหม่
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cafe-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อวัตถุดิบ, แบรนด์, โน้ต..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs py-2.5 px-3 rounded-xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper"
        >
          <option value="all">ทุกหมวดหมู่วัตถุดิบ</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Content Table or Empty */}
      {isLoading ? (
        <div className="p-16 text-center text-cafe-muted">
          <span className="w-8 h-8 border-2 border-cafe-copper border-t-transparent rounded-full animate-spin inline-block mb-2" />
          <div className="text-xs">กำลังโหลดคลังวัตถุดิบ...</div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'ไม่พบวัตถุดิบที่ค้นหา' : 'ยังไม่มีวัตถุดิบในคลัง'}
          description={
            searchQuery
              ? 'ลองค้นหาด้วยคำอื่น หรือเพิ่มวัตถุดิบใหม่เข้าระบบ'
              : 'เพิ่มวัตถุดิบ เช่น เมล็ดกาแฟ, นมสด, ไซรัป หรือผงชา เพื่อนำไปใช้สร้างสูตรเครื่องดื่ม'
          }
          actionLabel="เพิ่มวัตถุดิบชิ้นแรก"
          onAction={handleOpenNew}
          icon={<Wheat className="w-8 h-8 text-cafe-brass" />}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cafe-border dark:border-cafe-darkBorder bg-cafe-surface dark:bg-cafe-darkCard shadow-cafe-subtle">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cafe-border/80 dark:border-cafe-darkBorder bg-cafe-cream/60 dark:bg-cafe-darkSurface/60 text-xs font-bold text-cafe-muted uppercase tracking-wider">
                <th className="py-3 px-4">ชื่อวัตถุดิบ</th>
                <th className="py-3 px-4">แบรนด์</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4">หน่วยวัดเริ่มต้น</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4">โน้ต / คำอธิบาย</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cafe-border/60 dark:divide-cafe-darkBorder text-sm">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-cafe-cream/40 dark:hover:bg-cafe-darkSurface/50 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-cafe-text dark:text-cafe-cream">
                    {item.name}
                  </td>
                  <td className="py-3 px-4 text-xs text-cafe-muted font-mono">
                    {item.brand || '-'}
                  </td>
                  <td className="py-3 px-4 text-xs text-cafe-muted">
                    {item.category_name || '-'}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-cafe-copper">
                    {item.default_unit_symbol || '-'}
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {item.is_active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ใช้งานอยู่
                      </span>
                    ) : (
                      <span className="text-cafe-muted">ปิดใช้งาน</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-cafe-muted max-w-xs truncate">
                    {item.notes || item.description || '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-cafe-muted hover:text-cafe-copper rounded-lg hover:bg-cafe-cream dark:hover:bg-cafe-darkBorder transition-colors"
                        title="แก้ไขวัตถุดิบ"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePromptDelete(item)}
                        className="p-1.5 text-cafe-muted hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="ลบวัตถุดิบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add/Edit */}
      {isModalOpen && editingIngredient && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingIngredient.id ? 'แก้ไขข้อมูลวัตถุดิบ' : 'เพิ่มวัตถุดิบใหม่ (Add Ingredient)'}
          description="ข้อมูลวัตถุดิบนี้จะเชื่อมโยงกับสูตรเครื่องดื่มทั้งหมดในระบบ"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1">
                ชื่อวัตถุดิบ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editingIngredient.name || ''}
                onChange={(e) =>
                  setEditingIngredient({ ...editingIngredient, name: e.target.value })
                }
                placeholder="เช่น เมล็ด House Blend คั่วกลาง, นมสดเมจิ, ไซรัปวานิลลา"
                className="w-full px-3.5 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1">
                  แบรนด์ / ผู้ผลิต (Brand)
                </label>
                <input
                  type="text"
                  value={editingIngredient.brand || ''}
                  onChange={(e) =>
                    setEditingIngredient({ ...editingIngredient, brand: e.target.value })
                  }
                  placeholder="เช่น Monin, Meiji, Oatly"
                  className="w-full px-3.5 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1">
                  หมวดหมู่วัตถุดิบ
                </label>
                <select
                  value={editingIngredient.category_id || ''}
                  onChange={(e) =>
                    setEditingIngredient({
                      ...editingIngredient,
                      category_id: e.target.value || null,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
                >
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1">
                หน่วยวัดเริ่มต้น (Default Unit)
              </label>
              <select
                value={editingIngredient.default_unit_id || ''}
                onChange={(e) =>
                  setEditingIngredient({
                    ...editingIngredient,
                    default_unit_id: e.target.value || null,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none font-mono"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.symbol} — {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1">
                โน้ตและเทคนิคการจัดเก็บ (Notes & Storage)
              </label>
              <textarea
                rows={2}
                value={editingIngredient.notes || ''}
                onChange={(e) =>
                  setEditingIngredient({ ...editingIngredient, notes: e.target.value })
                }
                placeholder="เช่น แช่เย็นที่ 4°C หลังเปิดใช้, ปั๊ม 1 ครั้ง = 10ml"
                className="w-full px-3.5 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                checked={editingIngredient.is_active}
                onChange={(e) =>
                  setEditingIngredient({ ...editingIngredient, is_active: e.target.checked })
                }
                className="rounded border-cafe-border text-cafe-copper focus:ring-cafe-copper"
              />
              <label htmlFor="is_active" className="text-xs font-medium text-cafe-text dark:text-stone-300 cursor-pointer">
                เปิดใช้งานวัตถุดิบนี้ (Active)
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-cafe-border/60 dark:border-cafe-darkBorder">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setIsModalOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
              >
                บันทึกวัตถุดิบ
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete / Dependency Warning Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => {
            setDeleteTarget(null);
            setUsageWarning(null);
          }}
          onConfirm={handleConfirmDelete}
          title="ยืนยันการลบวัตถุดิบ"
          message={`คุณต้องการลบวัตถุดิบ "${deleteTarget.name}" หรือไม่?`}
          extraInfo={
            usageWarning?.isUsed ? (
              <div className="space-y-1 text-rose-600 dark:text-rose-400 font-medium">
                <div className="flex items-center gap-1 font-bold">
                  <AlertCircle className="w-4 h-4" /> คำเตือน: วัตถุดิบนี้กำลังถูกใช้งานอยู่ใน {usageWarning.recipeNames.length} สูตร:
                </div>
                <div className="pl-5 text-xs text-cafe-text dark:text-stone-300">
                  {usageWarning.recipeNames.join(', ')}
                </div>
                <div className="text-[11px] text-cafe-muted pt-1">
                  การลบอาจส่งผลกระทบต่อรายการส่วนผสมในสูตรดังกล่าว แนะนำให้ปิดสถานะการใช้งาน (Inactive) แทนการลบ
                </div>
              </div>
            ) : null
          }
          confirmLabel={usageWarning?.isUsed ? 'ยืนยันลบแม้ถูกใช้งาน' : 'ลบวัตถุดิบ'}
          isDestructive={true}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
