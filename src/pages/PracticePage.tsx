import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, CheckCircle2, XCircle, RotateCcw, Clock, Award, Coffee, ArrowRight, ShieldCheck } from 'lucide-react';
import { Recipe } from '../types';
import { recipeService } from '../services/recipeService';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';

export const PracticePage: React.FC = () => {
  const navigate = useNavigate();

  const [verifiedRecipes, setVerifiedRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quiz state
  const [quizActive, setQuizActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [userSelectedOption, setUserSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    const loadVerified = async () => {
      try {
        setIsLoading(true);
        const all = await recipeService.getRecipes({ showArchived: false, status: 'verified' });
        // Only consider recipes that have ingredients or steps to quiz
        const valid = all.filter((r) => (r.ingredients && r.ingredients.length > 0) || (r.steps && r.steps.length > 0));
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

  const startQuiz = () => {
    setQuizActive(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setTimeSpent(0);
    setIsCompleted(false);
    setUserSelectedOption(null);
    setFeedback(null);
  };

  const currentRecipe = verifiedRecipes[currentQuestionIndex];

  // Dynamic question generation from verified recipe
  const generateQuestion = () => {
    if (!currentRecipe) return null;
    const correctIngredient = currentRecipe.ingredients?.[0];
    if (!correctIngredient) return null;

    // Distractor options
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
  };

  const questionData = quizActive ? generateQuestion() : null;

  const handleSelectOption = (option: string) => {
    if (userSelectedOption !== null) return; // already answered
    setUserSelectedOption(option);

    if (option === questionData?.correctAnswer) {
      setScore((s) => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }
  };

  const handleNext = () => {
    setUserSelectedOption(null);
    setFeedback(null);
    if (currentQuestionIndex + 1 < verifiedRecipes.length) {
      setCurrentQuestionIndex((i) => i + 1);
    } else {
      setIsCompleted(true);
    }
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
      <div className="flex items-center justify-between pb-4 border-b border-cafe-border dark:border-cafe-darkBorder">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-cafe-text dark:text-cafe-cream flex items-center gap-2">
            <Target className="w-6 h-6 text-cafe-copper" />
            ระบบฝึกจำสูตรบาริสต้า (Practice Mode)
          </h1>
          <p className="text-xs text-cafe-muted mt-0.5">
            ทดสอบจากคลังสูตรที่ยืนยันแล้ว ({verifiedRecipes.length} สูตรที่พร้อมฝึกฝน)
          </p>
        </div>

        {quizActive && !isCompleted && (
          <div className="flex items-center gap-2 text-xs font-mono font-semibold px-3 py-1.5 rounded-xl bg-cafe-cream dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder">
            <Clock className="w-4 h-4 text-cafe-copper" />
            {timeSpent} วินาที
          </div>
        )}
      </div>

      {!quizActive ? (
        /* Intro card */
        <div className="p-8 rounded-3xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-center space-y-5 shadow-cafe-card">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-cafe-copper/10 text-cafe-copper flex items-center justify-center">
            <Coffee className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-cafe-text dark:text-cafe-cream">
              แบบทดสอบสัดส่วนและขั้นตอนการชง
            </h2>
            <p className="text-sm text-cafe-muted max-w-md mx-auto mt-1 leading-relaxed">
              ระบบจะสุ่มคำถามจากสูตร Verified ทั้งหมด {verifiedRecipes.length} เมนู เพื่อทดสอบความแม่นยำในการจดจำอัตราส่วนและลำดับขั้นตอน
            </p>
          </div>

          <div className="pt-2">
            <Button variant="primary" size="lg" onClick={startQuiz}>
              เริ่มทดสอบทันที ({verifiedRecipes.length} ข้อ)
            </Button>
          </div>
        </div>
      ) : isCompleted ? (
        /* Result card */
        <div className="p-8 rounded-3xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-center space-y-5 shadow-cafe-card">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-cafe-text dark:text-cafe-cream">
              สรุปผลการฝึกฝน
            </h2>
            <p className="text-sm text-cafe-muted mt-1">
              ใช้เวลาทั้งหมด {timeSpent} วินาที
            </p>
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
            <Button variant="primary" icon={<RotateCcw className="w-4 h-4" />} onClick={startQuiz}>
              ฝึกใหม่อีกรอบ
            </Button>
          </div>
        </div>
      ) : (
        /* Quiz question screen */
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

          {/* Options */}
          <div className="space-y-3">
            {questionData?.options.map((option, idx) => {
              const isSelected = userSelectedOption === option;
              const isCorrect = option === questionData.correctAnswer;
              let btnClass = 'bg-cafe-cream/60 dark:bg-cafe-darkSurface border-cafe-border dark:border-cafe-darkBorder text-cafe-text dark:text-cafe-cream hover:border-cafe-copper';

              if (userSelectedOption !== null) {
                if (isCorrect) {
                  btnClass = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300';
                } else if (isSelected) {
                  btnClass = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-300';
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

          {/* Feedback & Next Button */}
          {feedback && (
            <div className="pt-4 flex items-center justify-between border-t border-cafe-border/70 dark:border-cafe-darkBorder">
              <div className="text-xs font-semibold">
                {feedback === 'correct' ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✓ ถูกต้องตามสูตรเป๊ะ!
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400">
                    ✗ ยังไม่ถูกต้อง เฉลยคือ: {questionData?.correctAnswer}
                  </span>
                )}
              </div>

              <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />} onClick={handleNext}>
                {currentQuestionIndex + 1 < verifiedRecipes.length ? 'ข้อถัดไป' : 'ดูผลสรุป'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
