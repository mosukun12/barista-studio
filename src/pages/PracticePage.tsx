import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Award,
  Coffee,
  ArrowRight,
  ShieldCheck,
  ListOrdered,
  Brain,
  History,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Recipe, RecipeStepItem } from '../types';
import { recipeService } from '../services/recipeService';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';

interface PracticeHistoryRecord {
  id: string;
  mode: 'ingredient' | 'step_ordering' | 'recipe_recall';
  recipeName: string;
  score: number;
  total: number;
  timeSpentSeconds: number;
  date: string;
}

const HISTORY_STORAGE_KEY = 'barista_studio_practice_history';

export const PracticePage: React.FC = () => {
  const navigate = useNavigate();

  const [verifiedRecipes, setVerifiedRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active mode
  const [practiceMode, setPracticeMode] = useState<'ingredient' | 'step_ordering' | 'recipe_recall' | 'history'>('ingredient');

  // Quiz state (Ingredient mode)
  const [quizActive, setQuizActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [userSelectedOption, setUserSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  // Step Ordering state
  const [orderingRecipe, setOrderingRecipe] = useState<Recipe | null>(null);
  const [shuffledSteps, setShuffledSteps] = useState<RecipeStepItem[]>([]);
  const [stepOrderEvaluated, setStepOrderEvaluated] = useState(false);
  const [isStepOrderSuccess, setIsStepOrderSuccess] = useState(false);

  // History state
  const [historyList, setHistoryList] = useState<PracticeHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveHistoryRecord = (rec: Omit<PracticeHistoryRecord, 'id' | 'date'>) => {
    const newRecord: PracticeHistoryRecord = {
      ...rec,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    const updated = [newRecord, ...historyList].slice(0, 30);
    setHistoryList(updated);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  };

  useEffect(() => {
    const loadVerified = async () => {
      try {
        setIsLoading(true);
        const all = await recipeService.getRecipes({ showArchived: false, status: 'verified' });
        const valid = all.filter(
          (r) => (r.ingredients && r.ingredients.length > 0) || (r.steps && r.steps.length > 0)
        );
        setVerifiedRecipes(valid);
      } catch (err) {
        console.error('Error fetching verified recipes for practice:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadVerified();
  }, []);

  // Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (quizActive && !isCompleted) {
      interval = setInterval(() => {
        setTimeSpent((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizActive, isCompleted]);

  // Start Ingredient Quiz
  const startIngredientQuiz = () => {
    setQuizActive(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setTimeSpent(0);
    setIsCompleted(false);
    setUserSelectedOption(null);
    setFeedback(null);
  };

  const currentRecipe = verifiedRecipes[currentQuestionIndex];

  // Dynamic question generation from verified recipe (stable across timer updates via useMemo)
  const questionData = useMemo(() => {
    if (!quizActive || !currentRecipe) return null;
    const correctIngredient = currentRecipe.ingredients?.[0];
    if (!correctIngredient) return null;

    const distractors = ['น้ำเชื่อม 1.5 oz', 'เอสเพรสโซ่ 30 ml', 'นมสด 150 ml', 'ผงชาเขียว 10 g'].filter(
      (opt) => !opt.includes(correctIngredient.ingredient_name || '')
    );

    const correctText = `${correctIngredient.ingredient_name} (${correctIngredient.quantity} ${correctIngredient.unit_symbol || ''})`;
    const options = [correctText, distractors[0] || 'น้ำตาล 1 ช้อนชา', distractors[1] || 'ซอสคาราเมล 15 ml'].sort(
      () => 0.5 - Math.random()
    );

    return {
      title: `สำหรับเมนู "${currentRecipe.name_th}" (${currentRecipe.glass_size || 'ขนาดมาตรฐาน'})`,
      question: `ส่วนผสมใดต่อไปนี้มีปริมาณถูกต้องตามสูตรมาตรฐานของร้าน?`,
      options,
      correctAnswer: correctText,
    };
  }, [quizActive, currentQuestionIndex, currentRecipe]);

  const handleSelectOption = (option: string) => {
    if (userSelectedOption !== null) return;
    setUserSelectedOption(option);

    if (option === questionData?.correctAnswer) {
      setScore((s) => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }
  };

  const handleNextQuestion = () => {
    setUserSelectedOption(null);
    setFeedback(null);
    if (currentQuestionIndex + 1 < verifiedRecipes.length) {
      setCurrentQuestionIndex((i) => i + 1);
    } else {
      setIsCompleted(true);
      saveHistoryRecord({
        mode: 'ingredient',
        recipeName: `${verifiedRecipes.length} เมนูรวม`,
        score: score + (feedback === 'correct' ? 0 : 0),
        total: verifiedRecipes.length,
        timeSpentSeconds: timeSpent,
      });
    }
  };

  // Step Ordering handlers
  const startStepOrdering = () => {
    const candidates = verifiedRecipes.filter((r) => r.steps && r.steps.length >= 2);
    if (candidates.length === 0) {
      alert('จำเป็นต้องมีสูตรที่มีขั้นตอนตั้งแต่ 2 ขั้นตอนขึ้นไป');
      return;
    }
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    setOrderingRecipe(chosen);
    // Shuffle steps
    const shuffled = [...(chosen.steps || [])].sort(() => 0.5 - Math.random());
    setShuffledSteps(shuffled);
    setStepOrderEvaluated(false);
  };

  const handleMoveStep = (index: number, dir: 'up' | 'down') => {
    if (stepOrderEvaluated) return;
    const targetIdx = dir === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= shuffledSteps.length) return;
    const clone = [...shuffledSteps];
    const [moved] = clone.splice(index, 1);
    clone.splice(targetIdx, 0, moved);
    setShuffledSteps(clone);
  };

  const handleCheckStepOrder = () => {
    if (!orderingRecipe) return;
    const isCorrect = shuffledSteps.every((st, idx) => st.step_number === idx + 1);
    setIsStepOrderSuccess(isCorrect);
    setStepOrderEvaluated(true);
    saveHistoryRecord({
      mode: 'step_ordering',
      recipeName: orderingRecipe.name_th,
      score: isCorrect ? 1 : 0,
      total: 1,
      timeSpentSeconds: 30,
    });
  };

  if (isLoading) {
    return (
      <div className="p-20 text-center text-cafe-muted">
        <span className="w-8 h-8 border-2 border-cafe-copper border-t-transparent rounded-full animate-spin inline-block mb-2" />
        <div className="text-xs">กำลังตรวจสอบสูตรที่ผ่านการยืนยัน (Verified)...</div>
      </div>
    );
  }

  // Guard: if no verified recipes exist
  if (verifiedRecipes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-cafe-text dark:text-cafe-cream">
            ระบบฝึกจำสูตร (Practice Mode)
          </h1>
          <p className="text-xs sm:text-sm text-cafe-muted mt-0.5">
            สุ่มทดสอบความจำจากสูตรจริงที่ได้รับการยืนยัน (Verified) เท่านั้น
          </p>
        </div>

        <EmptyState
          title="ยังไม่มีสูตรที่มีสถานะ Verified สำหรับสร้างแบบทดสอบ"
          description="ตามหลักการของ Barista Studio ระบบฝึกฝนจะดึงข้อมูลจากสูตรที่ผ่านการตรวจสอบแล้ว (Verified) เท่านั้น เพื่อป้องกันการจำสูตรที่ยังไม่สมบูรณ์"
          actionLabel="ไปที่ Recipe Book เพื่อตั้งสถานะเป็น Verified"
          onAction={() => navigate('/recipes')}
          icon={<ShieldCheck className="w-8 h-8 text-emerald-600" />}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-cafe-border dark:border-cafe-darkBorder">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-cafe-text dark:text-cafe-cream flex items-center gap-2">
            <Target className="w-6 h-6 text-cafe-copper" />
            ระบบฝึกจำสูตรบาริสต้า (Practice Mode)
          </h1>
          <p className="text-xs text-cafe-muted mt-0.5">
            ทดสอบความแม่นยำจากคลังสูตรที่ยืนยันแล้ว ({verifiedRecipes.length} สูตรพร้อมฝึกฝน)
          </p>
        </div>

        {quizActive && !isCompleted && (
          <div className="flex items-center gap-2 text-xs font-mono font-semibold px-3 py-1.5 rounded-xl bg-cafe-cream dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder">
            <Clock className="w-4 h-4 text-cafe-copper" />
            {timeSpent} วินาที
          </div>
        )}
      </div>

      {/* Mode navigation */}
      <div className="flex p-1 bg-cafe-cream dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder gap-1 overflow-x-auto">
        <button
          onClick={() => {
            setPracticeMode('ingredient');
            setQuizActive(false);
          }}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
            practiceMode === 'ingredient'
              ? 'bg-cafe-surface dark:bg-cafe-darkSurface text-cafe-copper shadow-xs'
              : 'text-cafe-muted hover:text-cafe-text'
          }`}
        >
          <Coffee className="w-4 h-4" /> ส่วนผสม (Ingredient Quiz)
        </button>

        <button
          onClick={() => {
            setPracticeMode('step_ordering');
            startStepOrdering();
          }}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
            practiceMode === 'step_ordering'
              ? 'bg-cafe-surface dark:bg-cafe-darkSurface text-cafe-copper shadow-xs'
              : 'text-cafe-muted hover:text-cafe-text'
          }`}
        >
          <ListOrdered className="w-4 h-4" /> เรียงขั้นตอน (Step Ordering)
        </button>

        <button
          onClick={() => setPracticeMode('history')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
            practiceMode === 'history'
              ? 'bg-cafe-surface dark:bg-cafe-darkSurface text-cafe-copper shadow-xs'
              : 'text-cafe-muted hover:text-cafe-text'
          }`}
        >
          <History className="w-4 h-4" /> ประวัติการฝึก ({historyList.length})
        </button>
      </div>

      {/* Mode 1: Ingredient Quiz */}
      {practiceMode === 'ingredient' && (
        <>
          {!quizActive ? (
            <div className="p-8 rounded-3xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-center space-y-5 shadow-cafe-card">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cafe-copper/10 text-cafe-copper flex items-center justify-center">
                <Coffee className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-cafe-text dark:text-cafe-cream">
                  แบบทดสอบสัดส่วนและส่วนผสม
                </h2>
                <p className="text-sm text-cafe-muted max-w-md mx-auto mt-1 leading-relaxed">
                  สุ่มคำถามจากสูตร Verified ทั้งหมด {verifiedRecipes.length} เมนู เพื่อทดสอบความแม่นยำในการจดจำอัตราส่วนของร้าน
                </p>
              </div>

              <div className="pt-2">
                <Button variant="primary" size="lg" onClick={startIngredientQuiz}>
                  เริ่มทดสอบทันที ({verifiedRecipes.length} ข้อ)
                </Button>
              </div>
            </div>
          ) : isCompleted ? (
            <div className="p-8 rounded-3xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-center space-y-5 shadow-cafe-card">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <Award className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-cafe-text dark:text-cafe-cream">
                  สรุปผลการฝึกฝน
                </h2>
                <p className="text-sm text-cafe-muted mt-1">ใช้เวลาทั้งหมด {timeSpent} วินาที</p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold block">ตอบถูก</span>
                  <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    {score} / {verifiedRecipes.length}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                  <span className="text-xs text-rose-800 dark:text-rose-300 font-semibold block">ตอบผิด</span>
                  <span className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-400">
                    {verifiedRecipes.length - score}
                  </span>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-4">
                <Button variant="secondary" onClick={() => setQuizActive(false)}>
                  กลับหน้ารวม
                </Button>
                <Button variant="primary" icon={<RotateCcw className="w-4 h-4" />} onClick={startIngredientQuiz}>
                  ฝึกใหม่อีกรอบ
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 rounded-3xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder space-y-6 shadow-cafe-card">
              <div className="flex items-center justify-between text-xs text-cafe-muted font-mono">
                <span>
                  คำถามข้อที่ {currentQuestionIndex + 1} จาก {verifiedRecipes.length}
                </span>
                <span>คะแนนปัจจุบัน: {score}</span>
              </div>

              <div>
                <span className="text-xs font-semibold text-cafe-copper uppercase tracking-wider block mb-1">
                  {questionData?.title}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-cafe-text dark:text-cafe-cream">
                  {questionData?.question}
                </h2>
              </div>

              <div className="space-y-3">
                {questionData?.options.map((option, idx) => {
                  const isSelected = userSelectedOption === option;
                  const isCorrect = option === questionData.correctAnswer;
                  let btnClass =
                    'bg-cafe-cream/60 dark:bg-cafe-darkSurface border-cafe-border dark:border-cafe-darkBorder text-cafe-text dark:text-cafe-cream hover:border-cafe-copper';

                  if (userSelectedOption !== null) {
                    if (isCorrect) {
                      btnClass =
                        'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300';
                    } else if (isSelected) {
                      btnClass =
                        'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-300';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(option)}
                      disabled={userSelectedOption !== null}
                      className={`w-full p-4 rounded-xl border text-left text-sm font-semibold transition-all flex items-center justify-between ${btnClass}`}
                    >
                      <span>{option}</span>
                      {userSelectedOption !== null && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      )}
                      {userSelectedOption !== null && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {feedback && (
                <div className="pt-4 flex items-center justify-between border-t border-cafe-border/70 dark:border-cafe-darkBorder">
                  <div className="text-xs font-semibold">
                    {feedback === 'correct' ? (
                      <span className="text-emerald-600 dark:text-emerald-400">✓ ถูกต้องตามสูตรเป๊ะ!</span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400">
                        ✗ ยังไม่ถูกต้อง เฉลยคือ: {questionData?.correctAnswer}
                      </span>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    icon={<ArrowRight className="w-4 h-4" />}
                    onClick={handleNextQuestion}
                  >
                    {currentQuestionIndex + 1 < verifiedRecipes.length ? 'ข้อถัดไป' : 'ดูผลสรุป'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Mode 2: Step Ordering */}
      {practiceMode === 'step_ordering' && orderingRecipe && (
        <div className="p-6 sm:p-8 rounded-3xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder space-y-6 shadow-cafe-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-cafe-copper uppercase tracking-wider block">
                โจทย์เรียงลำดับขั้นตอนการชง
              </span>
              <h2 className="text-xl font-bold text-cafe-text dark:text-cafe-cream">
                เมนู: "{orderingRecipe.name_th}" ({orderingRecipe.glass_size || 'ขนาดมาตรฐาน'})
              </h2>
            </div>
            <Button variant="secondary" size="sm" icon={<RotateCcw className="w-4 h-4" />} onClick={startStepOrdering}>
              สุ่มเมนูอื่น
            </Button>
          </div>

          <p className="text-xs text-cafe-muted">
            ใช้ปุ่มลูกศรขึ้น/ลง เพื่อจัดเรียงขั้นตอนการทำให้ถูกต้องตามลำดับขั้นตอนของร้าน
          </p>

          <div className="space-y-2.5">
            {shuffledSteps.map((step, idx) => (
              <div
                key={step.id || idx}
                className="p-3.5 rounded-xl border border-cafe-border dark:border-cafe-darkBorder bg-cafe-cream/40 dark:bg-cafe-darkSurface flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-cafe-copper/20 text-cafe-copper font-mono font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-sm text-cafe-text dark:text-cafe-cream">{step.title}</div>
                    {step.description && (
                      <div className="text-xs text-cafe-muted line-clamp-1">{step.description}</div>
                    )}
                  </div>
                </div>

                {!stepOrderEvaluated && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveStep(idx, 'up')}
                      className="p-1.5 text-cafe-muted hover:text-cafe-text disabled:opacity-30 rounded hover:bg-cafe-sand/50"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === shuffledSteps.length - 1}
                      onClick={() => handleMoveStep(idx, 'down')}
                      className="p-1.5 text-cafe-muted hover:text-cafe-text disabled:opacity-30 rounded hover:bg-cafe-sand/50"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!stepOrderEvaluated ? (
            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="md" onClick={handleCheckStepOrder}>
                ตรวจสอบลำดับขั้นตอน
              </Button>
            </div>
          ) : (
            <div className="p-4 rounded-xl border space-y-3 animate-in fade-in">
              {isStepOrderSuccess ? (
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" /> ยอดเยี่ยมมาก! คุณเรียงลำดับขั้นตอนถูกต้องครบถ้วน
                </div>
              ) : (
                <div className="text-rose-700 dark:text-rose-400 font-bold text-sm">
                  ✗ ลำดับยังไม่ถูกต้อง ลองตรวจสอบความต่อเนื่องของการสกัดกาแฟและการเติมนมอีกครั้ง
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="primary" size="sm" onClick={startStepOrdering}>
                  ทดสอบเมนูถัดไป
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Practice History */}
      {practiceMode === 'history' && (
        <div className="p-6 rounded-3xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder space-y-4 shadow-cafe-card">
          <div className="flex items-center justify-between pb-3 border-b border-cafe-border dark:border-cafe-darkBorder">
            <h2 className="font-bold text-base text-cafe-text dark:text-cafe-cream flex items-center gap-2">
              <History className="w-4 h-4 text-cafe-copper" /> ประวัติการฝึกฝนและความก้าวหน้า
            </h2>
            {historyList.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('คุณต้องการล้างประวัติการฝึกทั้งหมดหรือไม่?')) {
                    setHistoryList([]);
                    localStorage.removeItem(HISTORY_STORAGE_KEY);
                  }
                }}
                className="text-xs text-cafe-muted hover:text-rose-600"
              >
                ล้างประวัติ
              </button>
            )}
          </div>

          {historyList.length === 0 ? (
            <div className="p-8 text-center text-cafe-muted text-xs">
              ยังไม่มีประวัติการฝึกฝน เริ่มต้นทำ Quiz เพื่อบันทึกพัฒนาการ
            </div>
          ) : (
            <div className="space-y-2.5">
              {historyList.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-cafe-border dark:border-cafe-darkBorder bg-cafe-cream/40 dark:bg-cafe-darkSurface flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-cafe-text dark:text-cafe-cream">
                      {item.recipeName}
                    </span>
                    <span className="block text-[11px] text-cafe-muted mt-0.5">
                      โหมด: {item.mode === 'ingredient' ? 'สัดส่วนวัตถุดิบ' : 'เรียงขั้นตอน'} • ใช้เวลา {item.timeSpentSeconds} วินาที
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-cafe-copper">
                      {item.score} / {item.total}
                    </span>
                    <span className="block text-[10px] text-cafe-muted font-mono">
                      {new Date(item.date).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
