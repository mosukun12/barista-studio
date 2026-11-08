import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  BookOpen,
  Clock,
  Edit3,
  Trash2,
  X,
  Check,
  Eye,
  FileEdit,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { MarkdownView } from '../components/common/MarkdownView';

interface GuideItem {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  tags: string[];
  readTimeMinutes: number;
  updatedAt: string;
}

const STORAGE_KEY = 'barista_studio_training_guides';

const DEFAULT_GUIDES: GuideItem[] = [
  {
    id: 'g-dial-in',
    title: 'คู่มือการตั้งเบอร์บดและ Dial-in กาแฟประจำวัน (Daily Dial-in Guide)',
    category: 'Espresso Calibration',
    description: 'ขั้นตอนการปรับเบอร์บดกาแฟตามสภาพอากาศ ความชื้น และระยะเวลาการ Degas ของเมล็ด',
    content: `### 1. เป้าหมายของ Dial-in กาแฟ
- Ratio: 1:2.0 (เช่น In 18.5g -> Out 37g)
- Target Time: 26 - 29 วินาที
- อุณหภูมิน้ำ: 93°C
- แรงดันสกัด: 9 Bar

### 2. ขั้นตอนการทำงาน
1. ล้างหัวชง (Flush) และทำความสะอาด Basket ด้วยผ้าแห้ง
2. ชั่งน้ำหนักกาแฟบดให้แม่นยำ ±0.1g
3. เกลี่ยผงกาแฟด้วย WDT หรือ Distributor เพื่อลด Channeling
4. แทมป์ระนาบตรงด้วยแรงสม่ำเสมอ
5. เริ่มจับเวลาทันทีที่ปั๊มทำงาน

### 3. การแก้ปัญหา
- **ไหลเร็วเกินไป (<24s):** รสชาติเปรี้ยวแหลม บอดี้บาง -> ปรับเบอร์บดให้ละเอียดขึ้น (Finer)
- **ไหลช้าเกินไป (>32s):** รสชาติขมไหม้ ฝาดคอ -> ปรับเบอร์บดให้หยาบขึ้น (Coarser)`,
    tags: ['Espresso', 'Calibration', 'Dial-in'],
    readTimeMinutes: 4,
    updatedAt: '2026-11-05',
  },
  {
    id: 'g-milk-steaming',
    title: 'เทคนิคการสตรีมนมและการสร้าง Microfoam สำหรับลาเต้อาร์ต',
    category: 'Milk & Latte Art',
    description: 'การควบคุมองศาของพิชเชอร์ การดึงอากาศช่วงแรก และการหมุนวนสร้างเนื้อโฟมเนียนเงา',
    content: `### เทคนิคสำคัญ 3 ขั้นตอน
1. **Air Incorporation (การดึงอากาศ):** วางก้านสตรีมใต้ผิวนมเล็กน้อย เปิดวาล์วเต็มที่ ให้เกิดเสียง "จิ๊ดๆ" สั้นๆ จนถึง 35°C
2. **Vortex & Texturing (การหมุนวน):** จุ่มปลายก้านลงเล็กน้อยเพื่อให้เกิดวังวนนมแตกฟองหยาบเป็น Microfoam เนื้อเนียนเงา
3. **Temperature Control:** ปิดวาล์วที่อุณหภูมิ 58°C - 62°C (ห้ามเกิน 65°C เพราะน้ำตาลแลคโตสจะสูญเสียความหวาน)`,
    tags: ['Milk', 'Steaming', 'LatteArt'],
    readTimeMinutes: 3,
    updatedAt: '2026-11-06',
  },
  {
    id: 'g-machine-cleaning',
    title: 'คู่มือการล้าง Backflush และการบำรุงรักษาเครื่องชงกาแฟก่อนปิดร้าน',
    category: 'Maintenance & Hygiene',
    description: 'การล้างคราบน้ำมันกาแฟออกจาก Shower Screen, Solenoid Valve และ Portafilter',
    content: `### ขั้นตอนการทำความสะอาดประจำวัน
1. ใส่ Blind Filter (ยางตัน) ลงใน Portafilter
2. ตักผงยาทำความสะอาด (เช่น Cafiza) ปริมาณ 3-5 กรัม
3. สวมก้านชงเข้ากับหัวชง แล้วกดชง 10 วินาที จากนั้นหยุด 10 วินาที (ทำซ้ำ 5 ครั้ง)
4. ถอดล้างด้วยน้ำร้อนสะอาดจนหมดคราบฟองน้ำยา
5. ถอด Shower Screen ออกมาแช่ด้วยน้ำอุ่นผสมผงยา 15 นาที
6. แช่ก้านสตรีมด้วยน้ำร้อนเพื่อสลายคราบนมตกค้าง`,
    tags: ['Cleaning', 'Backflush', 'Maintenance'],
    readTimeMinutes: 3,
    updatedAt: '2026-11-07',
  },
];

export const TrainingPage: React.FC = () => {
  const [guides, setGuides] = useState<GuideItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_GUIDES;
    } catch {
      return DEFAULT_GUIDES;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<GuideItem | null>(null);

  // Editor Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Partial<GuideItem> | null>(null);
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');

  // Deletion confirm
  const [deleteTarget, setDeleteTarget] = useState<GuideItem | null>(null);

  const saveGuidesList = (updated: GuideItem[]) => {
    setGuides(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleOpenNew = () => {
    setEditingGuide({
      title: '',
      category: 'Espresso Calibration',
      description: '',
      content: '',
      tags: [],
      readTimeMinutes: 3,
    });
    setEditorTab('write');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (guide: GuideItem) => {
    setEditingGuide(guide);
    setEditorTab('write');
    setIsEditorOpen(true);
  };

  const handleSaveGuide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuide?.title?.trim() || !editingGuide?.content?.trim()) {
      alert('กรุณากรอกชื่อเรื่องและเนื้อหาคู่มือ');
      return;
    }

    const now = new Date().toISOString().split('T')[0];
    if (editingGuide.id) {
      // Update existing
      const updated = guides.map((g) =>
        g.id === editingGuide.id
          ? ({ ...g, ...editingGuide, updatedAt: now } as GuideItem)
          : g
      );
      saveGuidesList(updated);
      if (selectedGuide?.id === editingGuide.id) {
        setSelectedGuide({ ...selectedGuide, ...editingGuide, updatedAt: now } as GuideItem);
      }
    } else {
      // Create new
      const newGuide: GuideItem = {
        id: crypto.randomUUID(),
        title: editingGuide.title.trim(),
        category: editingGuide.category?.trim() || 'General Knowledge',
        description: editingGuide.description?.trim() || '',
        content: editingGuide.content.trim(),
        tags: editingGuide.tags || ['Guide'],
        readTimeMinutes: Math.max(1, Math.ceil(editingGuide.content.length / 400)),
        updatedAt: now,
      };
      saveGuidesList([newGuide, ...guides]);
      setSelectedGuide(newGuide);
    }

    setIsEditorOpen(false);
    setEditingGuide(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const updated = guides.filter((g) => g.id !== deleteTarget.id);
    saveGuidesList(updated);
    if (selectedGuide?.id === deleteTarget.id) {
      setSelectedGuide(null);
    }
    setDeleteTarget(null);
  };

  const filtered = guides.filter(
    (g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-cafe-text dark:text-cafe-cream flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-cafe-copper" />
            คู่มือและเทคนิคการทำงาน (Training Guide)
          </h1>
          <p className="text-xs sm:text-sm text-cafe-muted mt-0.5">
            คลังความรู้การใช้เครื่องชง การตั้งค่าเครื่องบด การสตรีมนม และมาตรฐานบริการบาริสต้า
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenNew}
        >
          เขียนคู่มือใหม่
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cafe-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหาคู่มือ, การตั้งค่า, เทคนิคสตรีมนม, การล้างเครื่อง..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper"
        />
      </div>

      {/* Guide Detail View */}
      {selectedGuide ? (
        <div className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-6 sm:p-8 space-y-6 shadow-cafe-card">
          <div className="flex items-center justify-between pb-4 border-b border-cafe-border/70 dark:border-cafe-darkBorder">
            <button
              onClick={() => setSelectedGuide(null)}
              className="text-xs font-semibold text-cafe-copper hover:underline"
            >
              ← กลับไปรายการคู่มือ
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-cafe-muted font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cafe-copper" /> อ่านประมาณ {selectedGuide.readTimeMinutes} นาที
              </span>
              <Button
                variant="outline"
                size="sm"
                icon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => handleOpenEdit(selectedGuide)}
              >
                แก้ไขคู่มือ
              </Button>
              <button
                onClick={() => setDeleteTarget(selectedGuide)}
                className="p-1.5 text-cafe-muted hover:text-rose-600 rounded-lg hover:bg-rose-50"
                title="ลบคู่มือ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-cafe-copper uppercase tracking-wider block mb-1">
              {selectedGuide.category}
            </span>
            <h1 className="text-2xl font-bold text-cafe-text dark:text-cafe-cream">
              {selectedGuide.title}
            </h1>
            {selectedGuide.description && (
              <p className="text-sm text-cafe-muted mt-2 leading-relaxed">
                {selectedGuide.description}
              </p>
            )}
          </div>

          {/* Formatted Guide Content */}
          <div className="p-6 sm:p-8 rounded-2xl bg-cafe-cream/40 dark:bg-cafe-darkSurface/60 border border-cafe-border/60 dark:border-cafe-darkBorder">
            <MarkdownView content={selectedGuide.content} />
          </div>
        </div>
      ) : (
        /* Guide Grid List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedGuide(item)}
              className="p-6 rounded-2xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder hover:border-cafe-copper/50 shadow-cafe-subtle hover:shadow-cafe-card transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-cafe-copper uppercase tracking-wider block mb-2">
                  {item.category}
                </span>
                <h3 className="text-base font-bold text-cafe-text dark:text-cafe-cream mb-2 leading-snug line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs text-cafe-muted line-clamp-3 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-cafe-border/60 dark:border-cafe-darkBorder flex items-center justify-between text-[11px] text-cafe-muted">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cafe-copper" /> {item.readTimeMinutes} นาที
                </span>
                <span className="font-mono">{item.updatedAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && editingGuide && (
        <Modal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          title={editingGuide.id ? 'แก้ไขบทความคู่มือบาริสต้า' : 'เขียนบทความ / คู่มือบาริสต้าใหม่'}
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveGuide} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1">
                ชื่อบทความ / คู่มือ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editingGuide.title || ''}
                onChange={(e) => setEditingGuide({ ...editingGuide, title: e.target.value })}
                placeholder="เช่น การ Calibrate เครื่องบดช่วงเช้า, วิธีทำความสะอาดก้านชง"
                className="w-full px-3.5 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1">
                  หมวดหมู่คู่มือ
                </label>
                <input
                  type="text"
                  list="guide-categories"
                  value={editingGuide.category || ''}
                  onChange={(e) => setEditingGuide({ ...editingGuide, category: e.target.value })}
                  placeholder="เช่น Espresso Calibration, Milk & Latte Art"
                  className="w-full px-3.5 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
                />
                <datalist id="guide-categories">
                  <option value="Espresso Calibration" />
                  <option value="Milk & Latte Art" />
                  <option value="Filter & Slow Bar" />
                  <option value="Maintenance & Hygiene" />
                  <option value="Customer Service" />
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1">
                  คำอธิบายสรุปสั้นๆ (Description)
                </label>
                <input
                  type="text"
                  value={editingGuide.description || ''}
                  onChange={(e) => setEditingGuide({ ...editingGuide, description: e.target.value })}
                  placeholder="สรุปเนื้อหาสำคัญ 1-2 ประโยค"
                  className="w-full px-3.5 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
                />
              </div>
            </div>

            {/* Tabs Write / Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300">
                  เนื้อหาคู่มือ (Markdown Formatted) <span className="text-rose-500">*</span>
                </label>
                <div className="flex p-0.5 bg-cafe-cream dark:bg-cafe-darkSurface rounded-lg border border-cafe-border dark:border-cafe-darkBorder text-xs">
                  <button
                    type="button"
                    onClick={() => setEditorTab('write')}
                    className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                      editorTab === 'write' ? 'bg-cafe-surface dark:bg-cafe-darkCard text-cafe-copper font-semibold' : 'text-cafe-muted'
                    }`}
                  >
                    <FileEdit className="w-3.5 h-3.5" /> เขียน
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab('preview')}
                    className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                      editorTab === 'preview' ? 'bg-cafe-surface dark:bg-cafe-darkCard text-cafe-copper font-semibold' : 'text-cafe-muted'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> แสดงตัวอย่าง
                  </button>
                </div>
              </div>

              {editorTab === 'write' ? (
                <textarea
                  rows={8}
                  value={editingGuide.content || ''}
                  onChange={(e) => setEditingGuide({ ...editingGuide, content: e.target.value })}
                  placeholder="ใช้ Markdown เช่น ### หัวข้อย่อย, - รายการข้อ, **ตัวหนา** เพื่อจัดระเบียบข้อมูล..."
                  className="w-full p-3 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-xs font-mono text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none leading-relaxed"
                  required
                />
              ) : (
                <div className="p-4 rounded-xl bg-cafe-cream/40 dark:bg-cafe-darkSurface/60 border border-cafe-border dark:border-cafe-darkBorder min-h-[190px]">
                  {editingGuide.content ? (
                    <MarkdownView content={editingGuide.content} />
                  ) : (
                    <span className="text-xs text-cafe-muted italic">(ยังไม่มีข้อความ)</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-cafe-border/70 dark:border-cafe-darkBorder">
              <Button type="button" variant="secondary" size="md" onClick={() => setIsEditorOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" variant="primary" size="md">
                บันทึกบทความคู่มือ
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title="ยืนยันการลบคู่มือ"
          message={`คุณต้องการลบคู่มือ "${deleteTarget.title}" หรือไม่?`}
          confirmLabel="ลบคู่มือถาวร"
          isDestructive={true}
        />
      )}
    </div>
  );
};
