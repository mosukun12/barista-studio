import React, { useState } from 'react';
import { GitBranch, Plus, Trash2, Edit3, Check, X } from 'lucide-react';
import { RecipeVariantItem } from '../../../types';
import { Button } from '../../common/Button';

interface VariationsSectionProps {
  variants?: RecipeVariantItem[];
  onChange: (items: RecipeVariantItem[]) => void;
  recipeId?: string;
}

export const VariationsSection: React.FC<VariationsSectionProps> = ({
  variants = [],
  onChange,
  recipeId,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantDesc, setNewVariantDesc] = useState('');

  const handleAdd = () => {
    if (!newVariantName.trim()) return;
    const item: RecipeVariantItem = {
      parent_recipe_id: recipeId || 'temp',
      variant_name: newVariantName.trim(),
      description: newVariantDesc.trim() || null,
      diff_payload: {},
    };
    onChange([...variants, item]);
    setNewVariantName('');
    setNewVariantDesc('');
    setIsAdding(false);
  };

  const handleRemove = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  return (
    <section className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-5 sm:p-6 shadow-cafe-subtle space-y-4">
      {/* Sticky Section Header */}
      <div className="sticky top-[134px] sm:top-[140px] z-10 -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 p-4 sm:p-5 bg-cafe-surface/95 dark:bg-cafe-darkCard/95 backdrop-blur-md rounded-t-2xl border-b border-cafe-border/80 dark:border-cafe-darkBorder flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all">
        <div>
          <h2 className="text-base font-bold text-cafe-text dark:text-cafe-cream flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-cafe-copper" />
            Section F: สูตรย่อย / รูปแบบอื่น (Recipe Variations)
          </h2>
          <p className="text-xs text-cafe-muted mt-0.5">
            จัดการสูตรที่มีหลายเวอร์ชัน เช่น หวานน้อย 50%, เพิ่ม Extra Shot, หรือเปลี่ยนเป็นนมพืช
          </p>
        </div>

        {!isAdding && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Plus className="w-4 h-4 text-cafe-copper" />}
            onClick={() => setIsAdding(true)}
          >
            เพิ่มสูตรย่อย
          </Button>
        )}
      </div>

      {/* Add new variation inline form */}
      {isAdding && (
        <div className="p-4 rounded-xl bg-cafe-cream/60 dark:bg-cafe-darkSurface/60 border border-cafe-copper/30 space-y-3">
          <div className="text-xs font-bold text-cafe-copper">เพิ่มรูปแบบย่อยใหม่ (New Variation)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={newVariantName}
              onChange={(e) => setNewVariantName(e.target.value)}
              placeholder="ชื่อรูปแบบ เช่น 'หวานน้อย 50%', 'Oat Milk Sub'"
              className="px-3 py-2 rounded-lg bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-1 focus:ring-cafe-copper"
              autoFocus
            />
            <input
              type="text"
              value={newVariantDesc}
              onChange={(e) => setNewVariantDesc(e.target.value)}
              placeholder="คำอธิบาย เช่น 'ลดไซรัปลงเหลือ 0.5 oz, เพิ่มนมสด 10ml'"
              className="px-3 py-2 rounded-lg bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-1 focus:ring-cafe-copper"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Check className="w-3.5 h-3.5" />}
              onClick={handleAdd}
            >
              บันทึกรูปแบบ
            </Button>
          </div>
        </div>
      )}

      {variants.length === 0 ? (
        <p className="text-xs text-cafe-muted py-2 italic">
          ยังไม่มีการเพิ่มรูปแบบย่อย หากเครื่องดื่มนี้มีสูตรหวานปกติอย่างเดียว สามารถข้ามส่วนนี้ได้
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {variants.map((variant, index) => (
            <div
              key={index}
              className="p-3.5 rounded-xl bg-cafe-cream/40 dark:bg-cafe-darkSurface/40 border border-cafe-border/70 dark:border-cafe-darkBorder flex items-start justify-between gap-3"
            >
              <div>
                <div className="font-semibold text-xs text-cafe-text dark:text-cafe-cream flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cafe-copper" />
                  {variant.variant_name}
                </div>
                {variant.description && (
                  <p className="text-[11px] text-cafe-muted mt-1 leading-relaxed">
                    {variant.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-cafe-muted hover:text-rose-500 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
