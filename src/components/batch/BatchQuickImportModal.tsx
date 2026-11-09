import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { BatchTabType } from './BatchTypes';
import { FileSpreadsheet, Check, AlertCircle, Copy, HelpCircle } from 'lucide-react';

interface BatchQuickImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: BatchTabType;
  onImport: (items: any[]) => void;
}

export const BatchQuickImportModal: React.FC<BatchQuickImportModalProps> = ({
  isOpen,
  onClose,
  type,
  onImport,
}) => {
  const [rawText, setRawText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const getPlaceholder = () => {
    switch (type) {
      case 'recipes':
        return `คัดลอกจาก Excel หรือพิมพ์ทีละบรรทัด (คั่นด้วย Tab หรือจุลภาค):
เอสเพรสโซ่เย็น\tIced Espresso\ticed\t16 oz\teasy\t90
ลาเต้ร้อน\tHot Latte\thot\t8 oz\teasy\t120
คาราเมลมัคคิอาโต้\tCaramel Macchiato\ticed\t16 oz\tmedium\t150`;
      case 'ingredients':
        return `คัดลอกจาก Excel หรือพิมพ์ทีละบรรทัด (คั่นด้วย Tab หรือจุลภาค):
นมสด Meiji Ray\tMeiji\tแช่เย็น 4°C
เมล็ดกาแฟ House Blend\tBarista Blend\tคั่วกลาง-เข้ม ครีม่าหนา
ไซรัปวานิลลา\tMonin\tเก็บที่อุณหภูมิห้อง`;
      case 'categories':
        return `คัดลอกจาก Excel หรือพิมพ์ทีละบรรทัด (คั่นด้วย Tab หรือจุลภาค):
Specialty Drinks\trecipe\tเมนูกาแฟพิเศษเมล็ด Single Origin
ไซรัป & ซอส\tingredient\tวัตถุดิบแต่งรสชาติ
เอสเพรสโซ่บาร์\trecipe\tกาแฟเบสเอสเพรสโซ่`;
    }
  };

  const handleParseAndImport = () => {
    setErrorMsg('');
    const trimmed = rawText.trim();
    if (!trimmed) {
      setErrorMsg('กรุณาวางหรือพิมพ์ข้อมูลก่อนนำเข้า');
      return;
    }

    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const parsed: any[] = [];

    for (const line of lines) {
      // Split by tab or comma (prefer tab if present)
      const delimiter = line.includes('\t') ? '\t' : line.includes(',') ? ',' : '|';
      const parts = line.split(delimiter).map((p) => p.trim());

      if (type === 'recipes') {
        const [name_th, name_en, drink_type, glass_size, difficulty, prep_time] = parts;
        if (!name_th) continue;
        parsed.push({
          name_th,
          name_en: name_en || null,
          drink_type: (drink_type || 'iced').toLowerCase(),
          glass_size: glass_size || '16 oz',
          difficulty: difficulty || 'medium',
          prep_time_seconds: Number(prep_time) || 120,
          status: 'draft',
          tags: [],
        });
      } else if (type === 'ingredients') {
        const [name, brand, notes] = parts;
        if (!name) continue;
        parsed.push({
          name,
          brand: brand || null,
          notes: notes || null,
          is_active: true,
        });
      } else if (type === 'categories') {
        const [name, category_type, description] = parts;
        if (!name) continue;
        parsed.push({
          name,
          category_type: category_type === 'ingredient' ? 'ingredient' : category_type === 'guide' ? 'guide' : 'recipe',
          description: description || null,
          sort_order: 10,
        });
      }
    }

    if (parsed.length === 0) {
      setErrorMsg('ไม่สามารถอ่านข้อมูลได้ กรุณาตรวจสอบรูปแบบข้อความ');
      return;
    }

    onImport(parsed);
    setRawText('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="นำเข้าข้อมูลแบบชุดอย่างรวดเร็ว (Quick Paste)"
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="p-3 bg-cafe-cream/60 dark:bg-cafe-darkSurface/60 rounded-xl border border-cafe-border/70 dark:border-cafe-darkBorder text-xs text-cafe-muted space-y-1">
          <div className="font-semibold text-cafe-text dark:text-cafe-cream flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-cafe-copper" />
            เคล็ดลับ: สามารถ Copy จาก Excel หรือ Google Sheets แล้วกด Paste ได้ทันที
          </div>
          <p>
            ระบบจะแปลงแต่ละแถวเป็นรายการใหม่ในตารางให้อัตโนมัติ (รองรับตัวคั่น Tab, จุลภาค หรือ Pipe)
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-cafe-text dark:text-cafe-cream mb-1.5">
            วางข้อมูลข้อความ (Text / Spreadsheet Data)
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={getPlaceholder()}
            rows={8}
            className="w-full px-3.5 py-2.5 rounded-xl border border-cafe-border dark:border-cafe-darkBorder bg-white dark:bg-cafe-darkSurface text-xs font-mono text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper/30 transition-all placeholder:text-cafe-muted/50"
          />
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl border border-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-cafe-border dark:border-cafe-darkBorder">
          <Button variant="secondary" size="md" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<Check className="w-4 h-4" />}
            onClick={handleParseAndImport}
          >
            นำเข้าลงตาราง
          </Button>
        </div>
      </div>
    </Modal>
  );
};
