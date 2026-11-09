import React from 'react';
import { Ingredient, Category, MeasurementUnit } from '../../types';
import { BatchRowItem } from './BatchTypes';
import {
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '../common/Button';

interface BatchIngredientsTableProps {
  rows: BatchRowItem<Ingredient>[];
  onChangeRow: (rowId: string, updates: Partial<Ingredient>) => void;
  onDeleteRow: (rowId: string) => void;
  onDuplicateRow: (rowId: string) => void;
  onAddEmptyRows: (count: number) => void;
  categories: Category[];
  units: MeasurementUnit[];
  filterQuery: string;
  onOpenImport: () => void;
}

export const BatchIngredientsTable: React.FC<BatchIngredientsTableProps> = ({
  rows,
  onChangeRow,
  onDeleteRow,
  onDuplicateRow,
  onAddEmptyRows,
  categories,
  units,
  filterQuery,
  onOpenImport,
}) => {
  const filteredRows = rows.filter((r) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      r.data.name?.toLowerCase().includes(q) ||
      r.data.brand?.toLowerCase().includes(q) ||
      r.data.notes?.toLowerCase().includes(q)
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
          <table className="w-full text-left border-collapse text-xs min-w-[1000px]">
            <thead className="sticky top-0 z-20 bg-cafe-cream/90 dark:bg-cafe-darkSurface/90 backdrop-blur-md border-b border-cafe-border dark:border-cafe-darkBorder">
              <tr className="text-[11px] font-bold text-cafe-text dark:text-cafe-cream uppercase tracking-wider">
                <th className="py-3 px-3 w-16 text-center">สถานะ</th>
                <th className="py-3 px-3 w-56">ชื่อวัตถุดิบ *</th>
                <th className="py-3 px-3 w-40">แบรนด์ / ยี่ห้อ</th>
                <th className="py-3 px-3 w-40">หมวดหมู่วัตถุดิบ</th>
                <th className="py-3 px-3 w-36">หน่วยวัดเริ่มต้น</th>
                <th className="py-3 px-3">คำอธิบาย / โน้ตบาริสต้า</th>
                <th className="py-3 px-3 w-28 text-center">เปิดใช้งาน</th>
                <th className="py-3 px-3 w-24 text-center sticky right-0 bg-cafe-cream/90 dark:bg-cafe-darkSurface/90 backdrop-blur-md shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cafe-border/50 dark:divide-cafe-darkBorder/50">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-cafe-muted">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Sparkles className="w-8 h-8 text-cafe-muted/40" />
                      <p>ไม่พบรายการที่ตรงกับคำค้นหา หรือยังไม่มีข้อมูล</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Plus className="w-3.5 h-3.5" />}
                        onClick={() => onAddEmptyRows(1)}
                      >
                        เพิ่มวัตถุดิบใหม่แถวแรก
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

                      {/* Name */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          disabled={isDel}
                          value={row.data.name || ''}
                          onChange={(e) =>
                            onChangeRow(row._rowId, { name: e.target.value })
                          }
                          placeholder="ชื่อวัตถุดิบ (เช่น นมสด)..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-cafe-border/80 dark:border-cafe-darkBorder bg-white dark:bg-cafe-darkSurface text-xs focus:outline-none focus:ring-1 focus:ring-cafe-copper"
                        />
                      </td>

                      {/* Brand */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          disabled={isDel}
                          value={row.data.brand || ''}
                          onChange={(e) =>
                            onChangeRow(row._rowId, { brand: e.target.value })
                          }
                          placeholder="แบรนด์ / ยี่ห้อ..."
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

                      {/* Default Unit */}
                      <td className="py-2 px-3">
                        <select
                          disabled={isDel}
                          value={row.data.default_unit_id || ''}
                          onChange={(e) =>
                            onChangeRow(row._rowId, {
                              default_unit_id: e.target.value || null,
                            })
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-cafe-border/80 dark:border-cafe-darkBorder bg-white dark:bg-cafe-darkSurface text-xs focus:outline-none focus:ring-1 focus:ring-cafe-copper"
                        >
                          <option value="">-- ไม่ระบุ --</option>
                          {units.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.symbol})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Notes / Description */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          disabled={isDel}
                          value={row.data.notes || ''}
                          onChange={(e) =>
                            onChangeRow(row._rowId, { notes: e.target.value })
                          }
                          placeholder="เช่น เก็บในอุณหภูมิ 2-4°C, สตรีมได้ฟองนุ่ม..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-cafe-border/80 dark:border-cafe-darkBorder bg-white dark:bg-cafe-darkSurface text-xs focus:outline-none focus:ring-1 focus:ring-cafe-copper"
                        />
                      </td>

                      {/* Is Active */}
                      <td className="py-2 px-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={isDel}
                            checked={row.data.is_active !== false}
                            onChange={(e) =>
                              onChangeRow(row._rowId, { is_active: e.target.checked })
                            }
                            className="w-4 h-4 rounded text-cafe-copper focus:ring-cafe-copper border-cafe-border dark:border-cafe-darkBorder cursor-pointer"
                          />
                        </label>
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
