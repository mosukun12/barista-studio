import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Wheat,
  Plus,
  Target,
  Sparkles,
  ArrowRight,
  Clock,
  Coffee,
  FlaskConical,
} from 'lucide-react';
import { Recipe, Ingredient } from '../types';
import { recipeService } from '../services/recipeService';
import { ingredientService } from '../services/ingredientService';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/Badge';
import { formatDate } from '../lib/utils';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setIsLoading(true);
        const [allRecipes, allIngredients] = await Promise.all([
          recipeService.getRecipes({ showArchived: false }),
          ingredientService.getIngredients(),
        ]);
        setRecipes(allRecipes);
        setIngredients(allIngredients);
      } catch (err) {
        console.error('Error loading dashboard overview:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadOverview();
  }, []);

  const totalRecipes = recipes.length;
  const verifiedCount = recipes.filter((r) => r.status === 'verified').length;
  const inProgressCount = recipes.filter((r) => ['draft', 'incomplete', 'testing'].includes(r.status)).length;
  const testingCount = recipes.filter((r) => r.status === 'testing').length;
  const totalIngredients = ingredients.length;

  const recentRecipes = [...recipes]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const testingRecipes = recipes.filter((r) => r.status === 'testing').slice(0, 4);

  return (
    <div className="space-y-8 pb-16">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#241C18] via-[#1C1613] to-[#14100E] border border-cafe-copper/30 dark:border-[#3A302A] text-cafe-cream p-6 sm:p-10">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cafe-copper/20 text-cafe-brass border border-cafe-copper/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personal Barista Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            ยินดีต้อนรับสู่ Barista Studio
          </h1>
          <p className="text-sm text-cafe-cream/80 leading-relaxed">
            ระบบจัดการสูตร เทคนิคบาริสต้า และคลังความรู้สำหรับมืออาชีพ ข้อมูลทั้งหมดเป็นของคุณอย่างแท้จริง ปลอดภัยและพร้อมสำหรับการฝึกฝน
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/recipes/new')}
            >
              สร้างสูตรใหม่
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<Target className="w-4 h-4 text-cafe-copper" />}
              onClick={() => navigate('/practice')}
            >
              เริ่มฝึกจำสูตร (Practice)
            </Button>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute right-[-40px] bottom-[-40px] opacity-5 pointer-events-none">
          <Coffee className="w-80 h-80 text-cafe-copper" />
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Recipes */}
        <div
          onClick={() => navigate('/recipes')}
          className="p-5 rounded-2xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder shadow-cafe-subtle hover:border-cafe-copper/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-cafe-muted mb-2">
            <span className="text-xs font-semibold">สูตรทั้งหมด</span>
            <BookOpen className="w-4 h-4 text-cafe-copper" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-cafe-text dark:text-cafe-cream">
            {totalRecipes}
          </div>
          <div className="text-[11px] text-cafe-muted mt-1">สูตรในคลังเครื่องดื่ม</div>
        </div>

        {/* Verified Recipes */}
        <div
          onClick={() => navigate('/recipes?status=verified')}
          className="p-5 rounded-2xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder shadow-cafe-subtle hover:border-emerald-500/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-cafe-muted mb-2">
            <span className="text-xs font-semibold">Verified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
            {verifiedCount}
          </div>
          <div className="text-[11px] text-cafe-muted mt-1">พร้อมนำไปใช้ในร้าน & ฝึกฝน</div>
        </div>

        {/* In Progress Recipes */}
        <div
          onClick={() => navigate('/recipes?status=testing')}
          className="p-5 rounded-2xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder shadow-cafe-subtle hover:border-amber-500/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-cafe-muted mb-2">
            <span className="text-xs font-semibold">Testing / Draft</span>
            <FlaskConical className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-700 dark:text-amber-400">
            {inProgressCount}
          </div>
          <div className="text-[11px] text-cafe-muted mt-1">{testingCount} สูตรกำลังปรับปรุง</div>
        </div>

        {/* Total Ingredients */}
        <div
          onClick={() => navigate('/ingredients')}
          className="p-5 rounded-2xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder shadow-cafe-subtle hover:border-cafe-copper/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-cafe-muted mb-2">
            <span className="text-xs font-semibold">วัตถุดิบทั้งหมด</span>
            <Wheat className="w-4 h-4 text-cafe-brass" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-cafe-text dark:text-cafe-cream">
            {totalIngredients}
          </div>
          <div className="text-[11px] text-cafe-muted mt-1">รายการในคลังวัตถุดิบ</div>
        </div>
      </div>

      {/* Main Grid: Recent Recipes & In Testing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Recipes */}
        <div className="lg:col-span-8 bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-5 sm:p-6 shadow-cafe-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cafe-border/60 dark:border-cafe-darkBorder">
            <h2 className="text-base font-bold text-cafe-text dark:text-cafe-cream flex items-center gap-2">
              <Clock className="w-4 h-4 text-cafe-copper" />
              สูตรที่อัปเดตล่าสุด (Recently Modified)
            </h2>
            <button
              onClick={() => navigate('/recipes')}
              className="text-xs font-semibold text-cafe-copper hover:underline flex items-center gap-1"
            >
              ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentRecipes.length === 0 ? (
            <div className="p-8 text-center text-cafe-muted text-sm">
              ยังไม่มีสูตรเครื่องดื่มในระบบ{' '}
              <button
                onClick={() => navigate('/recipes/new')}
                className="text-cafe-copper font-medium hover:underline"
              >
                คลิกที่นี่เพื่อสร้างสูตรแรก
              </button>
            </div>
          ) : (
            <div className="divide-y divide-cafe-border/60 dark:divide-cafe-darkBorder">
              {recentRecipes.map((r) => (
                <div
                  key={r.id}
                  onClick={() => navigate(`/recipes/${r.id}`)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-cafe-cream/40 dark:hover:bg-cafe-darkSurface/50 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cafe-cream dark:bg-cafe-darkSurface overflow-hidden flex items-center justify-center border border-cafe-border/60 dark:border-cafe-darkBorder flex-shrink-0">
                      {r.cover_image_url ? (
                        <img src={r.cover_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Coffee className="w-5 h-5 text-cafe-brass" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-cafe-text dark:text-cafe-cream">
                        {r.name_th}
                      </div>
                      <div className="text-xs text-cafe-muted font-mono">
                        {r.name_en || r.glass_size || 'สูตรมาตรฐาน'} • {r.ingredients?.length || 0} วัตถุดิบ
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <StatusBadge status={r.status} size="sm" />
                    <span className="text-xs text-cafe-muted font-mono hidden sm:inline-block">
                      {formatDate(r.updated_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Testing Workbench & Quick Links */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-5 sm:p-6 shadow-cafe-subtle space-y-3">
            <h3 className="text-sm font-bold text-cafe-text dark:text-cafe-cream uppercase tracking-wider text-cafe-muted">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="secondary"
                size="md"
                className="justify-start text-xs font-semibold"
                icon={<Plus className="w-4 h-4 text-cafe-copper" />}
                onClick={() => navigate('/recipes/new')}
              >
                เพิ่มสูตรเครื่องดื่มใหม่ (Add Recipe)
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="justify-start text-xs font-semibold"
                icon={<Wheat className="w-4 h-4 text-cafe-brass" />}
                onClick={() => navigate('/ingredients')}
              >
                จัดการคลังวัตถุดิบ (Manage Ingredients)
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="justify-start text-xs font-semibold"
                icon={<Target className="w-4 h-4 text-emerald-600" />}
                onClick={() => navigate('/practice')}
              >
                เริ่มทดสอบความจำสูตร (Start Quiz)
              </Button>
            </div>
          </div>

          {/* Recipes in Testing */}
          <div className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-5 sm:p-6 shadow-cafe-subtle space-y-3">
            <h3 className="text-sm font-bold text-cafe-text dark:text-cafe-cream flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-amber-600" />
                In Testing
              </span>
              <span className="text-xs font-mono text-cafe-muted">
                {testingRecipes.length} รายการ
              </span>
            </h3>

            {testingRecipes.length === 0 ? (
              <p className="text-xs text-cafe-muted py-2 leading-relaxed">
                ไม่มีสูตรที่อยู่ในสถานะ Testing คุณสามารถตั้งสถานะสูตรเป็น Testing เมื่อกำลังพัฒนาอัตราส่วนใหม่
              </p>
            ) : (
              <div className="space-y-2">
                {testingRecipes.map((tr) => (
                  <div
                    key={tr.id}
                    onClick={() => navigate(`/recipes/${tr.id}`)}
                    className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 hover:border-amber-400 cursor-pointer transition-colors"
                  >
                    <div className="font-semibold text-xs text-amber-900 dark:text-amber-300">
                      {tr.name_th}
                    </div>
                    <div className="text-[11px] text-cafe-muted font-mono mt-0.5">
                      {tr.name_en || tr.glass_size || '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
