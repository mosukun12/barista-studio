import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Coffee,
  Check,
  AlertCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  Scale,
  Plus,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Recipe, Ingredient } from '../types';
import { recipeService } from '../services/recipeService';
import { ingredientService } from '../services/ingredientService';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';

interface AssembledIngredient {
  ingredientName: string;
  quantity: number;
  unit: string;
}

interface EvaluationResult {
  score: number;
  totalScore: number;
  cupMatch: boolean;
  typeMatch: boolean;
  ingredientFeedback: Array<{
    name: string;
    expected: string;
    actual: string;
    isCorrect: boolean;
    reason?: string;
  }>;
  missingIngredients: string[];
  extraIngredients: string[];
}

export const SimulatorPage: React.FC = () => {
  const [verifiedRecipes, setVerifiedRecipes] = useState<Recipe[]>([]);
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Simulation Session
  const [currentOrder, setCurrentOrder] = useState<Recipe | null>(null);
  const [selectedCupSize, setSelectedCupSize] = useState<string>('16 oz');
  const [selectedDrinkType, setSelectedDrinkType] = useState<string>('iced');

  // Assembly Bar state
  const [assembledItems, setAssembledItems] = useState<AssembledIngredient[]>([]);
  const [selectedIngName, setSelectedIngName] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState<number>(30);
  const [selectedUnit, setSelectedUnit] = useState<string>('ml');

  // Timer & Results
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isServing, setIsServing] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [recipes, ings] = await Promise.all([
          recipeService.getRecipes({ showArchived: false, status: 'verified' }),
          ingredientService.getIngredients(),
        ]);
        const validRecipes = recipes.filter((r) => r.ingredients && r.ingredients.length > 0);
        setVerifiedRecipes(validRecipes);
        setInventory(ings);
      } catch (err) {
        console.error('Error loading simulator data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Timer while active
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (currentOrder && !evaluation) {
      interval = setInterval(() => {
        setTimerSeconds((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentOrder, evaluation]);

  // Start new random order
  const handleStartOrder = () => {
    if (verifiedRecipes.length === 0) return;
    const randomIdx = Math.floor(Math.random() * verifiedRecipes.length);
    const order = verifiedRecipes[randomIdx];
    setCurrentOrder(order);
    setSelectedCupSize('16 oz');
    setSelectedDrinkType(order.drink_type || 'iced');
    setAssembledItems([]);
    setTimerSeconds(0);
    setEvaluation(null);

    // Set default ingredient dropdown
    if (order.ingredients && order.ingredients.length > 0) {
      setSelectedIngName(order.ingredients[0].ingredient_name || '');
      setSelectedUnit(order.ingredients[0].unit_symbol || 'ml');
    } else if (inventory.length > 0) {
      setSelectedIngName(inventory[0].name);
      setSelectedUnit('ml');
    }
  };

  // Add ingredient to shaker/cup
  const handleAddIngredient = () => {
    if (!selectedIngName.trim() || selectedQty <= 0) return;
    const existingIdx = assembledItems.findIndex((item) => item.ingredientName === selectedIngName);
    if (existingIdx !== -1) {
      const clone = [...assembledItems];
      clone[existingIdx].quantity += selectedQty;
      setAssembledItems(clone);
    } else {
      setAssembledItems([
        ...assembledItems,
        {
          ingredientName: selectedIngName,
          quantity: selectedQty,
          unit: selectedUnit,
        },
      ]);
    }
  };

  // Remove ingredient
  const handleRemoveItem = (index: number) => {
    setAssembledItems(assembledItems.filter((_, i) => i !== index));
  };

  // Evaluate order against Recipe Manager data
  const handleServeDrink = () => {
    if (!currentOrder) return;
    setIsServing(true);

    const expectedIngredients = currentOrder.ingredients || [];
    const cupMatch = !currentOrder.glass_size || selectedCupSize.toLowerCase() === currentOrder.glass_size.toLowerCase();
    const typeMatch = !currentOrder.drink_type || selectedDrinkType.toLowerCase() === currentOrder.drink_type.toLowerCase();

    let points = 0;
    const maxPoints = 100;
    const perItemWeight = expectedIngredients.length > 0 ? 70 / expectedIngredients.length : 70;

    if (cupMatch) points += 15;
    if (typeMatch) points += 15;

    const feedbackList: EvaluationResult['ingredientFeedback'] = [];
    const missing: string[] = [];

    expectedIngredients.forEach((exp) => {
      const actual = assembledItems.find(
        (a) => a.ingredientName.toLowerCase() === (exp.ingredient_name || '').toLowerCase()
      );

      if (!actual) {
        missing.push(exp.ingredient_name || 'ส่วนผสม');
        feedbackList.push({
          name: exp.ingredient_name || 'ส่วนผสม',
          expected: `${exp.quantity} ${exp.unit_symbol || ''}`,
          actual: 'ไม่ได้ใส่',
          isCorrect: false,
          reason: 'ลืมใส่ส่วนผสมนี้ตามสูตร',
        });
      } else {
        // Tolerance check: ±10%
        const diffRatio = Math.abs(actual.quantity - exp.quantity) / (exp.quantity || 1);
        const isQtyCorrect = diffRatio <= 0.15;
        if (isQtyCorrect) {
          points += perItemWeight;
          feedbackList.push({
            name: exp.ingredient_name || '',
            expected: `${exp.quantity} ${exp.unit_symbol || ''}`,
            actual: `${actual.quantity} ${actual.unit}`,
            isCorrect: true,
          });
        } else {
          points += perItemWeight * 0.4; // partial credit
          feedbackList.push({
            name: exp.ingredient_name || '',
            expected: `${exp.quantity} ${exp.unit_symbol || ''}`,
            actual: `${actual.quantity} ${actual.unit}`,
            isCorrect: false,
            reason: actual.quantity > exp.quantity ? 'ใส่ปริมาณมากเกินไป' : 'ใส่ปริมาณน้อยเกินไป',
          });
        }
      }
    });

    // Check extra items not in recipe
    const extras = assembledItems
      .filter(
        (a) => !expectedIngredients.some((exp) => (exp.ingredient_name || '').toLowerCase() === a.ingredientName.toLowerCase())
      )
      .map((a) => `${a.ingredientName} (${a.quantity} ${a.unit})`);

    if (extras.length > 0) {
      points = Math.max(0, points - extras.length * 10);
    }

    setEvaluation({
      score: Math.round(points),
      totalScore: maxPoints,
      cupMatch,
      typeMatch,
      ingredientFeedback: feedbackList,
      missingIngredients: missing,
      extraIngredients: extras,
    });

    setIsServing(false);
  };

  if (isLoading) {
    return (
      <div className="p-20 text-center text-cafe-muted">
        <span className="w-8 h-8 border-2 border-cafe-copper border-t-transparent rounded-full animate-spin inline-block mb-2" />
        <div className="text-xs">กำลังเตรียมระบบจำลองการชงกาแฟ...</div>
      </div>
    );
  }

  if (verifiedRecipes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-cafe-text dark:text-cafe-cream flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-cafe-copper" />
            บาริสต้าจำลองสถานการณ์ (Barista Simulator)
          </h1>
          <p className="text-xs sm:text-sm text-cafe-muted mt-0.5">
            รับออร์เดอร์และประกอบเครื่องดื่มเสมือนจริงตามสูตรที่บันทึกไว้
          </p>
        </div>

        <EmptyState
          title="จำเป็นต้องมีสูตรที่มีสถานะ Verified ในระบบ"
          description="ระบบจำลองสถานการณ์จะดึงออร์เดอร์และเฉลยจากสูตรที่ผ่านการตรวจสอบแล้ว (Verified) ใน Recipe Book เท่านั้น เพื่อความแม่นยำในการฝึกทำงานจริง"
          icon={<Coffee className="w-8 h-8 text-cafe-copper" />}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-cafe-border dark:border-cafe-darkBorder">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-cafe-text dark:text-cafe-cream flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-cafe-copper" />
            บาริสต้าจำลองสถานการณ์ (Barista Simulator Workbench)
          </h1>
          <p className="text-xs text-cafe-muted mt-0.5">
            ฝึกรับออร์เดอร์ ประกอบส่วนผสม ชั่งตวง และจัดเสิร์ฟเสมือนทำงานหน้าบาร์จริง
          </p>
        </div>

        {currentOrder && !evaluation && (
          <div className="flex items-center gap-2 text-xs font-mono font-semibold px-3 py-1.5 rounded-xl bg-cafe-cream dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder">
            <Clock className="w-4 h-4 text-cafe-copper" />
            เวลาที่ใช้: {timerSeconds} วินาที
          </div>
        )}
      </div>

      {!currentOrder ? (
        /* Intro Start Screen */
        <div className="p-10 rounded-3xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-center space-y-5 shadow-cafe-card">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-cafe-copper/10 text-cafe-copper flex items-center justify-center">
            <Coffee className="w-10 h-10" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold text-cafe-text dark:text-cafe-cream">
              สถานการณ์จำลองหน้าบาร์กาแฟ
            </h2>
            <p className="text-xs sm:text-sm text-cafe-muted leading-relaxed">
              ระบบจะสุ่มบิลออร์เดอร์จากคลังสูตรที่ยืนยันแล้ว ({verifiedRecipes.length} สูตร) คุณจะต้องเลือกขนาดแก้ว ชนิดเครื่องดื่ม และชั่งตวงส่วนผสมให้ตรงกับสูตรมาตรฐานของร้าน
            </p>
          </div>

          <div className="pt-2">
            <Button variant="primary" size="lg" icon={<Play className="w-5 h-5" />} onClick={handleStartOrder}>
              กดกริ่งรับออร์เดอร์แรก (Start Simulation)
            </Button>
          </div>
        </div>
      ) : (
        /* Active Simulation Workbench */
        <div className="space-y-6">
          {/* Order Ticket */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-50/80 via-cafe-cream to-amber-50/80 dark:from-cafe-darkSurface dark:to-cafe-darkCard border-2 border-dashed border-cafe-copper/50 relative overflow-hidden font-mono shadow-cafe-subtle">
            <div className="flex items-center justify-between text-xs text-cafe-muted uppercase tracking-wider mb-1">
              <span>[ ORDER TICKET #CAFÉ-{Math.floor(100 + Math.random() * 900)} ]</span>
              <button
                onClick={handleStartOrder}
                className="text-xs font-sans text-cafe-copper hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" /> สุ่มเมนูใหม่
              </button>
            </div>

            <div className="text-xl sm:text-2xl font-bold text-cafe-text dark:text-cafe-cream mt-1">
              ลูกค้าสั่ง: "{currentOrder.name_th}" ({currentOrder.name_en || ''})
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
              {currentOrder.glass_size && (
                <span className="px-2 py-0.5 rounded bg-cafe-copper/10 text-cafe-copper font-semibold">
                  ขนาด: {currentOrder.glass_size}
                </span>
              )}
              {currentOrder.drink_type && (
                <span className="px-2 py-0.5 rounded bg-cafe-brass/20 text-cafe-text dark:text-cafe-cream font-semibold capitalize">
                  ประเภท: {currentOrder.drink_type}
                </span>
              )}
              {currentOrder.serving_notes && (
                <span className="italic text-cafe-muted">
                  โน้ตพิเศษ: {currentOrder.serving_notes}
                </span>
              )}
            </div>
          </div>

          {!evaluation ? (
            /* Assembly Station */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Container & Barista Dispenser */}
              <div className="lg:col-span-7 space-y-6">
                {/* Stage 1: Container Selection */}
                <div className="p-5 rounded-2xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder space-y-3 shadow-cafe-subtle">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-cafe-muted">
                    ขั้นตอนที่ 1: เลือกภาชนะและประเภทเครื่องดื่ม
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
                        ขนาดแก้ว (Cup Size)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['8 oz', '12 oz', '16 oz', '20 oz', '22 oz'].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedCupSize(sz)}
                            className={`py-2 px-2.5 rounded-xl border text-xs font-mono font-semibold transition-all ${
                              selectedCupSize === sz
                                ? 'bg-cafe-copper text-white border-cafe-copper'
                                : 'bg-cafe-cream/60 dark:bg-cafe-darkSurface border-cafe-border dark:border-cafe-darkBorder text-cafe-text dark:text-cafe-cream'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
                        ประเภทเครื่องดื่ม (Drink Type)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['hot', 'iced', 'blended'].map((tp) => (
                          <button
                            key={tp}
                            type="button"
                            onClick={() => setSelectedDrinkType(tp)}
                            className={`py-2 px-2.5 rounded-xl border text-xs font-semibold capitalize transition-all ${
                              selectedDrinkType === tp
                                ? 'bg-cafe-copper text-white border-cafe-copper'
                                : 'bg-cafe-cream/60 dark:bg-cafe-darkSurface border-cafe-border dark:border-cafe-darkBorder text-cafe-text dark:text-cafe-cream'
                            }`}
                          >
                            {tp}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 2: Ingredient Dispenser Workbench */}
                <div className="p-5 rounded-2xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder space-y-4 shadow-cafe-subtle">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-cafe-muted flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-cafe-copper" />
                    ขั้นตอนที่ 2: ชั่งตวงและเติมส่วนผสมลงแก้ว
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Ingredient selector */}
                    <div className="sm:col-span-6">
                      <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1">
                        เลือกวัตถุดิบ
                      </label>
                      <select
                        value={selectedIngName}
                        onChange={(e) => setSelectedIngName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:ring-1 focus:ring-cafe-copper focus:outline-none"
                      >
                        <option value="">-- เลือกวัตถุดิบ --</option>
                        {/* Combine ingredients from current recipe and general inventory */}
                        {Array.from(
                          new Set([
                            ...(currentOrder.ingredients?.map((i) => i.ingredient_name || '') || []),
                            ...inventory.map((i) => i.name),
                            'Espresso',
                            'Fresh Milk',
                            'Syrup',
                            'Water',
                            'Ice',
                          ])
                        )
                          .filter(Boolean)
                          .map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1">
                        ปริมาณ
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={selectedQty}
                        onChange={(e) => setSelectedQty(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:ring-1 focus:ring-cafe-copper focus:outline-none font-mono"
                      />
                    </div>

                    {/* Unit */}
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1">
                        หน่วย
                      </label>
                      <select
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:ring-1 focus:ring-cafe-copper focus:outline-none font-mono"
                      >
                        <option value="ml">ml</option>
                        <option value="oz">oz</option>
                        <option value="g">g</option>
                        <option value="pump">pump</option>
                        <option value="shot">shot</option>
                        <option value="scoop">scoop</option>
                        <option value="tsp">tsp</option>
                        <option value="tbsp">tbsp</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={<Plus className="w-4 h-4 text-cafe-copper" />}
                      onClick={handleAddIngredient}
                    >
                      เทส่วนผสมลงแก้ว
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Column: Virtual Cup / Shaker View */}
              <div className="lg:col-span-5 space-y-5">
                <div className="p-5 rounded-2xl bg-cafe-cream/50 dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder flex flex-col justify-between h-full shadow-cafe-subtle">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-cafe-border/80 dark:border-cafe-darkBorder">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-cafe-text dark:text-cafe-cream flex items-center gap-1.5">
                        <Coffee className="w-4 h-4 text-cafe-copper" />
                        แก้วเครื่องดื่มที่กำลังชง
                      </h4>
                      <span className="font-mono text-xs text-cafe-muted">
                        {assembledItems.length} ส่วนผสม
                      </span>
                    </div>

                    <div className="text-xs text-cafe-muted font-mono">
                      ขนาดแก้ว: <span className="font-bold text-cafe-text dark:text-cafe-cream">{selectedCupSize}</span> | ประเภท: <span className="font-bold text-cafe-text dark:text-cafe-cream capitalize">{selectedDrinkType}</span>
                    </div>

                    {assembledItems.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-cafe-border dark:border-cafe-darkBorder rounded-xl text-cafe-muted text-xs">
                        แก้วยังว่างเปล่า เลือกส่วนผสมทางด้านซ้ายเพื่อเริ่มชง
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {assembledItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border/80 dark:border-cafe-darkBorder flex items-center justify-between text-xs"
                          >
                            <span className="font-medium text-cafe-text dark:text-cafe-cream">
                              {item.ingredientName}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-cafe-copper">
                                {item.quantity} {item.unit}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-cafe-muted hover:text-rose-600 p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-cafe-border/80 dark:border-cafe-darkBorder">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full"
                      disabled={assembledItems.length === 0}
                      onClick={handleServeDrink}
                    >
                      จัดเสิร์ฟและตรวจคำตอบ (Serve Order)
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Evaluation Results Screen */
            <div className="p-8 rounded-3xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder space-y-6 shadow-cafe-card animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cafe-border/70 dark:border-cafe-darkBorder">
                <div>
                  <span className="text-xs font-semibold text-cafe-copper uppercase tracking-wider block">
                    ผลการประเมินการชงเครื่องดื่ม
                  </span>
                  <h2 className="text-2xl font-bold text-cafe-text dark:text-cafe-cream">
                    เมนู: {currentOrder.name_th}
                  </h2>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-mono font-bold text-cafe-copper">
                    {evaluation.score} / {evaluation.totalScore}
                  </div>
                  <div className="text-[11px] text-cafe-muted">คะแนนความแม่นยำตามสูตร</div>
                </div>
              </div>

              {/* Checks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
                    evaluation.cupMatch
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200'
                  }`}
                >
                  {evaluation.cupMatch ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  ขนาดแก้ว: {selectedCupSize} (สูตรกำหนด: {currentOrder.glass_size || 'ไม่ระบุ'})
                </div>

                <div
                  className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
                    evaluation.typeMatch
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200'
                  }`}
                >
                  {evaluation.typeMatch ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  ประเภท: {selectedDrinkType} (สูตรกำหนด: {currentOrder.drink_type || 'ไม่ระบุ'})
                </div>
              </div>

              {/* Detailed Ingredient Feedback */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-cafe-muted">
                  การตรวจสอบสัดส่วนส่วนผสม:
                </h3>

                <div className="divide-y divide-cafe-border/60 dark:divide-cafe-darkBorder rounded-xl border border-cafe-border dark:border-cafe-darkBorder bg-cafe-cream/30 dark:bg-cafe-darkSurface/40 overflow-hidden text-xs">
                  {evaluation.ingredientFeedback.map((fb, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-cafe-text dark:text-cafe-cream flex items-center gap-1.5">
                          {fb.isCorrect ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                          )}
                          {fb.name}
                        </div>
                        {fb.reason && (
                          <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                            {fb.reason}
                          </div>
                        )}
                      </div>

                      <div className="text-right font-mono">
                        <div>
                          คุณใส่: <span className="font-bold text-cafe-text dark:text-cafe-cream">{fb.actual}</span>
                        </div>
                        <div className="text-[11px] text-cafe-muted">สูตรกำหนด: {fb.expected}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extra Items warning if any */}
              {evaluation.extraIngredients.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                  <span className="font-bold">ส่วนผสมที่ไม่มีในสูตร:</span> {evaluation.extraIngredients.join(', ')}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-cafe-border/70 dark:border-cafe-darkBorder">
                <Button variant="secondary" onClick={() => setEvaluation(null)}>
                  ปรับปรุงแก้วนี้ใหม่
                </Button>
                <Button variant="primary" icon={<RotateCcw className="w-4 h-4" />} onClick={handleStartOrder}>
                  รับออร์เดอร์ต่อไป
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
