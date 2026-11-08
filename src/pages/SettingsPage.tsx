import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Plus,
  Trash2,
  Scale,
  FolderTree,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { recipeService } from '../services/recipeService';
import { ingredientService } from '../services/ingredientService';
import { localStore } from '../services/localStore';
import { Category, MeasurementUnit } from '../types';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isSupabaseConnected } = useAuth();

  const [activeTab, setActiveTab] = useState<'general' | 'categories' | 'units' | 'backup'>('general');

  // Categories & Units state
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'recipe' | 'ingredient'>('recipe');

  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitSymbol, setNewUnitSymbol] = useState('');
  const [newUnitType, setNewUnitType] = useState<'volume' | 'weight' | 'count' | 'custom'>('custom');

  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const loadSettingsData = async () => {
    try {
      const [cats, uns] = await Promise.all([
        ingredientService.getCategories('all'),
        ingredientService.getUnits(),
      ]);
      setCategories(cats);
      setUnits(uns);
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  // Category Actions
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await ingredientService.createCategory({
        name: newCatName.trim(),
        category_type: newCatType,
        sort_order: categories.length + 1,
      });
      setNewCatName('');
      setIsAddingCategory(false);
      loadSettingsData();
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถเพิ่มหมวดหมู่ได้');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบหมวดหมู่ "${name}" หรือไม่?`)) return;
    try {
      await ingredientService.deleteCategory(id);
      loadSettingsData();
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถลบหมวดหมู่ได้');
    }
  };

  // Unit Actions
  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim() || !newUnitSymbol.trim()) return;
    try {
      await ingredientService.createUnit({
        name: newUnitName.trim(),
        symbol: newUnitSymbol.trim(),
        unit_type: newUnitType,
        is_convertible: false,
        sort_order: units.length + 1,
      });
      setNewUnitName('');
      setNewUnitSymbol('');
      setIsAddingUnit(false);
      loadSettingsData();
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถเพิ่มหน่วยวัดได้');
    }
  };

  const handleDeleteUnit = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบหน่วยวัด "${name}" หรือไม่?`)) return;
    try {
      await ingredientService.deleteUnit(id);
      loadSettingsData();
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถลบหน่วยวัดได้');
    }
  };

  // Export JSON Backup
  const handleExportAll = async () => {
    try {
      setIsExporting(true);
      const [recipes, ingredients, cats, uns] = await Promise.all([
        recipeService.getRecipes({ showArchived: true }),
        ingredientService.getIngredients(),
        ingredientService.getCategories('all'),
        ingredientService.getUnits(),
      ]);

      const backupData = {
        exported_at: new Date().toISOString(),
        version: '1.0',
        recipes,
        ingredients,
        categories: cats,
        units: uns,
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
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-cafe-text dark:text-cafe-cream flex items-center gap-2">
          <Settings className="w-6 h-6 text-cafe-copper" />
          การตั้งค่าและจัดการข้อมูล (Settings & Workspace)
        </h1>
        <p className="text-xs sm:text-sm text-cafe-muted mt-0.5">
          จัดการหมวดหมู่สูตร หน่วยวัดเฉพาะทาง สำรองข้อมูล และการเชื่อมต่อระบบ
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cafe-border dark:border-cafe-darkBorder gap-2 sm:gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
            activeTab === 'general'
              ? 'border-cafe-copper text-cafe-copper'
              : 'border-transparent text-cafe-muted hover:text-cafe-text'
          }`}
        >
          <Sliders className="w-4 h-4" /> ทั่วไป & ฐานข้อมูล
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
            activeTab === 'categories'
              ? 'border-cafe-copper text-cafe-copper'
              : 'border-transparent text-cafe-muted hover:text-cafe-text'
          }`}
        >
          <FolderTree className="w-4 h-4" /> จัดการหมวดหมู่ (Categories)
        </button>

        <button
          onClick={() => setActiveTab('units')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
            activeTab === 'units'
              ? 'border-cafe-copper text-cafe-copper'
              : 'border-transparent text-cafe-muted hover:text-cafe-text'
          }`}
        >
          <Scale className="w-4 h-4" /> หน่วยวัด (Units)
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
            activeTab === 'backup'
              ? 'border-cafe-copper text-cafe-copper'
              : 'border-transparent text-cafe-muted hover:text-cafe-text'
          }`}
        >
          <Download className="w-4 h-4" /> นำเข้า / ส่งออก (Backup)
        </button>
      </div>

      {/* Tab: General & Database */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Cloud Database Status */}
          <div className="p-6 rounded-2xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder space-y-4 shadow-cafe-subtle">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    isSupabaseConnected
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40'
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-950/40'
                  }`}
                >
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

              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isSupabaseConnected
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200'
                }`}
              >
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

          {/* Theme */}
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
      )}

      {/* Tab: Categories Management */}
      {activeTab === 'categories' && (
        <div className="space-y-4 bg-cafe-surface dark:bg-cafe-darkCard p-6 rounded-2xl border border-cafe-border dark:border-cafe-darkBorder shadow-cafe-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cafe-border dark:border-cafe-darkBorder">
            <div>
              <h2 className="font-bold text-base text-cafe-text dark:text-cafe-cream">
                จัดการหมวดหมู่สูตรและวัตถุดิบ (Categories)
              </h2>
              <p className="text-xs text-cafe-muted">
                คุณสามารถเพิ่ม แก้ไข หรือลบหมวดหมู่สูตรเครื่องดื่มและหมวดหมู่วัตถุดิบได้เอง
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/categories"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-cafe-cream dark:bg-cafe-darkSurface text-cafe-copper hover:bg-cafe-copper hover:text-white border border-cafe-copper/30 transition-colors shadow-xs"
              >
                <span>เปิดหน้าระบบเต็ม</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsAddingCategory(true)}
              >
                เพิ่มหมวดหมู่ใหม่
              </Button>
            </div>
          </div>

          {/* Form Add Inline */}
          {isAddingCategory && (
            <form onSubmit={handleAddCategory} className="p-4 rounded-xl bg-cafe-cream/70 dark:bg-cafe-darkSurface/70 border border-cafe-copper/40 space-y-3">
              <div className="text-xs font-bold text-cafe-copper">สร้างหมวดหมู่ใหม่</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="ชื่อหมวดหมู่ เช่น 'Cold Brew & Nitro', 'Specialty Tea'"
                  className="px-3 py-2 rounded-lg bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-1 focus:ring-cafe-copper"
                  autoFocus
                  required
                />
                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as any)}
                  className="px-3 py-2 rounded-lg bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-1 focus:ring-cafe-copper"
                >
                  <option value="recipe">หมวดหมู่สำหรับสูตร (Recipe)</option>
                  <option value="ingredient">หมวดหมู่สำหรับวัตถุดิบ (Ingredient)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingCategory(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  บันทึกหมวดหมู่
                </Button>
              </div>
            </form>
          )}

          {/* Categories List */}
          <div className="divide-y divide-cafe-border/60 dark:divide-cafe-darkBorder">
            {categories.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-cafe-text dark:text-cafe-cream">{c.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      c.category_type === 'ingredient'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                        : 'bg-cafe-copper/10 text-cafe-copper dark:bg-cafe-copper/20 dark:text-cafe-cream'
                    }`}
                  >
                    {c.category_type === 'ingredient' ? 'วัตถุดิบ (Ingredient)' : 'สูตร (Recipe)'}
                  </span>
                  <span className="text-xs text-cafe-muted font-mono">slug: {c.slug}</span>
                </div>
                <button
                  onClick={() => handleDeleteCategory(c.id, c.name)}
                  className="p-1.5 text-cafe-muted hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  title="ลบหมวดหมู่นี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Units Management */}
      {activeTab === 'units' && (
        <div className="space-y-4 bg-cafe-surface dark:bg-cafe-darkCard p-6 rounded-2xl border border-cafe-border dark:border-cafe-darkBorder shadow-cafe-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-cafe-border dark:border-cafe-darkBorder">
            <div>
              <h2 className="font-bold text-base text-cafe-text dark:text-cafe-cream">
                หน่วยวัดและปริมาตร (Measurement Units)
              </h2>
              <p className="text-xs text-cafe-muted">
                รองรับหน่วยมาตรฐาน (ml, oz, g) และหน่วยเฉพาะของร้าน เช่น ปั๊ม (pump), ช้อน (scoop), ช็อต (shot)
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddingUnit(true)}
            >
              เพิ่มหน่วยใหม่
            </Button>
          </div>

          {/* Form Add Unit Inline */}
          {isAddingUnit && (
            <form onSubmit={handleAddUnit} className="p-4 rounded-xl bg-cafe-cream/70 dark:bg-cafe-darkSurface/70 border border-cafe-copper/40 space-y-3">
              <div className="text-xs font-bold text-cafe-copper">สร้างหน่วยวัดใหม่</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder="ชื่อหน่วย เช่น 'ปั๊มไซรัป', 'ซอง'"
                  className="px-3 py-2 rounded-lg bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-1 focus:ring-cafe-copper"
                  autoFocus
                  required
                />
                <input
                  type="text"
                  value={newUnitSymbol}
                  onChange={(e) => setNewUnitSymbol(e.target.value)}
                  placeholder="สัญลักษณ์ย่อ เช่น 'pump', 'sachet'"
                  className="px-3 py-2 rounded-lg bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-1 focus:ring-cafe-copper font-mono"
                  required
                />
                <select
                  value={newUnitType}
                  onChange={(e) => setNewUnitType(e.target.value as any)}
                  className="px-3 py-2 rounded-lg bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-1 focus:ring-cafe-copper"
                >
                  <option value="custom">หน่วยนับเฉพาะของร้าน (Custom)</option>
                  <option value="volume">ปริมาตร (Volume)</option>
                  <option value="weight">น้ำหนัก (Weight)</option>
                  <option value="count">จำนวนนับ (Count)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingUnit(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  บันทึกหน่วยวัด
                </Button>
              </div>
            </form>
          )}

          {/* Units List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {units.map((u) => (
              <div
                key={u.id}
                className="p-3.5 rounded-xl border border-cafe-border dark:border-cafe-darkBorder bg-cafe-cream/40 dark:bg-cafe-darkSurface/40 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-cafe-text dark:text-cafe-cream">{u.name}</span>
                  <span className="font-mono text-cafe-copper ml-2">({u.symbol})</span>
                  <span className="block text-[10px] text-cafe-muted mt-0.5">ประเภท: {u.unit_type}</span>
                </div>
                {u.id.startsWith('u-') ? (
                  <span className="text-[10px] text-cafe-muted font-mono bg-white/60 dark:bg-black/30 px-2 py-0.5 rounded border border-cafe-border/50">
                    System Unit
                  </span>
                ) : (
                  <button
                    onClick={() => handleDeleteUnit(u.id, u.name)}
                    className="p-1.5 text-cafe-muted hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Backup & Restore */}
      {activeTab === 'backup' && (
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
                  สร้างไฟล์ JSON ที่บรรจุสูตร ส่วนผสม ขั้นตอน โน้ตบาริสต้า หมวดหมู่ และหน่วยวัดทั้งหมด
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
                <input type="file" accept=".json" className="hidden" onChange={handleImportFile} />
                <span className="inline-flex items-center justify-center font-medium rounded-lg text-xs px-3 py-2 bg-cafe-cream hover:bg-cafe-sand text-cafe-text border border-cafe-border dark:bg-cafe-darkCard dark:hover:bg-cafe-darkBorder dark:text-cafe-cream dark:border-cafe-darkBorder transition-all duration-150 gap-2">
                  <Upload className="w-4 h-4" />
                  เลือกไฟล์เพื่อนำเข้า (.json)
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
