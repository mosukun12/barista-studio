import React from 'react';
import { Recipe, Category, DrinkType, RecipeStatus } from '../../types';
import { BatchRowItem } from './BatchTypes';
import { DRINK_TYPE_CONFIG, STATUS_CONFIG } from '../../lib/utils';
import {
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  ExternalLink,
  Sparkles,
  FileSpreadsheet,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { Button } from '../common/Button';

interface BatchRecipesTableProps {
  rows: BatchRowItem<Recipe>[];
  onChangeRow: (rowId: string, updates: Partial<Recipe>) => void;
  onDeleteRow: (rowId: string) => void;
  onDuplicateRow: (rowId: string) => void;
  onAddEmptyRows: (count: number) => void;
  categories: Category[];
  filterQuery: string;
  onOpenImport: () => void;
}

const GLASS_SIZES = ['8 oz', '12 oz', '16 oz', '20 oz', '22 oz', '24 oz'];

export const BatchRecipesTable: React.FC<BatchRecipesTableProps> = ({
  rows,
  onChangeRow,
  onDeleteRow,
  onDuplicateRow,
  onAddEmptyRows,
  categories,
  filterQuery,
  onOpenImport,
}) => {
  // Filter rows based on search
  const filteredRows = rows.filter((r) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      r.data.name_th?.toLowerCase().includes(q) ||
      r.data.name_en?.toLowerCase().includes(q) ||
      r.data.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Table toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => onAddEmptyRows(1)}
          >
            + เพิ่ม 1 แถว
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => onAddEmptyRows(5)}
          >
            + เพิ่ม 5 แถว
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<FileSpreadsheet className="w-3.5 h-3.5 text-cafe-copper" />}
            onClick={onOpenImport}
            className="text-cafe-copper dark:text-cafe-caramel hover:bg-cafe-copper/10"
          >
            วางข้อมูล Excel / CSV
          </Button>
        </div>

        <div className="text-xs text-cafe-muted flex items-center gap-2">
          <span>แสดง {filteredRows.length} จาก {rows.length} รายการ</span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="relative rounded-2xl border border-cafe-border dark:border-cafe-darkBorder bg-cafe-surface dark:bg-cafe-darkCard shadow-cafe-card overflow-hidden">
        <div className="overflow-x-auto max-h-[68vh] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[1300px]">
            <thead className="sticky top-0 z-20 bg-cafe-cream/90 dark:bg-cafe-darkSurface/90 backdrop-blur-md border-b border-cafe-border dark:border-cafe-darkBorder">
              <tr className="text-[11px] font-bold text-cafe-text dark:text-cafe-cream uppercase tracking-wider">
                <th className="py-3 px-3 w-16 text-center">สถานะ</th>
                <th className="py-3 px-3 w-56">ชื่อสูตรภาษาไทย *</th>
                <th className="py-3 px-3 w-48">ชื่อภาษาอังกฤษ</th>
                <th className="py-3 px-3 w-40">หมวดหมู่</th>
                <th className="py-3 px-3 w-36">ประเภทเครื่องดื่ม</th>
                <th className="py-3 px-3 w-28">ขนาดแก้ว</th>
                <th className="py-3 px-3 w-28">ความยาก</th>
                <th className="py-3 px-3 w-24">เวลา (วิ)</th>
                <th className="py-3 px-3 w-36">สถานะสูตร</th>
                <th className="py-3 px-3 w-44">แท็ก (คั่นด้วยจุลภาค)</th>
                <th className="py-3 px-3 w-24 text-center sticky right-0 bg-cafe-cream/90 dark:bg-cafe-darkSurface/90 backdrop-blur-md shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cafe-border/50 dark:divide-cafe-darkBorder/50">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-cafe-muted">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Sparkles className="w-8 h-8 text-cafe-muted/40" />
                      <p>ไม่พบรายการที่ตรงกับคำค้นหา หรือยังไม่มีข้อมูล</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Plus className="w-3.5 h-3.5" />}
                        onClick={() => onAddEmptyRows(1)}
                      >
                        เพิ่มสูตรใหม่แถวแรก
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const isDel = row._isDeleted;
                  const isNew = row._isNew;
                  const isMod = row._isModified && !isNew;

                  let rowBg = 'hover:bg-cafe-cream/30 dark:hover:bg-cafe-darkSurface/40';
                  if (isDel) {
                    rowBg = 'bg-rose-50/50 dark:bg-rose-950/20 opacity-60 line-through';
                  } else if (isNew) {
                    rowBg = 'bg-emerald-500/5 dark:bg-emerald-500/10 hover:bg-emerald-500/10';
                  } else if (isMod) {
                    rowBg = 'bg-amber-500/5 dark:bg-amber-500/10 hover:bg-amber-500/10';
                  }

                  return (
                    <tr
                      key={row._rowId}
                      className={`transition-colors text-cafe-text dark:text-cafe-cream ${rowBg}`}
                    >
                      {/* Status badge */}
                      <td className="py-2.5 px-3 text-center">
                        {isDel ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            รอการลบ
                          </span>
                        ) : isNew ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            ใหม่
                          </span>
                        ) : isMod ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            แก้ไข
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-cafe-muted">
                            {idx + 1}
                          </span>
                        )}
                      </td>

                      {/* Name TH */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          disabled={isDel}
                          value={row.data.name_th || ''}
                          onChange={(e) =>
                            onChangeRow(row._rowId, { name_th: e.target.value })
                          }
                          placeholder="ชื่อสูตร (ไทย)..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-cafe-border/80 dark:border-cafe-darkBorder bg-white dark:bg-cafe-darkSurface text-xs focus:outline-none focus:ring-1 focus:ring-cafe-copper"
                        />
                      </td>

                      {/* Name EN */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          disabled={isDel}
                          value={row.data.name_en || ''}
                          onChange={(e) =>
                            onChangeRow(row._rowId, { name_en: e.target.value })
                          }
                          placeholder="English name..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-cafe-border/80 dark:border-cafe-darkBorder bg-white dark:bg-cafe-darkSurface text-xs focus:outline-none focus:ring-1 focus:ring-cafe-copper"
                        />
                      </td>

                      {/* Category */}
                      <td className="py-2 px-3">
                        <select
                          disabled={isDel}
                          value={row.data.category_id || ''}
                          onChange={(e) =>
                            onChangeRow(row._rowId, {
                              category_id: e.target.value || null,
                            })
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-cafe-border/80 dark:border-cafe-darkBorder bg-white dark:bg-cafe-darkSurface text-xs focus:outline-none focus:ring-1 focus:ring-cafe-copper"
                        >
                          <option value="">-- ไม่ระบุ --</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Drink Type */}
                      <td className="py-2 px-3">
                        <select
                          disabled={isDel}
                          value={row.data.drink_type || 'iced'}
                          onChange={(e) =>
                            onChangeRow(row._rowId, {
                              drink_type: e.target.value as DrinkType,
                            })
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-cafe-border/80 dark:border-cafe-darkBorder bg-white dark:bg-cafe-darkSurface text-xs focus:outline-none focus:ring-1 focus:ring-cafe-copper"
                        >
                          {Object.entries(DRINK_TYPE_CONFIG).map(([key, item]) => (
                            <option key={key} value={key}>
                              {item.icon} {item.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Glass Size */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          list="glass-size-list"
                          disabled={isDel}
                          value={row.data.glass_size || ''}
                          onChange={(e) =>
                            onChangeRow(row._rowId, { glass_size: e.target.value })
                          }
                          placeholder="16 oz"
                          className="w-full px-2 py-1.5 rounded-lg border border-cafe-border/80 dark:border-cafe-darkBorder bg-white dark:bg-cafe-darkSurface text-xs focus:outline-none focus:ring-1 focus:ring-cafe-copper"
                        />
                        <datalist id="glass-size-list">
                          {GLASS_SIZES.map((sz) => (
                            <option key={sz} value={sz} />
                          ))}
                        </datalist>
                      </td>

                      {/* Difficulty */}
                      <td className="py-2 px-3">
                        <select
                          disabled={isDel}
                          value={row.data.difficulty || 'medium'}
                          onChange={(e) =>
                            onChangeRow(row._rowId, {
                              difficulty: e.target.value as any,
                            })
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-cafe-border/80 dark:border-cafe-darkBorder bg-white dark:bg-cafe-darkSurface text-xs focus:outline-none focus:ring-1 focus:ring-cafe-copper"
                        >
                          <option value="easy">ง่าย (Easy)</option>
                          <option value="medium">ปานกลาง (Medium)</option>
                          <option value="advanced">ขั้นสูง (Advanced)</option>
                        </select>
                      </td>

                      {/* Prep time (seconds) */}
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          disabled={isDel}
                          value={row.data.prep_time_seconds || 0}
                          onChange={(e) =>
                            onChangeRow(row._rowId, {
                              prep_time_seconds: Math.max(0, parseInt(e.target.value) || 0),
                            })
                          }
                          min={0}
                          step={10}
                          className="w-full px-2 py-1.5 rounded-lg border border-cafe-border/80 dark:border-cafe-darkBorder bg-white dark:bg-cafe-darkSurface text-xs focus:outline-none focus:ring-1 focus:ring-cafe-copper text-right font-mono"
                        />
                      </td>

                      {/* Recipe Status */}
                      <td className="py-2 px-3">
                        <select
                          disabled={isDel}
                          value={row.data.status || 'draft'}
                          onChange={(e) =>
                            onChangeRow(row._rowId, {
                              status: e.target.value as RecipeStatus,
                            })
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-cafe-border/80 dark:border-cafe-darkBorder bg-white dark:bg-cafe-darkSurface text-xs focus:outline-none focus:ring-1 focus:ring-cafe-copper"
                        >
                          {Object.entries(STATUS_CONFIG).map(([key, item]) => (
                            <option key={key} value={key}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Tags */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          disabled={isDel}
                          value={row.data.tags?.join(', ') || ''}
                          onChange={(e) =>
                            onChangeRow(row._rowId, {
                              tags: e.target.value
                                .split(',')
                                .map((t) => t.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="espresso, iced, milk..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-cafe-border/80 dark:border-cafe-darkBorder bg-white dark:bg-cafe-darkSurface text-xs focus:outline-none focus:ring-1 focus:ring-cafe-copper"
                        />
                      </td>

                      {/* Action buttons (Sticky right) */}
                      <td className="py-2 px-3 text-center sticky right-0 bg-cafe-surface/90 dark:bg-cafe-darkCard/90 backdrop-blur-md shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-center gap-1">
                          {!isDel && (
                            <button
                              type="button"
                              onClick={() => onDuplicateRow(row._rowId)}
                              title="คัดลอกแถวนี้ (Duplicate)"
                              className="p-1.5 rounded-lg text-cafe-muted hover:text-cafe-copper hover:bg-cafe-copper/10 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {!isNew && !isDel && row.data.id && (
                            <a
                              href={`/recipes/${row.data.id}/edit`}
                              target="_blank"
                              rel="noreferrer"
                              title="เปิดแก้ไขแบบละเอียด (Full Editor)"
                              className="p-1.5 rounded-lg text-cafe-muted hover:text-cafe-copper hover:bg-cafe-copper/10 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => onDeleteRow(row._rowId)}
                            title={isDel ? 'ยกเลิกการลบ (Restore)' : 'ลบแถวนี้ (Delete)'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDel
                                ? 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950/40'
                                : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            }`}
                          >
                            {isDel ? (
                              <RotateCcw className="w-3.5 h-3.5" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
