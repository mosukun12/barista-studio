import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Scale, Sparkles, RotateCcw, BookmarkPlus, Check, X } from 'lucide-react';
import { RecipeIngredientItem, Ingredient, MeasurementUnit } from '../../../types';
import { Button } from '../../common/Button';
import { STANDARD_UNITS } from '../../../lib/units';
import { ingredientService } from '../../../services/ingredientService';

interface IngredientsSectionProps {
  ingredients: RecipeIngredientItem[];
  onChange: (items: RecipeIngredientItem[]) => void;
  inventory: Ingredient[];
  units: MeasurementUnit[];
  onRefreshInventory: () => void;
}

export const IngredientsSection: React.FC<IngredientsSectionProps> = ({
  ingredients,
  onChange,
  inventory,
  units,
  onRefreshInventory,
}) => {
  const activeUnits = units.length > 0 ? units : STANDARD_UNITS;
  const ozUnit = activeUnits.find((u) => u.symbol.toLowerCase() === 'oz') || activeUnits[0];

  const [savingRowIndex, setSavingRowIndex] = useState<number | null>(null);

  // Add row for existing ingredient
  const handleAddRow = () => {
    const defaultIngredient = inventory[0];
    const newRow: RecipeIngredientItem = {
      ingredient_id: defaultIngredient ? defaultIngredient.id : '',
      quantity: 1, // Default 1 oz
      unit_id: defaultIngredient?.default_unit_id || ozUnit?.id || 'u-oz',
      custom_unit_symbol: 'oz',
      sort_order: ingredients.length + 1,
      note: '',
      ingredient_name: defaultIngredient?.name || '',
      unit_symbol: defaultIngredient?.default_unit_symbol || 'oz',
      is_new_ingredient: false,
    };
    onChange([...ingredients, newRow]);
  };

  // Add row for a brand-new ingredient (to be saved to inventory when recipe is saved)
  const handleAddNewIngredientRow = () => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRow: RecipeIngredientItem = {
      ingredient_id: tempId,
      quantity: 1, // Default 1 oz
      unit_id: ozUnit?.id || 'u-oz',
      custom_unit_symbol: 'oz',
      sort_order: ingredients.length + 1,
      note: '',
      ingredient_name: '',
      unit_symbol: ozUnit?.symbol || 'oz',
      is_new_ingredient: true,
    };
    onChange([...ingredients, newRow]);
  };

  const handleSwitchToNewIngredient = (index: number) => {
    const clone = [...ingredients];
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    clone[index] = {
      ...clone[index],
      ingredient_id: tempId,
      ingredient_name: '',
      is_new_ingredient: true,
    };
    onChange(clone);
  };

  const handleSwitchToExistingIngredient = (index: number) => {
    const defaultIngredient = inventory[0];
    const clone = [...ingredients];
    clone[index] = {
      ...clone[index],
      ingredient_id: defaultIngredient ? defaultIngredient.id : '',
      ingredient_name: defaultIngredient ? defaultIngredient.name : '',
      ingredient_brand: defaultIngredient?.brand || undefined,
      unit_id: defaultIngredient?.default_unit_id || clone[index].unit_id || ozUnit?.id || 'u-oz',
      unit_symbol: defaultIngredient?.default_unit_symbol || clone[index].unit_symbol || 'oz',
      is_new_ingredient: false,
    };
    onChange(clone);
  };

  const handleRemoveRow = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index).map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));
    onChange(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === ingredients.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const clone = [...ingredients];
    const [moved] = clone.splice(index, 1);
    clone.splice(targetIndex, 0, moved);

    const reindexed = clone.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));
    onChange(reindexed);
  };

  const handleFieldChange = (
    index: number,
    field: keyof RecipeIngredientItem,
    value: any
  ) => {
    const clone = [...ingredients];
    clone[index] = {
      ...clone[index],
      [field]: value,
    };

    // If ingredient_id changed, update ingredient_name and default unit
    if (field === 'ingredient_id') {
      if (value === '__NEW__') {
        handleSwitchToNewIngredient(index);
        return;
      }
      const match = inventory.find((i) => i.id === value);
      if (match) {
        clone[index].ingredient_name = match.name;
        clone[index].ingredient_brand = match.brand || undefined;
        clone[index].is_new_ingredient = false;
        if (match.default_unit_id) {
          clone[index].unit_id = match.default_unit_id;
          const u = activeUnits.find((unit) => unit.id === match.default_unit_id);
          clone[index].unit_symbol = u?.symbol || clone[index].unit_symbol || 'oz';
        }
      }
    }

    // If unit_id changed, update symbol
    if (field === 'unit_id') {
      const u = activeUnits.find((unit) => unit.id === value);
      clone[index].unit_symbol = u?.symbol || 'oz';
    }

    onChange(clone);
  };

  // Optional: Immediate persist to inventory if user clicks the quick save button
  const handleImmediatePersistToInventory = async (index: number) => {
    const item = ingredients[index];
    const name = item.ingredient_name?.trim();
    if (!name) {
      alert('กรุณากรอกชื่อวัตถุดิบใหม่ก่อนบันทึกเข้าคลัง');
      return;
    }

    try {
      setSavingRowIndex(index);
      const created = await ingredientService.createIngredient({
        name,
        brand: item.ingredient_brand || null,
        default_unit_id: item.unit_id || ozUnit?.id || 'u-oz',
      });
      await onRefreshInventory();

      const clone = [...ingredients];
      clone[index] = {
        ...clone[index],
        ingredient_id: created.id,
        ingredient_name: created.name,
        ingredient_brand: created.brand || undefined,
        is_new_ingredient: false,
      };
      onChange(clone);
      alert(`บันทึกวัตถุดิบ "${created.name}" เข้าสู่คลังวัตถุดิบเรียบร้อยแล้ว`);
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถบันทึกวัตถุดิบเข้าคลังได้');
    } finally {
      setSavingRowIndex(null);
    }
  };

  return (
    <section className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-4 sm:p-6 shadow-cafe-subtle space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cafe-border/60 dark:border-cafe-darkBorder">
        <div>
          <h2 className="text-base font-bold text-cafe-text dark:text-cafe-cream flex items-center gap-2">
            <Scale className="w-5 h-5 text-cafe-copper" />
            Section C: ส่วนผสมและอัตราส่วน (Ingredients & Measurements)
          </h2>
          <p className="text-xs text-cafe-muted mt-0.5">
            บันทึกส่วนผสม ปริมาณ และหน่วยวัด (หากเป็นวัตถุดิบใหม่ ระบบจะเซฟเข้าคลังวัตถุดิบให้อัตโนมัติเมื่อกดบันทึกสูตร)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Sparkles className="w-4 h-4 text-cafe-copper" />}
            onClick={handleAddNewIngredientRow}
            title="เพิ่มแถววัตถุดิบใหม่ (จะถูกเซฟเข้าคลังวัตถุดิบเมื่อบันทึกสูตร)"
          >
            + วัตถุดิบใหม่
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Plus className="w-4 h-4 text-cafe-copper" />}
            onClick={handleAddRow}
          >
            เพิ่มส่วนผสม
          </Button>
        </div>
      </div>

      {ingredients.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-cafe-border dark:border-cafe-darkBorder rounded-xl bg-cafe-cream/30 dark:bg-cafe-darkSurface/30 space-y-3">
          <p className="text-sm text-cafe-muted">ยังไม่มีรายการส่วนผสมในสูตรนี้</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Sparkles className="w-4 h-4 text-cafe-copper" />}
              onClick={handleAddNewIngredientRow}
            >
              + เพิ่มวัตถุดิบใหม่
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleAddRow}
            >
              เลือกจากคลังวัตถุดิบ
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Header row on desktop */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs font-bold text-cafe-muted px-2 uppercase tracking-wider">
            <div className="col-span-1 text-center">ลำดับ</div>
            <div className="col-span-4">วัตถุดิบ (Ingredient)</div>
            <div className="col-span-2">ปริมาณ (Qty)</div>
            <div className="col-span-2">หน่วย (Unit) [เน้น oz]</div>
            <div className="col-span-2">โน้ตเพิ่มเติม</div>
            <div className="col-span-1 text-right">จัดการ</div>
          </div>

          {/* Rows */}
          {ingredients.map((item, index) => (
            <div
              key={index}
              className={`grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 sm:p-2.5 rounded-xl border items-center text-sm transition-colors ${
                item.is_new_ingredient
                  ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 shadow-xs'
                  : 'bg-cafe-cream/50 dark:bg-cafe-darkSurface/60 border-cafe-border/60 dark:border-cafe-darkBorder'
              }`}
            >
              {/* Order buttons */}
              <div className="sm:col-span-1 flex sm:flex-col items-center justify-between sm:justify-center gap-1">
                <span className="font-mono text-xs font-semibold text-cafe-muted px-1.5">
                  #{index + 1}
                </span>
                <div className="flex sm:flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    className="p-1.5 sm:p-1 text-cafe-muted hover:text-cafe-text disabled:opacity-30 rounded hover:bg-cafe-sand/50 touch-manipulation"
                    title="เลื่อนขึ้น"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === ingredients.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    className="p-1.5 sm:p-1 text-cafe-muted hover:text-cafe-text disabled:opacity-30 rounded hover:bg-cafe-sand/50 touch-manipulation"
                    title="เลื่อนลง"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Ingredient selector OR New Ingredient Input */}
              <div className="sm:col-span-4 min-w-0">
                {item.is_new_ingredient ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={item.ingredient_name || ''}
                        onChange={(e) => handleFieldChange(index, 'ingredient_name', e.target.value)}
                        placeholder="พิมพ์ชื่อวัตถุดิบใหม่..."
                        className="w-full px-3 py-2 rounded-lg bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-copper text-xs text-cafe-text dark:text-cafe-cream focus:ring-1 focus:ring-cafe-copper focus:outline-none min-h-[40px] font-medium"
                        autoFocus={!item.ingredient_name}
                      />
                      <button
                        type="button"
                        onClick={() => handleSwitchToExistingIngredient(index)}
                        title="สลับกลับไปเลือกจากคลังวัตถุดิบเดิม"
                        className="p-2 sm:px-2.5 sm:py-2 text-cafe-muted hover:text-cafe-text bg-cafe-surface dark:bg-cafe-darkCard rounded-lg border border-cafe-border dark:border-cafe-darkBorder text-xs flex items-center gap-1 flex-shrink-0 min-h-[40px] hover:border-cafe-copper/50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden md:inline text-[11px]">เลือกจากคลัง</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-1 text-[11px] px-1">
                      <span className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1 truncate">
                        <Sparkles className="w-3.5 h-3.5 text-cafe-copper flex-shrink-0" />
                        วัตถุดิบใหม่ (เซฟเข้าคลังเมื่อบันทึกสูตร)
                      </span>
                      {item.ingredient_name?.trim() && (
                        <button
                          type="button"
                          disabled={savingRowIndex === index}
                          onClick={() => handleImmediatePersistToInventory(index)}
                          className="text-[10px] text-cafe-copper hover:underline flex items-center gap-0.5 flex-shrink-0"
                          title="กดเพื่อบันทึกวัตถุดิบนี้เข้าสู่คลังล่วงหน้าทันที"
                        >
                          <BookmarkPlus className="w-3 h-3" />
                          <span>{savingRowIndex === index ? 'กำลังเซฟ...' : 'เซฟเข้าคลังเลย'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={item.ingredient_id}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          handleSwitchToNewIngredient(index);
                        } else {
                          handleFieldChange(index, 'ingredient_id', e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:ring-1 focus:ring-cafe-copper focus:outline-none min-h-[40px]"
                    >
                      <option value="">-- เลือกวัตถุดิบ --</option>
                      <option
                        value="__NEW__"
                        className="font-bold text-cafe-copper bg-amber-50 dark:bg-amber-950/40"
                      >
                        ✨ ➕ เพิ่มวัตถุดิบใหม่ (เซฟเข้าคลังเมื่อบันทึกสูตร)...
                      </option>
                      <optgroup label="คลังวัตถุดิบที่มีอยู่">
                        {inventory.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} {ing.brand ? `(${ing.brand})` : ''}
                          </option>
                        ))}
                      </optgroup>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleSwitchToNewIngredient(index)}
                      title="เพิ่มวัตถุดิบใหม่ (พิมพ์ชื่อและเซฟเข้าคลังเมื่อบันทึกสูตร)"
                      className="p-2 sm:p-2.5 text-cafe-copper hover:text-cafe-copper-hover bg-cafe-cream/80 dark:bg-cafe-darkCard rounded-lg border border-cafe-border/80 dark:border-cafe-darkBorder flex-shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center hover:border-cafe-copper"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="sm:col-span-2">
                <label className="block sm:hidden text-[11px] font-semibold text-cafe-muted mb-1">
                  ปริมาณ:
                </label>
                <input
                  type="number"
                  step="any"
                  value={item.quantity === 0 ? '' : item.quantity}
                  onChange={(e) =>
                    handleFieldChange(index, 'quantity', parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:ring-1 focus:ring-cafe-copper focus:outline-none font-mono min-h-[40px]"
                />
              </div>

              {/* Unit (Emphasizing oz) */}
              <div className="sm:col-span-2">
                <label className="block sm:hidden text-[11px] font-semibold text-cafe-muted mb-1">
                  หน่วยวัด:
                </label>
                <select
                  value={item.unit_id || ozUnit?.id || ''}
                  onChange={(e) => handleFieldChange(index, 'unit_id', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:ring-1 focus:ring-cafe-copper focus:outline-none font-mono font-medium min-h-[40px]"
                >
                  {/* Prioritize oz at the top */}
                  {ozUnit && (
                    <option value={ozUnit.id} className="font-bold text-cafe-copper">
                      ⭐ oz (ออนซ์) [หลัก]
                    </option>
                  )}
                  {activeUnits
                    .filter((u) => u.id !== ozUnit?.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.symbol} ({u.name})
                      </option>
                    ))}
                </select>
              </div>

              {/* Note */}
              <div className="sm:col-span-2">
                <label className="block sm:hidden text-[11px] font-semibold text-cafe-muted mb-1">
                  โน้ตเพิ่มเติม:
                </label>
                <input
                  type="text"
                  value={item.note || ''}
                  onChange={(e) => handleFieldChange(index, 'note', e.target.value)}
                  placeholder="เช่น หวาน 50%, ช็อตสกัด"
                  className="w-full px-3 py-2 rounded-lg bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:ring-1 focus:ring-cafe-copper focus:outline-none min-h-[40px]"
                />
              </div>

              {/* Delete button */}
              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemoveRow(index)}
                  className="p-2 text-cafe-muted hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                  title="ลบส่วนผสมนี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
