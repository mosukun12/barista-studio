import React from 'react';
import { Link } from 'react-router-dom';
import { Search, LayoutGrid, List, SlidersHorizontal, Archive, FolderTree } from 'lucide-react';
import { RecipeFilterOptions, Category } from '../../types';
import { DRINK_TYPE_CONFIG, STATUS_CONFIG } from '../../lib/utils';

interface RecipeFilterBarProps {
  filters: RecipeFilterOptions;
  onFilterChange: (updates: Partial<RecipeFilterOptions>) => void;
  categories: Category[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  totalCount: number;
}

export const RecipeFilterBar: React.FC<RecipeFilterBarProps> = ({
  filters,
  onFilterChange,
  categories,
  viewMode,
  onViewModeChange,
  totalCount,
}) => {
  return (
    <div className="space-y-3.5 mb-6">
      {/* Top search & quick toggles */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cafe-muted" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="ค้นหาชื่อสูตร (ไทย / อังกฤษ), แท็ก, วัตถุดิบ..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream placeholder:text-cafe-muted focus:outline-none focus:ring-2 focus:ring-cafe-copper shadow-xs transition-colors"
          />
        </div>

        {/* View mode toggle & total badge */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-cafe-muted px-2 py-1 bg-cafe-cream dark:bg-cafe-darkCard rounded-lg border border-cafe-border/60 dark:border-cafe-darkBorder">
            {totalCount} รายการ
          </span>

          <div className="flex items-center p-1 bg-cafe-cream/80 dark:bg-cafe-darkCard rounded-xl border border-cafe-border dark:border-cafe-darkBorder">
            <button
              onClick={() => onViewModeChange('grid')}
              aria-label="Grid view"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-cafe-surface dark:bg-cafe-darkSurface text-cafe-copper shadow-xs'
                  : 'text-cafe-muted hover:text-cafe-text dark:hover:text-cafe-cream'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              aria-label="List view"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-cafe-surface dark:bg-cafe-darkSurface text-cafe-copper shadow-xs'
                  : 'text-cafe-muted hover:text-cafe-text dark:hover:text-cafe-cream'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter selectors row */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Category filter + quick manage button */}
        <div className="flex items-center gap-1.5">
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="text-xs py-2 px-3 rounded-xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper"
          >
            <option value="all">ทุกหมวดหมู่ (All Categories)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Link
            to="/categories"
            title="จัดการหมวดหมู่สูตรและวัตถุดิบ (Categories)"
            className="p-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-cafe-muted hover:text-cafe-copper hover:border-cafe-copper transition-colors"
          >
            <FolderTree className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Status filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ status: e.target.value })}
          className="text-xs py-2 px-3 rounded-xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper"
        >
          <option value="all">ทุกสถานะ (All Status)</option>
          <option value="verified">🟢 {STATUS_CONFIG.verified.label}</option>
          <option value="testing">🟡 {STATUS_CONFIG.testing.label}</option>
          <option value="incomplete">🟠 {STATUS_CONFIG.incomplete.label}</option>
          <option value="draft">⚪ {STATUS_CONFIG.draft.label}</option>
          <option value="archived">📦 {STATUS_CONFIG.archived.label}</option>
        </select>

        {/* Drink Type filter */}
        <select
          value={filters.drinkType}
          onChange={(e) => onFilterChange({ drinkType: e.target.value })}
          className="text-xs py-2 px-3 rounded-xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper"
        >
          <option value="all">ทุกประเภทเครื่องดื่ม</option>
          {Object.entries(DRINK_TYPE_CONFIG).map(([key, item]) => (
            <option key={key} value={key}>
              {item.icon} {item.label}
            </option>
          ))}
        </select>

        {/* Sort filter */}
        <select
          value={filters.sortBy}
          onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
          className="text-xs py-2 px-3 rounded-xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper"
        >
          <option value="updated_at">เรียงตาม: อัปเดตล่าสุด</option>
          <option value="created_at">เรียงตาม: วันที่สร้าง</option>
          <option value="name">เรียงตาม: ชื่อสูตร (ก-ฮ / A-Z)</option>
        </select>

        {/* Show archived toggle */}
        <label className="flex items-center gap-1.5 ml-auto text-xs text-cafe-muted cursor-pointer hover:text-cafe-text dark:hover:text-cafe-cream select-none">
          <input
            type="checkbox"
            checked={filters.showArchived}
            onChange={(e) => onFilterChange({ showArchived: e.target.checked })}
            className="rounded border-cafe-border text-cafe-copper focus:ring-cafe-copper"
          />
          <Archive className="w-3.5 h-3.5" />
          แสดงสูตรที่เก็บถาวร (Archived)
        </label>
      </div>
    </div>
  );
};
