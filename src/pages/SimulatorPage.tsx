import React, { useState, useEffect } from 'react';
import { Gamepad2, Coffee, Check, AlertCircle, Play, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Recipe } from '../types';
import { recipeService } from '../services/recipeService';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';

export const SimulatorPage: React.FC = () => {
  const [verifiedRecipes, setVerifiedRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulation state
  const [currentOrder, setCurrentOrder] = useState<Recipe | null>(null);
  const [selectedCup, setSelectedCup] = useState<string>('');
  const [selectedDrinkType, setSelectedDrinkType] = useState<string>('');
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await recipeService.getRecipes({ showArchived: false, status: 'verified' });
        setVerifiedRecipes(data);
      } catch (err) {
        console.error('Error fetching verified recipes:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleNextOrder = () => {
    if (verifiedRecipes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * verifiedRecipes.length);
    setCurrentOrder(verifiedRecipes[randomIndex]);
    setSelectedCup('');
    setSelectedDrinkType('');
    setIsEvaluated(false);
  };

  const handleServe = () => {
    if (!currentOrder) return;
    const cupCorrect = !currentOrder.glass_size || selectedCup === currentOrder.glass_size;
    const typeCorrect = !currentOrder.drink_type || selectedDrinkType === currentOrder.drink_type;

    setIsSuccess(cupCorrect && typeCorrect);
    setIsEvaluated(true);
  };

  if (isLoading) {
    return (
      <div className="p-20 text-center text-cafe-muted">
        <span className="w-8 h-8 border-2 border-cafe-copper border-t-transparent rounded-full animate-spin inline-block mb-2" />
        <div className="text-xs">กำลังเตรียมระบบจำลองสถานการณ์...</div>
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
          title="จำเป็นต้องมีสูตร Verified เพื่อเริ่มจำลองออร์เดอร์"
          description="ระบบจำลองสถานการณ์จะดึงออร์เดอร์ลูกค้าและเฉลยจากสูตรที่ผ่านการตรวจสอบแล้ว (Verified) ใน Recipe Book เท่านั้น"
          icon={<Coffee className="w-8 h-8 text-cafe-copper" />}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between pb-4 border-b border-cafe-border dark:border-cafe-darkBorder">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-cafe-text dark:text-cafe-cream flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-cafe-copper" />
            บาริสต้าจำลองสถานการณ์ (Barista Simulator)
          </h1>
          <p className="text-xs text-cafe-muted mt-0.5">
            สุ่มออร์เดอร์ลูกค้า และตรวจสอบการเลือกแก้ว สัดส่วน และขั้นตอน
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<RotateCcw className="w-4 h-4" />}
          onClick={handleNextOrder}
        >
          สุ่มออร์เดอร์ใหม่
        </Button>
      </div>

      {!currentOrder ? (
        <div className="p-8 rounded-3xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-center space-y-4 shadow-cafe-card">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-cafe-copper/10 text-cafe-copper flex items-center justify-center">
            <Coffee className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-cafe-text dark:text-cafe-cream">
            พร้อมรับออร์เดอร์ลูกค้าแล้วหรือยัง?
          </h2>
          <p className="text-xs text-cafe-muted max-w-sm mx-auto">
            กดปุ่มด้านล่างเพื่อสุ่มบิลออร์เดอร์จากคลังสูตรที่ยืนยันแล้ว
          </p>
          <Button variant="primary" size="md" icon={<Play className="w-4 h-4" />} onClick={handleNextOrder}>
            เริ่มรับออร์เดอร์
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Order Ticket */}
          <div className="p-6 rounded-2xl bg-cafe-cream dark:bg-cafe-darkSurface border-2 border-dashed border-cafe-copper/50 relative overflow-hidden font-mono shadow-cafe-subtle">
            <div className="text-xs uppercase tracking-wider text-cafe-muted mb-1">
              [ ORDER TICKET #CAFÉ-108 ]
            </div>
            <div className="text-xl font-bold text-cafe-text dark:text-cafe-cream">
              ลูกค้าสั่ง: "{currentOrder.name_th}" ({currentOrder.name_en || ''})
            </div>
            {currentOrder.glass_size && (
              <div className="text-xs text-cafe-copper font-semibold mt-1">
                ระบุขนาด: {currentOrder.glass_size}
              </div>
            )}
            {currentOrder.serving_notes && (
              <div className="text-xs text-cafe-muted mt-1 italic">
                หมายเหตุพิเศษ: {currentOrder.serving_notes}
              </div>
            )}
          </div>

          {/* Workbench Assembly */}
          <div className="p-6 rounded-3xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder space-y-5 shadow-cafe-card">
            <h3 className="font-bold text-sm text-cafe-text dark:text-cafe-cream">
              ขั้นตอนที่ 1: เลือกขนาดแก้วและประเภทเครื่องดื่ม
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-cafe-muted mb-1.5">
                  เลือกขนาดแก้ว (Cup Size)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['8 oz', '12 oz', '16 oz', '22 oz'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedCup(size)}
                      className={`py-2 px-3 rounded-xl border text-xs font-mono font-semibold transition-all ${
                        selectedCup === size
                          ? 'bg-cafe-copper text-white border-cafe-copper'
                          : 'bg-cafe-cream/60 dark:bg-cafe-darkSurface border-cafe-border dark:border-cafe-darkBorder text-cafe-text dark:text-cafe-cream'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cafe-muted mb-1.5">
                  เลือกประเภทเครื่องดื่ม
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['hot', 'iced', 'blended'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedDrinkType(type)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                        selectedDrinkType === type
                          ? 'bg-cafe-copper text-white border-cafe-copper'
                          : 'bg-cafe-cream/60 dark:bg-cafe-darkSurface border-cafe-border dark:border-cafe-darkBorder text-cafe-text dark:text-cafe-cream'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Serve Button */}
            {!isEvaluated ? (
              <div className="pt-2 flex justify-end">
                <Button variant="primary" size="md" onClick={handleServe}>
                  จัดเสิร์ฟเครื่องดื่ม (Serve Drink)
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-xl border space-y-3 mt-4 animate-in fade-in">
                {isSuccess ? (
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ยอดเยี่ยม! คุณจัดเสิร์ฟถูกต้องตามมาตรฐานของสูตรเป๊ะ
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                      สูตรที่ถูกต้อง: ขนาด {currentOrder.glass_size || 'ไม่ระบุ'}, ประเภท {currentOrder.drink_type || 'ไม่ระบุ'}
                    </div>
                    <div className="text-xs text-cafe-muted">
                      คุณเลือก: ขนาด {selectedCup || 'ยังไม่ได้เลือก'}, ประเภท {selectedDrinkType || 'ยังไม่ได้เลือก'}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <Button variant="secondary" size="sm" onClick={handleNextOrder}>
                    รับออร์เดอร์ถัดไป
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
