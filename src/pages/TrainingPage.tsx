import React, { useState } from 'react';
import { GraduationCap, Plus, Search, BookOpen, Clock, Tag } from 'lucide-react';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';

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

export const TrainingPage: React.FC = () => {
  const [guides, setGuides] = useState<GuideItem[]>([
    {
      id: 'g-dial-in',
      title: 'คู่มือการตั้งเบอร์บดและ Dial-in กาแฟประจำวัน (Daily Dial-in Guide)',
      category: 'Espresso Machine & Calibration',
      description: 'ขั้นตอนการปรับเบอร์บดกาแฟตามสภาพอากาศ ความชื้น และระยะเวลาการ Degas ของเมล็ด',
      content: `### 1. เป้าหมายของ Dial-in
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
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<GuideItem | null>(null);

  const filtered = guides.filter(
    (g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-cafe-text dark:text-cafe-cream">
            คู่มือและเทคนิคการทำงาน (Training Guide)
          </h1>
          <p className="text-xs sm:text-sm text-cafe-muted mt-0.5">
            คลังความรู้การใช้เครื่องชง การตั้งค่าเครื่องบด การสตรีมนม และมาตรฐานบริการของบาริสต้า
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            const title = prompt('ระบุชื่อบทความหรือคู่มือใหม่:');
            if (title?.trim()) {
              const newGuide: GuideItem = {
                id: crypto.randomUUID(),
                title: title.trim(),
                category: 'Standard Operation',
                description: 'บันทึกคู่มือปฏิบัติงาน',
                content: 'เขียนเนื้อหาคู่มือที่นี่...',
                tags: ['Manual'],
                readTimeMinutes: 2,
                updatedAt: new Date().toISOString().split('T')[0],
              };
              setGuides([newGuide, ...guides]);
              setSelectedGuide(newGuide);
            }
          }}
        >
          เขียนคู่มือใหม่
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cafe-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหาหัวข้อคู่มือ, เทคนิค, การบำรุงรักษาอุปกรณ์..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper"
        />
      </div>

      {selectedGuide ? (
        <div className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-6 sm:p-8 space-y-6 shadow-cafe-card">
          <div className="flex items-center justify-between pb-4 border-b border-cafe-border/70 dark:border-cafe-darkBorder">
            <button
              onClick={() => setSelectedGuide(null)}
              className="text-xs font-semibold text-cafe-copper hover:underline"
            >
              ← กลับไปรายการคู่มือ
            </button>
            <div className="flex items-center gap-2 text-xs text-cafe-muted font-mono">
              <Clock className="w-3.5 h-3.5" /> อ่านประมาณ {selectedGuide.readTimeMinutes} นาที
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-cafe-copper uppercase tracking-wider mb-1">
              {selectedGuide.category}
            </div>
            <h1 className="text-2xl font-bold text-cafe-text dark:text-cafe-cream">
              {selectedGuide.title}
            </h1>
            <p className="text-sm text-cafe-muted mt-2">
              {selectedGuide.description}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-cafe-cream/40 dark:bg-cafe-darkSurface/60 border border-cafe-border/60 dark:border-cafe-darkBorder text-sm leading-relaxed whitespace-pre-wrap font-sans text-cafe-text dark:text-stone-200">
            {selectedGuide.content}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                <h3 className="text-base font-bold text-cafe-text dark:text-cafe-cream mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-cafe-muted line-clamp-2 leading-relaxed">
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
    </div>
  );
};
