import React from 'react';
import { Plus, Trash2, BookOpen, AlertCircle } from 'lucide-react';
import { RecipeNoteItem, NoteType } from '../../../types';
import { Button } from '../../common/Button';
import { NOTE_TYPE_CONFIG } from '../../../lib/utils';

interface NotesSectionProps {
  notes: RecipeNoteItem[];
  onChange: (items: RecipeNoteItem[]) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ notes, onChange }) => {
  const handleAddNote = (type: NoteType = 'tip') => {
    const newNote: RecipeNoteItem = {
      note_type: type,
      title: '',
      content: '',
      sort_order: notes.length + 1,
    };
    onChange([...notes, newNote]);
  };

  const handleRemoveNote = (index: number) => {
    const filtered = notes.filter((_, i) => i !== index);
    onChange(filtered);
  };

  const handleFieldChange = (index: number, field: keyof RecipeNoteItem, value: any) => {
    const clone = [...notes];
    clone[index] = {
      ...clone[index],
      [field]: value,
    };
    onChange(clone);
  };

  return (
    <section className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-5 sm:p-6 shadow-cafe-subtle space-y-4">
      {/* Sticky Section Header */}
      <div className="sticky top-[134px] sm:top-[140px] z-10 -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 p-4 sm:p-5 bg-cafe-surface/95 dark:bg-cafe-darkCard/95 backdrop-blur-md rounded-t-2xl border-b border-cafe-border/80 dark:border-cafe-darkBorder flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all">
        <div>
          <h2 className="text-base font-bold text-cafe-text dark:text-cafe-cream flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cafe-copper" />
            Section E: เทคนิคและโน้ตบาริสต้า (Techniques & Notes)
          </h2>
          <p className="text-xs text-cafe-muted mt-0.5">
            เคล็ดลับสำคัญ จุดผิดพลาดที่พบบ่อย การปรับรสตามลูกค้า และสิ่งที่ห้ามทำ
          </p>
        </div>

        {/* Quick add dropdown / button */}
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5 text-cafe-copper" />}
            onClick={() => handleAddNote('tip')}
          >
            เพิ่มเทคนิค (Tip)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddNote('taste_adjustment')}
          >
            การปรับรสชาติ
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddNote('common_mistake')}
          >
            จุดมักผิดพลาด
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-cafe-border dark:border-cafe-darkBorder rounded-xl bg-cafe-cream/30 dark:bg-cafe-darkSurface/30">
          <p className="text-sm text-cafe-muted mb-3">ยังไม่มีการบันทึกเทคนิคหรือโน้ตเพิ่มเติมสำหรับสูตรนี้</p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => handleAddNote('tip')}
          >
            เพิ่มบันทึกเทคนิคแรก
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note, index) => {
            const config = NOTE_TYPE_CONFIG[note.note_type] || NOTE_TYPE_CONFIG.tip;
            return (
              <div
                key={index}
                className={`p-4 rounded-2xl border transition-all ${config.bgClass} ${config.borderClass}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <select
                      value={note.note_type}
                      onChange={(e) =>
                        handleFieldChange(index, 'note_type', e.target.value as NoteType)
                      }
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/80 dark:bg-black/50 border border-current text-current focus:outline-none"
                    >
                      {Object.entries(NOTE_TYPE_CONFIG).map(([key, item]) => (
                        <option key={key} value={key} className="text-cafe-text bg-white dark:bg-cafe-darkCard">
                          {item.icon} {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveNote(index)}
                    className="self-end sm:self-auto p-1.5 text-cafe-muted hover:text-rose-600 rounded-lg hover:bg-white/50 dark:hover:bg-black/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={note.title || ''}
                    onChange={(e) => handleFieldChange(index, 'title', e.target.value)}
                    placeholder="หัวข้อโน้ต เช่น 'หากลูกค้าสั่งหวาน 50%', 'การปรับความละเอียดช่วงหน้าฝน'"
                    className="w-full px-3 py-1.5 rounded-lg bg-white/70 dark:bg-black/30 border border-cafe-border/60 dark:border-cafe-darkBorder text-xs font-medium text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-1 focus:ring-cafe-copper"
                  />
                  <textarea
                    rows={2}
                    value={note.content}
                    onChange={(e) => handleFieldChange(index, 'content', e.target.value)}
                    placeholder="รายละเอียดคำอธิบายอย่างละเอียด..."
                    className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-black/30 border border-cafe-border/60 dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-1 focus:ring-cafe-copper leading-relaxed"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
