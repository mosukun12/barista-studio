import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RecipeStatus, DrinkType, NoteType } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 วินาที';
  if (seconds < 60) return `${seconds} วิ`;
  const mins = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  return remainingSecs > 0 ? `${mins} นาที ${remainingSecs} วิ` : `${mins} นาที`;
}

export const STATUS_CONFIG: Record<
  RecipeStatus,
  { label: string; labelEn: string; colorClass: string; bgClass: string; borderClass: string; dotClass: string }
> = {
  verified: {
    label: 'Verified',
    labelEn: 'Verified',
    colorClass: 'text-emerald-700 dark:text-emerald-300',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
  },
  testing: {
    label: 'Testing',
    labelEn: 'Testing',
    colorClass: 'text-amber-700 dark:text-amber-300',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200 dark:border-amber-800',
    dotClass: 'bg-amber-500',
  },
  incomplete: {
    label: 'Incomplete',
    labelEn: 'Incomplete',
    colorClass: 'text-orange-700 dark:text-orange-300',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    borderClass: 'border-orange-200 dark:border-orange-800',
    dotClass: 'bg-orange-500',
  },
  draft: {
    label: 'Draft',
    labelEn: 'Draft',
    colorClass: 'text-stone-600 dark:text-stone-400',
    bgClass: 'bg-stone-100 dark:bg-stone-800/50',
    borderClass: 'border-stone-200 dark:border-stone-700',
    dotClass: 'bg-stone-400',
  },
  archived: {
    label: 'Archived',
    labelEn: 'Archived',
    colorClass: 'text-neutral-500 dark:text-neutral-400',
    bgClass: 'bg-neutral-100 dark:bg-neutral-900',
    borderClass: 'border-neutral-200 dark:border-neutral-800',
    dotClass: 'bg-neutral-400',
  },
};

export const DRINK_TYPE_CONFIG: Record<DrinkType, { label: string; icon: string }> = {
  hot: { label: 'ร้อน (Hot)', icon: '♨️' },
  iced: { label: 'เย็น (Iced)', icon: '🧊' },
  blended: { label: 'ปั่น (Blended)', icon: '🌪️' },
  specialty: { label: 'Specialty / Signature', icon: '✨' },
  cold_brew: { label: 'Cold Brew / Slow Bar', icon: '⏳' },
  filter: { label: 'Filter / Drip', icon: '☕' },
};

export const NOTE_TYPE_CONFIG: Record<
  NoteType,
  { label: string; icon: string; bgClass: string; borderClass: string; textClass: string }
> = {
  tip: {
    label: 'เทคนิคพิเศษ (Tip)',
    icon: '💡',
    bgClass: 'bg-amber-50/60 dark:bg-amber-950/30',
    borderClass: 'border-amber-200 dark:border-amber-900/50',
    textClass: 'text-amber-800 dark:text-amber-300',
  },
  important: {
    label: 'ข้อควรระวังสำคัญ (Important)',
    icon: '⚠️',
    bgClass: 'bg-red-50/60 dark:bg-red-950/30',
    borderClass: 'border-red-200 dark:border-red-900/50',
    textClass: 'text-red-800 dark:text-red-300',
  },
  common_mistake: {
    label: 'จุดที่มักผิดพลาด (Common Mistake)',
    icon: '❌',
    bgClass: 'bg-rose-50/60 dark:bg-rose-950/30',
    borderClass: 'border-rose-200 dark:border-rose-900/50',
    textClass: 'text-rose-800 dark:text-rose-300',
  },
  troubleshooting: {
    label: 'การแก้ปัญหาเฉพาะหน้า (Troubleshooting)',
    icon: '🔧',
    bgClass: 'bg-blue-50/60 dark:bg-blue-950/30',
    borderClass: 'border-blue-200 dark:border-blue-900/50',
    textClass: 'text-blue-800 dark:text-blue-300',
  },
  taste_adjustment: {
    label: 'การปรับรสชาติ (Taste Adjustment)',
    icon: '👅',
    bgClass: 'bg-purple-50/60 dark:bg-purple-950/30',
    borderClass: 'border-purple-200 dark:border-purple-900/50',
    textClass: 'text-purple-800 dark:text-purple-300',
  },
  customer_request: {
    label: 'คำสั่งพิเศษของลูกค้า (Customer Request)',
    icon: '🗣️',
    bgClass: 'bg-emerald-50/60 dark:bg-emerald-950/30',
    borderClass: 'border-emerald-200 dark:border-emerald-900/50',
    textClass: 'text-emerald-800 dark:text-emerald-300',
  },
  avoid: {
    label: 'สิ่งที่ห้ามทำเด็ดขาด (Avoid)',
    icon: '🚫',
    bgClass: 'bg-red-100/60 dark:bg-red-950/50',
    borderClass: 'border-red-300 dark:border-red-800',
    textClass: 'text-red-900 dark:text-red-200',
  },
};
