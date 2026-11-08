import React, { useState } from 'react';
import { History, X, RotateCcw, Eye, Clock, CheckCircle2 } from 'lucide-react';
import { RecipeVersionItem } from '../../../types';
import { formatDate } from '../../../lib/utils';
import { Button } from '../../common/Button';
import { ConfirmDialog } from '../../common/ConfirmDialog';

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  versions: RecipeVersionItem[];
  onRestore: (versionNumber: number) => Promise<void>;
  isLoading?: boolean;
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  versions,
  onRestore,
  isLoading = false,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<RecipeVersionItem | null>(null);
  const [confirmRestoreVersion, setConfirmRestoreVersion] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-cafe-surface dark:bg-cafe-darkSurface border-l border-cafe-border dark:border-cafe-darkBorder shadow-xl dark:shadow-none flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cafe-border/70 dark:border-cafe-darkBorder">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cafe-copper" />
            <h3 className="font-bold text-base text-cafe-text dark:text-cafe-cream">
              ประวัติการแก้ไขสูตร (Version History)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-cafe-muted hover:text-cafe-text dark:hover:text-cafe-cream rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {versions.length === 0 ? (
            <div className="p-8 text-center text-cafe-muted text-sm">
              ยังไม่มีประวัติการแก้ไขสำหรับสูตรนี้
            </div>
          ) : (
            versions.map((ver) => (
              <div
                key={ver.id}
                className="p-4 rounded-xl border border-cafe-border dark:border-cafe-darkBorder bg-cafe-cream/40 dark:bg-cafe-darkCard/50 hover:border-cafe-copper/50 transition-colors space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-cafe-copper/10 text-cafe-copper border border-cafe-copper/30">
                    Version {ver.version_number}
                  </span>
                  <span className="text-[11px] text-cafe-muted font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(ver.created_at)}
                  </span>
                </div>

                <div>
                  <div className="text-xs font-semibold text-cafe-text dark:text-cafe-cream">
                    {ver.change_summary}
                  </div>
                  {ver.change_reason && (
                    <div className="text-[11px] text-cafe-muted italic mt-0.5">
                      เหตุผล: {ver.change_reason}
                    </div>
                  )}
                </div>

                {/* Snapshot summary */}
                <div className="text-[11px] text-cafe-muted bg-white/70 dark:bg-black/30 p-2.5 rounded-lg border border-cafe-border/50 dark:border-cafe-darkBorder font-mono space-y-1">
                  <div>
                    ส่วนผสม ({ver.snapshot.ingredients?.length || 0} รายการ):{' '}
                    <span className="text-cafe-text dark:text-stone-300">
                      {ver.snapshot.ingredients
                        ?.map((i) => `${i.ingredient_name || 'ส่วนผสม'} (${i.quantity} ${i.unit_symbol || ''})`)
                        .join(', ') || '-'}
                    </span>
                  </div>
                  <div>
                    ขั้นตอน: {ver.snapshot.steps?.length || 0} ขั้นตอน • โน้ต:{' '}
                    {ver.snapshot.notes?.length || 0} ข้อ
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={<RotateCcw className="w-3 h-3 text-amber-600" />}
                    onClick={() => setConfirmRestoreVersion(ver.version_number)}
                  >
                    กู้คืนเวอร์ชันนี้
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation before restore */}
      {confirmRestoreVersion !== null && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmRestoreVersion(null)}
          onConfirm={async () => {
            const v = confirmRestoreVersion;
            setConfirmRestoreVersion(null);
            await onRestore(v);
            onClose();
          }}
          title="ยืนยันการกู้คืนสูตร (Restore Version)"
          message={`ระบบจะนำข้อมูลจาก Version ${confirmRestoreVersion} มาสร้างเป็น Version ใหม่ล่าสุด โดยไม่ลบประวัติการแก้ไขก่อนหน้า`}
          confirmLabel="ยืนยันการกู้คืน"
          isLoading={isLoading}
        />
      )}
    </>
  );
};
