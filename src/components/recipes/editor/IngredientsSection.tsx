import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Scale, Check, X, Sparkles } from 'lucide-react';
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

  // Quick inline add ingredient state
  const [creatingRowIndex, setCreatingRowIndex] = useState<number | null>(null);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [isSubmittingQuickAdd, setIsSubmittingQuickAdd] = useState(false);

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
    };
    onChange([...ingredients, newRow]);
  };

  const handleRemoveRow = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index).map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));
    onChange(updated);
    if (creatingRowIndex === index) {
      setCreatingRowIndex(null);
      setNewIngredientName('');
    }
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
      const match = inventory.find((i) => i.id === value);
      if (match) {
        clone[index].ingredient_name = match.name;
        clone[index].ingredient_brand = match.brand || undefined;
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

  // Quick create ingredient if user inputs an ingredient that doesn't exist yet
  const handleQuickCreate = async (index: number, name: string) => {
    if (!name.trim()) {
      alert('กรุณากรอกชื่อวัตถุดิบใหม่');
      return;
    }
    try {
      setIsSubmittingQuickAdd(true);
      // Create with default unit oz
      const created = await ingredientService.createIngredient({
        name: name.trim(),
        default_unit_id: ozUnit?.id || 'u-oz',
      });
      await onRefreshInventory();

      // Immediately select newly created ingredient for this row
      const clone = [...ingredients];
      clone[index] = {
        ...clone[index],
        ingredient_id: created.id,
        ingredient_name: created.name,
        unit_id: ozUnit?.id || 'u-oz',
        unit_symbol: 'oz',
        custom_unit_symbol: 'oz',
      };
      onChange(clone);

      setCreatingRowIndex(null);
      setNewIngredientName('');
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถสร้างวัตถุดิบใหม่ได้');
    } finally {
      setIsSubmittingQuickAdd(false);
    }
  };

  return (
    <section className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-5 sm:p-6 shadow-cafe-subtle space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cafe-border/60 dark:border-cafe-darkBorder">
        <div>
          <h2 className="text-base font-bold text-cafe-text dark:text-cafe-cream flex items-center gap-2">
            <Scale className="w-5 h-5 text-cafe-copper" />
            Section C: ส่วนผสมและอัตราส่วน (Ingredients & Measurements)
          </h2>
          <p className="text-xs text-cafe-muted">
            บันทึกส่วนผสม ปริมาณ และหน่วยวัด (เน้นหน่วย oz เป็นหลัก หากไม่มีวัตถุดิบสามารถพิมพ์เพิ่มชื่อใหม่ได้ทันที)
          </p>
        </div>

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

      {ingredients.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-cafe-border dark:border-cafe-darkBorder rounded-xl bg-cafe-cream/30 dark:bg-cafe-darkSurface/30">
          <p className="text-sm text-cafe-muted mb-3">ยังไม่มีรายการส่วนผสมในสูตรนี้</p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleAddRow}
          >
            กดเพื่อเพิ่มส่วนผสมแรก
          </Button>
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
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 sm:p-2 rounded-xl bg-cafe-cream/50 dark:bg-cafe-darkSurface/60 border border-cafe-border/60 dark:border-cafe-darkBorder items-center text-sm"
            >
              {/* Order buttons */}
              <div className="sm:col-span-1 flex sm:flex-col items-center justify-center gap-1">
                <span className="font-mono text-xs font-semibold text-cafe-muted px-1.5">
                  #{index + 1}
                </span>
                <div className="flex sm:flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    className="p-1 text-cafe-muted hover:text-cafe-text disabled:opacity-30 rounded hover:bg-cafe-sand/50"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === ingredients.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    className="p-1 text-cafe-muted hover:text-cafe-text disabled:opacity-30 rounded hover:bg-cafe-sand/50"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Ingredient selector / Quick Add Input */}
              <div className="sm:col-span-4">
                {creatingRowIndex === index ? (
                  <div className="flex items-center gap-1 animate-in fade-in">
                    <input
                      type="text"
                      value={newIngredientName}
                      onChange={(e) => setNewIngredientName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleQuickCreate(index, newIngredientName);
                        }
                      }}
                      placeholder="ใส่ชื่อวัตถุดิบใหม่..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-copper text-xs text-cafe-text dark:text-cafe-cream focus:ring-1 focus:ring-cafe-copper focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      disabled={isSubmittingQuickAdd}
                      onClick={() => handleQuickCreate(index, newIngredientName)}
                      className="px-2 py-1.5 bg-cafe-copper text-white rounded-lg text-xs font-semibold hover:bg-cafe-copper-hover flex-shrink-0"
                    >
                      {isSubmittingQuickAdd ? '...' : 'เพิ่ม'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreatingRowIndex(null);
                        setNewIngredientName('');
                      }}
                      className="p-1.5 text-cafe-muted hover:text-cafe-text"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <select
                      value={item.ingredient_id}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setCreatingRowIndex(index);
                          setNewIngredientName('');
                        } else {
                          handleFieldChange(index, 'ingredient_id', e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:ring-1 focus:ring-cafe-copper focus:outline-none"
                    >
                      <option value="">-- เลือกวัตถุดิบ --</option>
                      <option
                        value="__NEW__"
                        className="font-semibold text-cafe-copper bg-amber-50 dark:bg-amber-950/40"
                      >
                        ➕ เพิ่มวัตถุดิบใหม่ (ใส่แค่ชื่อ)...
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
                      onClick={() => {
                        setCreatingRowIndex(index);
                        setNewIngredientName('');
                      }}
                      title="เพิ่มวัตถุดิบใหม่แบบเร็ว (ใส่แค่ชื่อ)"
                      className="p-2 text-cafe-copper hover:text-cafe-copper-hover bg-cafe-cream/80 dark:bg-cafe-darkCard rounded-lg border border-cafe-border/80 dark:border-cafe-darkBorder flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="sm:col-span-2">
                <input
                  type="number"
                  step="any"
                  value={item.quantity === 0 ? '' : item.quantity}
                  onChange={(e) =>
                    handleFieldChange(index, 'quantity', parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:ring-1 focus:ring-cafe-copper focus:outline-none font-mono"
                />
              </div>

              {/* Unit (Emphasizing oz) */}
              <div className="sm:col-span-2">
                <select
                  value={item.unit_id || ozUnit?.id || ''}
                  onChange={(e) => handleFieldChange(index, 'unit_id', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:ring-1 focus:ring-cafe-copper focus:outline-none font-mono font-medium"
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
                <input
                  type="text"
                  value={item.note || ''}
                  onChange={(e) => handleFieldChange(index, 'note', e.target.value)}
                  placeholder="เช่น หวาน 50%, ช็อตสกัด"
                  className="w-full px-3 py-2 rounded-lg bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:ring-1 focus:ring-cafe-copper focus:outline-none"
                />
              </div>

              {/* Delete button */}
              <div className="sm:col-span-1 text-right">
                <button
                  type="button"
                  onClick={() => handleRemoveRow(index)}
                  className="p-1.5 text-cafe-muted hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
