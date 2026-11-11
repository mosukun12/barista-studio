import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Users } from 'lucide-react';
import { Recipe, Category, RecipeStatus, Team } from '../../../types';
import { STATUS_CONFIG } from '../../../lib/utils';
import { uploadImage } from '../../../services/storageService';
import { teamService } from '../../../services/teamService';

interface GeneralSectionProps {
  recipe: Partial<Recipe>;
  onChange: (updates: Partial<Recipe>) => void;
  categories: Category[];
}

export const GeneralSection: React.FC<GeneralSectionProps> = ({
  recipe,
  onChange,
  categories,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [tagInput, setTagInput] = React.useState('');
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamList = await teamService.getTeams();
        setTeams(teamList);
      } catch (err) {
        console.warn('Failed to load teams in GeneralSection:', err);
      }
    };
    fetchTeams();
  }, []);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadImage(file, 'recipe-media');
      onChange({ cover_image_url: url });
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const currentTags = recipe.tags || [];
      if (!currentTags.includes(tagInput.trim())) {
        onChange({ tags: [...currentTags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange({ tags: (recipe.tags || []).filter((t) => t !== tagToRemove) });
  };

  return (
    <section className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-5 sm:p-6 shadow-cafe-subtle space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-cafe-border/60 dark:border-cafe-darkBorder">
        <div>
          <h2 className="text-base font-bold text-cafe-text dark:text-cafe-cream">
            Section A: ข้อมูลทั่วไป (General Information)
          </h2>
          <p className="text-xs text-cafe-muted">
            ชื่อเครื่องดื่ม หมวดหมู่ สถานะสูตร และรูปภาพหน้าปก
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cover image upload column */}
        <div className="lg:col-span-1 space-y-2">
          <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300">
            รูปภาพเครื่องดื่ม (Recipe Image)
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`group relative w-full rounded-2xl border-2 border-dashed border-cafe-border dark:border-cafe-darkBorder hover:border-cafe-copper dark:hover:border-cafe-copper flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden bg-cafe-cream/40 dark:bg-cafe-darkSurface/50 transition-all ${
              recipe.cover_image_url
                ? 'p-2 min-h-[160px] max-h-[480px]'
                : 'h-52 p-4'
            }`}
          >
            {recipe.cover_image_url ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={recipe.cover_image_url}
                  alt="Cover"
                  className="w-full h-auto max-h-[460px] object-contain rounded-xl"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium rounded-xl backdrop-blur-[2px]">
                  คลิกเพื่อเปลี่ยนรูปภาพ
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-cafe-muted">
                {isUploading ? (
                  <span className="w-8 h-8 border-2 border-cafe-copper border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <>
                    <div className="w-10 h-10 mx-auto rounded-xl bg-cafe-cream dark:bg-cafe-darkCard flex items-center justify-center text-cafe-copper">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-medium text-cafe-text dark:text-cafe-cream">
                      คลิกเพื่ออัปโหลดรูปภาพ
                    </div>
                    <div className="text-[11px] text-cafe-muted">
                      รองรับ PNG, JPG, WebP (สูงสุด 5MB)
                    </div>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
              disabled={isUploading}
            />
          </div>

          {recipe.cover_image_url && (
            <button
              type="button"
              onClick={() => onChange({ cover_image_url: null })}
              className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 font-medium"
            >
              <X className="w-3.5 h-3.5" /> ลบรูปภาพออก
            </button>
          )}
        </div>

        {/* Text details column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Thai Name */}
            <div>
              <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
                ชื่อเครื่องดื่ม (ภาษาไทย) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={recipe.name_th || ''}
                onChange={(e) => onChange({ name_th: e.target.value })}
                placeholder="เช่น อเมริกาโน่เย็น, คาปูชิโน่ร้อน"
                className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
                required
              />
            </div>

            {/* English Name */}
            <div>
              <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
                ชื่อภาษาอังกฤษ (English Name)
              </label>
              <input
                type="text"
                value={recipe.name_en || ''}
                onChange={(e) => onChange({ name_en: e.target.value })}
                placeholder="e.g. Iced Americano, Flat White"
                className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
                หมวดหมู่สูตร (Category)
              </label>
              <select
                value={recipe.category_id || ''}
                onChange={(e) => onChange({ category_id: e.target.value || null })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipe Status */}
            <div>
              <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
                สถานะสูตร (Recipe Status) <span className="text-rose-500">*</span>
              </label>
              <select
                value={recipe.status || 'draft'}
                onChange={(e) => onChange({ status: e.target.value as RecipeStatus })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none font-medium"
              >
                <option value="draft">⚪ {STATUS_CONFIG.draft.label}</option>
                <option value="incomplete">🟠 {STATUS_CONFIG.incomplete.label}</option>
                <option value="testing">🟡 {STATUS_CONFIG.testing.label}</option>
                <option value="verified">🟢 {STATUS_CONFIG.verified.label}</option>
                <option value="archived">📦 {STATUS_CONFIG.archived.label}</option>
              </select>
            </div>
          </div>

          {/* Team Sharing */}
          <div className="p-3.5 rounded-xl bg-cafe-cream/40 dark:bg-cafe-darkSurface/60 border border-cafe-border/70 dark:border-cafe-darkBorder space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold text-cafe-text dark:text-stone-300">
                <Users className="w-4 h-4 text-cafe-copper" />
                การแชร์เข้าทีม (Team Sharing)
              </label>
              <span className="text-[11px] font-medium text-cafe-muted">
                {recipe.team_id ? '🟢 แชร์ในเวิร์กสเปซทีม' : '🔒 เฉพาะส่วนตัว'}
              </span>
            </div>
            <select
              value={recipe.team_id || ''}
              onChange={(e) => onChange({ team_id: e.target.value || null })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
            >
              <option value="">🔒 เฉพาะส่วนตัว (Private - ไม่แชร์เข้าทีม)</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  👥 ทีม: {t.name} ({t.members_count || 1} สมาชิก)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-cafe-muted">
              เมื่อเลือกแชร์เข้าทีม สมาชิกในทีมทุกคนจะสามารถเปิดดู ซ้อมชง และเข้าถึงสูตรนี้ได้
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
              คำอธิบายสูตรและจุดเด่น (Description & Cupping Notes)
            </label>
            <textarea
              rows={2}
              value={recipe.description || ''}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="กลิ่นอาย คาแรคเตอร์ รสสัมผัส หรือจุดเด่นของเมนูนี้..."
              className="w-full px-3.5 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
              แท็กคำค้นหา (Tags) — พิมพ์แล้วกด Enter
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder">
              {(recipe.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-cafe-cream dark:bg-cafe-darkCard text-cafe-text dark:text-cafe-cream border border-cafe-border/60 dark:border-cafe-darkBorder"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="เช่น #คั่วกลาง #นมโอ๊ต #ขายดี..."
                className="flex-1 min-w-[140px] bg-transparent text-xs text-cafe-text dark:text-cafe-cream placeholder:text-cafe-muted focus:outline-none px-1"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
