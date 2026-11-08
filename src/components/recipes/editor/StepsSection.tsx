import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Clock, Wrench, Image as ImageIcon, Sparkles, X, Beaker, Check } from 'lucide-react';
import { RecipeStepItem, RecipeIngredientItem } from '../../../types';
import { Button } from '../../common/Button';
import { uploadImage } from '../../../services/storageService';

interface StepsSectionProps {
  steps: RecipeStepItem[];
  onChange: (items: RecipeStepItem[]) => void;
  availableIngredients?: RecipeIngredientItem[];
}

export const StepsSection: React.FC<StepsSectionProps> = ({ steps, onChange, availableIngredients = [] }) => {
  const handleAddStep = () => {
    const newStep: RecipeStepItem = {
      step_number: steps.length + 1,
      title: '',
      description: '',
      duration_seconds: 0,
      equipment: '',
      image_url: null,
      additional_note: '',
      ingredients: [],
    };
    onChange([...steps, newStep]);
  };

  const handleRemoveStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index).map((st, idx) => ({
      ...st,
      step_number: idx + 1,
    }));
    onChange(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const clone = [...steps];
    const [moved] = clone.splice(index, 1);
    clone.splice(targetIndex, 0, moved);

    const reindexed = clone.map((item, idx) => ({
      ...item,
      step_number: idx + 1,
    }));
    onChange(reindexed);
  };

  const handleFieldChange = (
    index: number,
    field: keyof RecipeStepItem,
    value: any
  ) => {
    const clone = [...steps];
    clone[index] = {
      ...clone[index],
      [field]: value,
    };
    onChange(clone);
  };

  const handleStepImageUpload = async (index: number, file: File) => {
    try {
      const url = await uploadImage(file, 'recipe-media');
      handleFieldChange(index, 'image_url', url);
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถอัปโหลดรูปภาพขั้นตอนได้');
    }
  };

  const toggleStepIngredient = (stepIndex: number, ingredientLabel: string) => {
    const clone = [...steps];
    const currentList = Array.isArray(clone[stepIndex].ingredients)
      ? clone[stepIndex].ingredients!
      : [];
    let updated: string[];
    if (currentList.includes(ingredientLabel)) {
      updated = currentList.filter((item) => item !== ingredientLabel);
    } else {
      updated = [...currentList, ingredientLabel];
    }
    clone[stepIndex] = {
      ...clone[stepIndex],
      ingredients: updated,
    };
    onChange(clone);
  };

  return (
    <section className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-5 sm:p-6 shadow-cafe-subtle space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cafe-border/60 dark:border-cafe-darkBorder">
        <div>
          <h2 className="text-base font-bold text-cafe-text dark:text-cafe-cream">
            Section D: ขั้นตอนการทำ (Preparation Steps)
          </h2>
          <p className="text-xs text-cafe-muted">
            ลำดับขั้นตอนการชง เวลาที่ใช้ อุปกรณ์ และรูปภาพประกอบแต่ละขั้น
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<Plus className="w-4 h-4 text-cafe-copper" />}
          onClick={handleAddStep}
        >
          เพิ่มขั้นตอน
        </Button>
      </div>

      {steps.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-cafe-border dark:border-cafe-darkBorder rounded-xl bg-cafe-cream/30 dark:bg-cafe-darkSurface/30">
          <p className="text-sm text-cafe-muted mb-3">ยังไม่มีขั้นตอนการชงในสูตรนี้</p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleAddStep}
          >
            กดเพื่อเพิ่มขั้นตอนที่ 1
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="p-4 rounded-2xl bg-cafe-cream/40 dark:bg-cafe-darkSurface/50 border border-cafe-border dark:border-cafe-darkBorder space-y-3"
            >
              {/* Top step control bar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-cafe-copper text-white font-bold text-xs flex items-center justify-center font-mono">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => handleFieldChange(index, 'title', e.target.value)}
                    placeholder={`หัวข้อขั้นตอน เช่น "สกัด Double Shot Espresso", "สตรีมนม"`}
                    className="flex-1 font-semibold text-sm px-3 py-1.5 rounded-lg bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border/80 dark:border-cafe-darkBorder text-cafe-text dark:text-cafe-cream focus:ring-1 focus:ring-cafe-copper focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    className="p-1.5 text-cafe-muted hover:text-cafe-text disabled:opacity-30 rounded hover:bg-cafe-sand/50"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === steps.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    className="p-1.5 text-cafe-muted hover:text-cafe-text disabled:opacity-30 rounded hover:bg-cafe-sand/50"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(index)}
                    className="p-1.5 text-cafe-muted hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Description textarea */}
              <div>
                <textarea
                  rows={2}
                  value={step.description || ''}
                  onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                  placeholder="รายละเอียดวิธีปฏิบัติ เช่น สกัดที่อุณหภูมิ 93°C บดละเอียดเบอร์ 1.8 ให้ได้น้ำกาแฟ 36g ภายใน 26-28 วินาที..."
                  className="w-full px-3 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border/80 dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:ring-1 focus:ring-cafe-copper focus:outline-none leading-relaxed"
                />
              </div>

              {/* Optional sub-fields: Duration, Equipment, Image */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Duration */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border/80 dark:border-cafe-darkBorder">
                  <Clock className="w-4 h-4 text-cafe-muted flex-shrink-0" />
                  <input
                    type="number"
                    value={step.duration_seconds === 0 ? '' : step.duration_seconds}
                    onChange={(e) =>
                      handleFieldChange(index, 'duration_seconds', parseInt(e.target.value) || 0)
                    }
                    placeholder="ระยะเวลา (วินาที)"
                    className="w-full bg-transparent text-xs text-cafe-text dark:text-cafe-cream focus:outline-none font-mono"
                  />
                  <span className="text-[11px] text-cafe-muted">วินาที</span>
                </div>

                {/* Equipment */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border/80 dark:border-cafe-darkBorder">
                  <Wrench className="w-4 h-4 text-cafe-muted flex-shrink-0" />
                  <input
                    type="text"
                    value={step.equipment || ''}
                    onChange={(e) => handleFieldChange(index, 'equipment', e.target.value)}
                    placeholder="อุปกรณ์ (เช่น พิชเชอร์ 350ml)"
                    className="w-full bg-transparent text-xs text-cafe-text dark:text-cafe-cream focus:outline-none"
                  />
                </div>

                {/* Image upload */}
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border/80 dark:border-cafe-darkBorder">
                  {step.image_url ? (
                    <div className="flex items-center justify-between w-full">
                      <a
                        href={step.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-cafe-copper hover:underline truncate max-w-[150px]"
                      >
                        ดูรูปภาพขั้นตอน
                      </a>
                      <button
                        type="button"
                        onClick={() => handleFieldChange(index, 'image_url', null)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-1.5 text-xs text-cafe-muted hover:text-cafe-text cursor-pointer w-full">
                      <ImageIcon className="w-4 h-4 text-cafe-muted" />
                      <span>แนบรูปภาพขั้นตอน</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleStepImageUpload(index, f);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Step Ingredients List (Selected from Section C) */}
              <div className="pt-2 border-t border-cafe-border/60 dark:border-cafe-darkBorder/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cafe-text dark:text-stone-300 flex items-center gap-1.5">
                    <Beaker className="w-3.5 h-3.5 text-cafe-copper" />
                    วัตถุดิบที่ใช้ในขั้นตอนนี้ (จาก Section C)
                  </span>
                  {(step.ingredients || []).length > 0 && (
                    <span className="text-[10px] text-cafe-copper font-medium">
                      เลือกแล้ว {(step.ingredients || []).length} รายการ
                    </span>
                  )}
                </div>

                {availableIngredients.length === 0 ? (
                  <p className="text-[11px] text-cafe-muted italic py-0.5">
                    ยังไม่มีรายการวัตถุดิบใน Section C (สามารถเพิ่มวัตถุดิบใน Section C ด้านบน แล้วจะปรากฏให้เลือกที่นี่)
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-cafe-muted">
                      แตะเพื่อเลือกหรือยกเลิกวัตถุดิบที่ใช้ในขั้นตอนนี้:
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {availableIngredients.map((ing, ingIdx) => {
                        const ingLabel = `${ing.ingredient_name || 'วัตถุดิบ'}${ing.quantity ? ` ${ing.quantity}` : ''}${ing.unit_symbol ? ` ${ing.unit_symbol}` : ''}`;
                        const isSelected = (step.ingredients || []).includes(ingLabel);

                        return (
                          <button
                            key={ing.id || `${ing.ingredient_id}-${ingIdx}`}
                            type="button"
                            onClick={() => toggleStepIngredient(index, ingLabel)}
                            className={`text-xs px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-cafe-copper/15 border-cafe-copper text-cafe-copper dark:text-cafe-cream font-medium shadow-xs ring-1 ring-cafe-copper/40'
                                : 'bg-cafe-surface dark:bg-cafe-darkCard border-cafe-border/80 dark:border-cafe-darkBorder text-cafe-muted hover:border-cafe-copper/50 hover:text-cafe-text'
                            }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] border ${
                                isSelected
                                  ? 'bg-cafe-copper text-white border-cafe-copper font-bold'
                                  : 'border-cafe-border dark:border-cafe-darkBorder bg-cafe-cream/50 dark:bg-cafe-darkSurface'
                              }`}
                            >
                              {isSelected && '✓'}
                            </span>
                            <span>{ingLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
