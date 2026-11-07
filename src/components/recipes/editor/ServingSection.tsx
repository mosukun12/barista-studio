import React from 'react';
import { Recipe, DrinkType } from '../../../types';
import { DRINK_TYPE_CONFIG } from '../../../lib/utils';
import { CupSoda, GlassWater, Sparkles } from 'lucide-react';

interface ServingSectionProps {
  recipe: Partial<Recipe>;
  onChange: (updates: Partial<Recipe>) => void;
}

const COMMON_GLASS_SIZES = ['6 oz', '8 oz', '10 oz', '12 oz', '16 oz', '20 oz', '22 oz', '24 oz'];
const COMMON_GLASS_TYPES = ['แก้วทรงสูง (Highball)', 'แก้ว Rock Glass', 'แก้วเซรามิกทานที่ร้าน', 'แก้วกระดาษร้อน', 'แก้วพลาสติก PET เย็น', 'ขวด Cold Brew'];
const COMMON_LID_TYPES = ['ฝาเรียบ (Flat Lid)', 'ฝาโดม (Dome Lid)', 'ฝายกดื่ม (Sip Lid)', 'ไม่ใช้ฝา (Dine-in)'];
const COMMON_STRAW_TYPES = ['หลอดไบโอ (Bio Straw)', 'หลอดสแตนเลส', 'หลอดชานอ้อย', 'ไม่รับหลอด (No Straw)'];

export const ServingSection: React.FC<ServingSectionProps> = ({ recipe, onChange }) => {
  return (
    <section className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-5 sm:p-6 shadow-cafe-subtle space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-cafe-border/60 dark:border-cafe-darkBorder">
        <div>
          <h2 className="text-base font-bold text-cafe-text dark:text-cafe-cream">
            Section B: ภาชนะและการจัดเสิร์ฟ (Serving & Container)
          </h2>
          <p className="text-xs text-cafe-muted">
            ขนาดแก้ว ประเภทเครื่องดื่ม ฝา หลอด และคำแนะนำในการจัดเสิร์ฟ
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
            value={recipe.drink_type || 'iced'}
            onChange={(e) => onChange({ drink_type: e.target.value as DrinkType })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
          >
            {Object.entries(DRINK_TYPE_CONFIG).map(([key, item]) => (
              <option key={key} value={key}>
                {item.icon} {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Glass Size (Customizable or selectable) */}
        <div>
          <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
            ขนาดแก้ว (Glass / Cup Size)
          </label>
          <input
            type="text"
            list="glass-sizes"
            value={recipe.glass_size || ''}
            onChange={(e) => onChange({ glass_size: e.target.value })}
            placeholder="เช่น 16 oz, 8 oz Cup"
            className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none font-mono"
          />
          <datalist id="glass-sizes">
            {COMMON_GLASS_SIZES.map((size) => (
              <option key={size} value={size} />
            ))}
          </datalist>
        </div>

        {/* Glass / Cup Type */}
        <div>
          <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
            ประเภทแก้ว / ภาชนะ (Cup Type)
          </label>
          <input
            type="text"
            list="glass-types"
            value={recipe.glass_type || ''}
            onChange={(e) => onChange({ glass_type: e.target.value })}
            placeholder="เช่น แก้วพลาสติก PET, เซรามิก"
            className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
          />
          <datalist id="glass-types">
            {COMMON_GLASS_TYPES.map((gt) => (
              <option key={gt} value={gt} />
            ))}
          </datalist>
        </div>

        {/* Lid Type */}
        <div>
          <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
            ประเภทฝา (Lid Type)
          </label>
          <input
            type="text"
            list="lid-types"
            value={recipe.lid_type || ''}
            onChange={(e) => onChange({ lid_type: e.target.value })}
            placeholder="เช่น ฝาเรียบ, ฝายกดื่ม"
            className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
          />
          <datalist id="lid-types">
            {COMMON_LID_TYPES.map((lt) => (
              <option key={lt} value={lt} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Straw Type */}
        <div>
          <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
            ประเภทหลอด / ช้อน (Straw & Spoon)
          </label>
          <input
            type="text"
            list="straw-types"
            value={recipe.straw_type || ''}
            onChange={(e) => onChange({ straw_type: e.target.value })}
            placeholder="เช่น หลอดกระดาษไบโอ, หลอดชานอ้อย"
            className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
          />
          <datalist id="straw-types">
            {COMMON_STRAW_TYPES.map((st) => (
              <option key={st} value={st} />
            ))}
          </datalist>
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
            placeholder="เช่น เสิร์ฟพร้อมน้ำเย็นล้างปาก, ตกแต่งด้วยโรสแมรี่"
            className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
          />
        </div>
      </div>
    </section>
  );
};
