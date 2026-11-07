import React, { useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  Database,
  Moon,
  Sun,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Key,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { recipeService } from '../services/recipeService';
import { ingredientService } from '../services/ingredientService';
import { localStore } from '../services/localStore';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isSupabaseConnected } = useAuth();

  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Export JSON Backup
  const handleExportAll = async () => {
    try {
      setIsExporting(true);
      const [recipes, ingredients, categories, units] = await Promise.all([
        recipeService.getRecipes({ showArchived: true }),
        ingredientService.getIngredients(),
        ingredientService.getCategories('recipe'),
        ingredientService.getUnits(),
      ]);

      const backupData = {
        exported_at: new Date().toISOString(),
        version: '1.0',
        recipes,
        ingredients,
        categories,
        units,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `barista_studio_backup_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      alert(`การส่งออกล้มเหลว: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Import JSON Backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const raw = event.target?.result as string;
        const parsed = JSON.parse(raw);

        if (!parsed.recipes || !Array.isArray(parsed.recipes)) {
          throw new Error('โครงสร้างไฟล์สำรองไม่ถูกต้อง ไม่พบรายการ recipes');
        }

        const confirmOverwrite = confirm(
          `พบสูตรเครื่องดื่มในไฟล์สำรอง ${parsed.recipes.length} รายการ และวัตถุดิบ ${parsed.ingredients?.length || 0} รายการ คุณต้องการนำเข้าข้อมูลหรือไม่?`
        );

        if (confirmOverwrite) {
          // Store in local store
          if (parsed.recipes) localStore.saveRecipes(parsed.recipes);
          if (parsed.ingredients) localStore.saveIngredients(parsed.ingredients);
          if (parsed.categories) localStore.saveCategories(parsed.categories);
          if (parsed.units) localStore.saveUnits(parsed.units);

          setImportMessage(`นำเข้าข้อมูลสำเร็จ: ${parsed.recipes.length} สูตร และ ${parsed.ingredients?.length || 0} วัตถุดิบ`);
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (err: any) {
        alert(`นำเข้าไฟล์ไม่สำเร็จ: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-cafe-text dark:text-cafe-cream flex items-center gap-2">
          <Settings className="w-6 h-6 text-cafe-copper" />
          การตั้งค่าและสำรองข้อมูล (Settings & Backup)
        </h1>
        <p className="text-xs sm:text-sm text-cafe-muted mt-0.5">
          จัดการสิทธิข้อมูลของคุณ การเชื่อมต่อ Supabase Database และการสำรองข้อมูล (JSON Backup)
        </p>
      </div>

      {/* Supabase Connection Status Card */}
      <div className="p-6 rounded-2xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder space-y-4 shadow-cafe-subtle">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isSupabaseConnected ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/40'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-cafe-text dark:text-cafe-cream">
                สถานะการเชื่อมต่อ Supabase Cloud Database
              </h2>
              <p className="text-xs text-cafe-muted">
                PostgreSQL Database พร้อมระบบ Row Level Security (RLS)
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isSupabaseConnected ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200'}`}>
            {isSupabaseConnected ? 'เชื่อมต่อแล้ว (Connected)' : 'Local Storage Mode'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-cafe-cream/60 dark:bg-cafe-darkSurface/60 border border-cafe-border/60 dark:border-cafe-darkBorder text-xs text-cafe-muted space-y-2">
          {isSupabaseConnected ? (
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              สูตรเครื่องดื่ม วัตถุดิบ และรูปภาพของคุณได้รับการจัดเก็บและสำรองบน Supabase Cloud แบบถาวร
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="font-semibold text-cafe-text dark:text-cafe-cream">
                วิธีเปิดใช้งาน Supabase Cloud Sync:
              </div>
              <ol className="list-decimal pl-4 space-y-1">
                <li>เปิดไฟล์ <code className="bg-white/80 dark:bg-black/40 px-1 py-0.5 rounded font-mono">.env</code> ในโฟลเดอร์โปรเจกต์</li>
                <li>ใส่ <code className="bg-white/80 dark:bg-black/40 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code> และ <code className="bg-white/80 dark:bg-black/40 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_ANON_KEY</code></li>
                <li>นำ Script ใน <code className="bg-white/80 dark:bg-black/40 px-1 py-0.5 rounded font-mono">supabase/migrations/001_initial_schema.sql</code> ไป Run ใน Supabase SQL Editor</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* Backup and Restore (JSON) */}
      <div className="p-6 rounded-2xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder space-y-5 shadow-cafe-subtle">
        <div>
          <h2 className="font-bold text-base text-cafe-text dark:text-cafe-cream">
            การนำเข้าและส่งออกข้อมูล (Data Ownership & Backup)
          </h2>
          <p className="text-xs text-cafe-muted">
            ดาวน์โหลดสำรองสูตรและวัตถุดิบทั้งหมดเก็บไว้ในเครื่องของคุณได้ตลอดเวลา หรือกู้คืนจากไฟล์ JSON
          </p>
        </div>

        {importMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl border border-emerald-200 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {importMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export button */}
          <div className="p-5 rounded-xl border border-cafe-border dark:border-cafe-darkBorder bg-cafe-cream/40 dark:bg-cafe-darkSurface/40 space-y-3 flex flex-col justify-between">
            <div>
              <div className="font-bold text-sm text-cafe-text dark:text-cafe-cream flex items-center gap-2">
                <Download className="w-4 h-4 text-cafe-copper" />
                ส่งออกข้อมูลทั้งหมด (Export Complete Backup)
              </div>
              <p className="text-xs text-cafe-muted mt-1 leading-relaxed">
                สร้างไฟล์ JSON ที่บรรจุสูตร ส่วนผสม ขั้นตอน โน้ตบาริสต้า และคลังวัตถุดิบทั้งหมด
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              isLoading={isExporting}
              onClick={handleExportAll}
            >
              ดาวน์โหลดไฟล์สำรอง (.json)
            </Button>
          </div>

          {/* Import file input */}
          <div className="p-5 rounded-xl border border-cafe-border dark:border-cafe-darkBorder bg-cafe-cream/40 dark:bg-cafe-darkSurface/40 space-y-3 flex flex-col justify-between">
            <div>
              <div className="font-bold text-sm text-cafe-text dark:text-cafe-cream flex items-center gap-2">
                <Upload className="w-4 h-4 text-cafe-brass" />
                นำเข้าข้อมูลจากไฟล์สำรอง (Import JSON Backup)
              </div>
              <p className="text-xs text-cafe-muted mt-1 leading-relaxed">
                กู้คืนข้อมูลจากไฟล์ JSON ที่เคยส่งออกไว้ พร้อมระบบตรวจสอบความถูกต้อง
              </p>
            </div>

            <label className="cursor-pointer inline-flex">
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
              <span className="inline-flex items-center justify-center font-medium rounded-lg text-xs px-3 py-2 bg-cafe-cream hover:bg-cafe-sand text-cafe-text border border-cafe-border dark:bg-cafe-darkCard dark:hover:bg-cafe-darkBorder dark:text-cafe-cream dark:border-cafe-darkBorder transition-all duration-150 gap-2">
                <Upload className="w-4 h-4" />
                เลือกไฟล์เพื่อนำเข้า (.json)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Theme and Preferences */}
      <div className="p-6 rounded-2xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder space-y-4 shadow-cafe-subtle">
        <div>
          <h2 className="font-bold text-base text-cafe-text dark:text-cafe-cream">
            การแสดงผลและธีม (Appearance)
          </h2>
          <p className="text-xs text-cafe-muted">
            สลับระหว่าง Warm Café Light Mode กับ Espresso Roast Dark Mode
          </p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-cafe-cream/50 dark:bg-cafe-darkSurface/50 border border-cafe-border/60 dark:border-cafe-darkBorder">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-amber-400" />
            ) : (
              <Sun className="w-5 h-5 text-cafe-copper" />
            )}
            <div>
              <div className="font-semibold text-sm text-cafe-text dark:text-cafe-cream">
                {theme === 'dark' ? 'Espresso Dark Theme' : 'Warm Café Light Theme'}
              </div>
              <div className="text-xs text-cafe-muted">
                {theme === 'dark' ? 'เหมาะสำหรับบาร์ที่แสงน้อยหรือช่วงกะค่ำ' : 'สว่าง โทนกระดาษและครีมละมุน'}
              </div>
            </div>
          </div>

          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            สลับธีม ({theme === 'dark' ? 'Light' : 'Dark'})
          </Button>
        </div>
      </div>
    </div>
  );
};
