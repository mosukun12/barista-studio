import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Mail, Lock, User, ArrowRight, ShieldCheck, HardDrive, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, isSupabaseConnected } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    try {
      setIsLoading(true);
      if (mode === 'signin') {
        await signIn(email.trim(), password);
        navigate('/');
      } else {
        if (!fullName.trim()) {
          setErrorMsg('กรุณาระบุชื่อ-นามสกุล หรือชื่อบาริสต้า');
          setIsLoading(false);
          return;
        }
        await signUp(email.trim(), password, fullName.trim());
        setSuccessMsg(
          'สมัครสมาชิกสำเร็จ! หากระบบ Supabase เปิด "Confirm email" ไว้ กรุณาตรวจสอบกล่องจดหมาย หรือปิด Confirm email ใน Dashboard ก่อนเข้าสู่ระบบ'
        );
        setTimeout(() => {
          setMode('signin');
          setIsLoading(false);
        }, 2000);
        return;
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('Email not confirmed')) {
        setErrorMsg('อีเมลนี้ยังไม่ได้กดยืนยัน กรุณาเช็คอีเมล หรือเข้าไปที่ Supabase Dashboard > Authentication > Providers > Email เพื่อปิดสวิตช์ "Confirm email"');
      } else if (msg.includes('Invalid login credentials')) {
        setErrorMsg('อีเมลหรือรหัสผ่านไม่ถูกต้อง (หากเพิ่งสมัคร กรุณาตรวจสอบว่าได้ยืนยันอีเมลหรือปิด Confirm email ใน Supabase แล้วหรือไม่)');
      } else if (msg.includes('User already registered')) {
        setErrorMsg('อีเมลนี้ถูกลงทะเบียนไปแล้ว กรุณาสลับไปที่แท็บ "เข้าสู่ระบบ"');
      } else {
        setErrorMsg(msg || 'การเข้าสู่ระบบล้มเหลว กรุณาตรวจสอบข้อมูล');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-cafe-surface dark:bg-cafe-darkCard rounded-3xl border border-cafe-border dark:border-cafe-darkBorder p-8 shadow-cafe-card space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-cafe-espresso dark:bg-cafe-copper text-cafe-brass flex items-center justify-center shadow-sm">
            <Coffee className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-cafe-text dark:text-cafe-cream">
            {mode === 'signin' ? 'เข้าสู่ระบบ Barista Studio' : 'สร้างบัญชีบาริสต้าใหม่'}
          </h1>
          <p className="text-xs text-cafe-muted">
            Personal Barista Recipe Management & Training Workbench
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex p-1 bg-cafe-cream dark:bg-cafe-darkSurface rounded-xl border border-cafe-border dark:border-cafe-darkBorder">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-cafe-surface dark:bg-cafe-darkCard text-cafe-copper shadow-xs'
                : 'text-cafe-muted hover:text-cafe-text'
            }`}
          >
            เข้าสู่ระบบ (Sign In)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-cafe-surface dark:bg-cafe-darkCard text-cafe-copper shadow-xs'
                : 'text-cafe-muted hover:text-cafe-text'
            }`}
          >
            สมัครสมาชิก (Sign Up)
          </button>
        </div>

        {/* Error / Success message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
                ชื่อ-นามสกุล / ชื่อบาริสต้า (Full Name)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cafe-muted" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="เช่น Barista Jane"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
              อีเมล (Email)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cafe-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="barista@cafe.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cafe-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none font-mono"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isLoading}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {mode === 'signin' ? 'เข้าสู่ระบบ' : 'ลงทะเบียนและเริ่มใช้งาน'}
          </Button>
        </form>

        {/* Database Status Info */}
        <div className="pt-4 border-t border-cafe-border/70 dark:border-cafe-darkBorder text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-cafe-muted">
            {isSupabaseConnected ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Supabase Auth Cloud Active</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5 text-amber-600" />
                <span>โหมดทดลองในเครื่อง (Local Mode)</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
