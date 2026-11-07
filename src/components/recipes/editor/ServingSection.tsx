import React, { useState } from 'react';
import { Recipe, DrinkType } from '../../../types';
import { DRINK_TYPE_CONFIG } from '../../../lib/utils';
import { Edit2 } from 'lucide-react';

interface ServingSectionProps {
  recipe: Partial<Recipe>;
  onChange: (updates: Partial<Recipe>) => void;
}

const COMMON_GLASS_SIZES = ['6 oz', '8 oz', '10 oz', '12 oz', '16 oz', '20 oz', '22 oz', '24 oz'];
const COMMON_GLASS_TYPES = [
  'แก้วพลาสติก PET เย็น',
  'แก้วกระดาษร้อน',
  'แก้วเซรามิกทานที่ร้าน',
  'แก้วทรงสูง (Highball)',
  'แก้ว Rock Glass',
  'ขวด Cold Brew',
];
const COMMON_LID_TYPES = [
  'ฝาเรียบ (Flat Lid)',
  'ฝาโดม (Dome Lid)',
  'ฝายกดื่ม (Sip Lid)',
  'ไม่ใช้ฝา (Dine-in / ไม่รับฝา)',
];
const COMMON_STRAW_TYPES = [
  'หลอดไบโอ (Bio Straw)',
  'หลอดชานอ้อย',
  'หลอดสแตนเลส',
  'ช้อนคน / ช้อนตัก',
  'ไม่รับหลอด (No Straw)',
];

export const ServingSection: React.FC<ServingSectionProps> = ({ recipe, onChange }) => {
  const [customSize, setCustomSize] = useState(
    Boolean(recipe.glass_size && !COMMON_GLASS_SIZES.includes(recipe.glass_size))
  );
  const [customGlass, setCustomGlass] = useState(
    Boolean(recipe.glass_type && !COMMON_GLASS_TYPES.includes(recipe.glass_type))
  );
  const [customLid, setCustomLid] = useState(
    Boolean(recipe.lid_type && !COMMON_LID_TYPES.includes(recipe.lid_type))
  );
  const [customStraw, setCustomStraw] = useState(
    Boolean(recipe.straw_type && !COMMON_STRAW_TYPES.includes(recipe.straw_type))
  );

  return (
    <section className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-5 sm:p-6 shadow-cafe-subtle space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-cafe-border/60 dark:border-cafe-darkBorder">
        <div>
          <h2 className="text-base font-bold text-cafe-text dark:text-cafe-cream">
            Section B: ภาชนะและการจัดเสิร์ฟ (Serving & Container)
          </h2>
          <p className="text-xs text-cafe-muted">
            เลือกขนาดแก้ว ประเภทเครื่องดื่ม ชนิดภาชนะ ฝา หลอด ตามความต้องการของแต่ละสูตร (ไม่เลือกอัตโนมัติ)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Drink Type */}
        <div>
          <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
            ประเภทเครื่องดื่ม (Drink Type)
          </label>
          <select
            value={recipe.drink_type || ''}
            onChange={(e) =>
              onChange({ drink_type: (e.target.value as DrinkType) || null })
            }
            className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
          >
            <option value="">-- กรุณาเลือกประเภทเครื่องดื่ม --</option>
            {Object.entries(DRINK_TYPE_CONFIG).map(([key, item]) => (
              <option key={key} value={key}>
                {item.icon} {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Glass Size */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-cafe-text dark:text-stone-300">
              ขนาดแก้ว (Cup Size)
            </label>
            <button
              type="button"
              onClick={() => setCustomSize(!customSize)}
              className="text-[11px] text-cafe-copper hover:underline"
            >
              {customSize ? 'เลือกจากรายการ' : 'พิมพ์ระบุเอง'}
            </button>
          </div>

          {customSize ? (
            <input
              type="text"
              value={recipe.glass_size || ''}
              onChange={(e) => onChange({ glass_size: e.target.value })}
              placeholder="เช่น 16 oz, 8 oz Cup"
              className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none font-mono"
              autoFocus
            />
          ) : (
            <select
              value={recipe.glass_size || ''}
              onChange={(e) => {
                if (e.target.value === '__CUSTOM__') {
                  setCustomSize(true);
                } else {
                  onChange({ glass_size: e.target.value });
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none font-mono"
            >
              <option value="">-- เลือกขนาดแก้ว --</option>
              {COMMON_GLASS_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
              <option value="__CUSTOM__">✏️ กำหนดขนาดเอง...</option>
            </select>
          )}
        </div>

        {/* Glass / Cup Type */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-cafe-text dark:text-stone-300">
              ประเภทแก้ว / ภาชนะ (Cup Type)
            </label>
            <button
              type="button"
              onClick={() => setCustomGlass(!customGlass)}
              className="text-[11px] text-cafe-copper hover:underline"
            >
              {customGlass ? 'เลือกจากรายการ' : 'พิมพ์ระบุเอง'}
            </button>
          </div>

          {customGlass ? (
            <input
              type="text"
              value={recipe.glass_type || ''}
              onChange={(e) => onChange({ glass_type: e.target.value })}
              placeholder="เช่น แก้วเซรามิกเคลือบด้าน"
              className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
              autoFocus
            />
          ) : (
            <select
              value={recipe.glass_type || ''}
              onChange={(e) => {
                if (e.target.value === '__CUSTOM__') {
                  setCustomGlass(true);
                } else {
                  onChange({ glass_type: e.target.value });
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
            >
              <option value="">-- เลือกประเภทภาชนะ --</option>
              {COMMON_GLASS_TYPES.map((gt) => (
                <option key={gt} value={gt}>
                  {gt}
                </option>
              ))}
              <option value="__CUSTOM__">✏️ ระบุประเภทเอง...</option>
            </select>
          )}
        </div>

        {/* Lid Type */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-cafe-text dark:text-stone-300">
              ประเภทฝา (Lid Type)
            </label>
            <button
              type="button"
              onClick={() => setCustomLid(!customLid)}
              className="text-[11px] text-cafe-copper hover:underline"
            >
              {customLid ? 'เลือกจากรายการ' : 'พิมพ์ระบุเอง'}
            </button>
          </div>

          {customLid ? (
            <input
              type="text"
              value={recipe.lid_type || ''}
              onChange={(e) => onChange({ lid_type: e.target.value })}
              placeholder="เช่น ฝาโดมเจาะรู"
              className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
              autoFocus
            />
          ) : (
            <select
              value={recipe.lid_type || ''}
              onChange={(e) => {
                if (e.target.value === '__CUSTOM__') {
                  setCustomLid(true);
                } else {
                  onChange({ lid_type: e.target.value });
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
            >
              <option value="">-- เลือกประเภทฝา --</option>
              {COMMON_LID_TYPES.map((lt) => (
                <option key={lt} value={lt}>
                  {lt}
                </option>
              ))}
              <option value="__CUSTOM__">✏️ ระบุประเภทฝาเอง...</option>
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Straw Type */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-cafe-text dark:text-stone-300">
              ประเภทหลอด / ช้อน (Straw & Spoon)
            </label>
            <button
              type="button"
              onClick={() => setCustomStraw(!customStraw)}
              className="text-[11px] text-cafe-copper hover:underline"
            >
              {customStraw ? 'เลือกจากรายการ' : 'พิมพ์ระบุเอง'}
            </button>
          </div>

          {customStraw ? (
            <input
              type="text"
              value={recipe.straw_type || ''}
              onChange={(e) => onChange({ straw_type: e.target.value })}
              placeholder="เช่น หลอดแก้ว reusable"
              className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
              autoFocus
            />
          ) : (
            <select
              value={recipe.straw_type || ''}
              onChange={(e) => {
                if (e.target.value === '__CUSTOM__') {
                  setCustomStraw(true);
                } else {
                  onChange({ straw_type: e.target.value });
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
            >
              <option value="">-- เลือกประเภทหลอด/ช้อน --</option>
              {COMMON_STRAW_TYPES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
              <option value="__CUSTOM__">✏️ ระบุหลอด/ช้อนเอง...</option>
            </select>
          )}
        </div>

        {/* Serving notes */}
        <div>
          <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
            โน้ตการเสิร์ฟ (Serving Notes)
          </label>
          <input
            type="text"
            value={recipe.serving_notes || ''}
            onChange={(e) => onChange({ serving_notes: e.target.value })}
            placeholder="เช่น เสิร์ฟพร้อมน้ำเย็นล้างปาก, ตกแต่งด้วยใบโรสแมรี่"
            className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
          />
        </div>
      </div>
    </section>
  );
};
