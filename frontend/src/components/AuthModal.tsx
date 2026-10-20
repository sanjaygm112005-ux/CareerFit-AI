// src/components/AuthModal.tsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Eye, EyeOff, FileText, Sparkles, ArrowRight, Lock, Mail, User as UserIcon } from 'lucide-react';
import { authService } from '../services/auth';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  defaultTab?: 'login' | 'signup';
}

const AuthModal: React.FC<Props> = ({ onClose, defaultTab = 'login' }) => {
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>(defaultTab);
  const [resetSent, setResetSent] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const navigate = useNavigate();

  // 3D Card tilt state
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const update = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [k]: undefined }));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 8;
    const rotY = ((x - centerX) / centerX) * 8;

    setRotateX(rotX);
    setRotateY(rotY);

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlarePos({ x: glareX, y: glareY, opacity: 0.35 });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
  };

  const hasUppercase = /[A-Z]/.test(form.password);
  const hasLowercase = /[a-z]/.test(form.password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>\-_=+[\];'/`~]/.test(form.password);
  const hasMinLength = form.password.length >= 8;

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.email) {
      errs.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!form.password) {
      errs.password = 'Password is required';
    } else if (tab === 'signup') {
      if (!hasMinLength) {
        errs.password = 'Password must be at least 8 characters';
      } else if (!hasUppercase) {
        errs.password = 'Password must contain at least one uppercase letter (A-Z)';
      } else if (!hasLowercase) {
        errs.password = 'Password must contain at least one lowercase letter (a-z)';
      } else if (!hasSpecialChar) {
        errs.password = 'Password must contain at least one special character (!@#$%^&*)';
      }
    } else if (form.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (tab === 'signup' && !form.name.trim()) {
      errs.name = 'Full name is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await authService.login(form.email, form.password);
      setLoading(false);
      toast.success('Welcome back!');
      onClose();
      navigate('/app/dashboard');
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || 'Invalid email or password');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await authService.signup(form.email, form.password, form.name);
      setLoading(false);
      toast.success('Account created! Welcome to CareerFit AI.');
      onClose();
      navigate('/app/dashboard');
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || 'Failed to create account');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.email.trim()) {
      setErrors({ email: 'Please enter your email address' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(form.email.trim());
      setLoading(false);
      setResetSent(true);
      toast.success('Password recovery link sent! Check your email.');
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || 'Failed to send recovery link');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Soft Frosted Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* 3D Perspective Wrapper */}
      <div className="relative z-10 w-full max-w-md perspective-1200">
        
        {/* Soft Blue/Cyan Light Glow Behind Card */}
        <div
          className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-400/30 via-cyan-400/25 to-indigo-400/30 opacity-60 blur-xl transition-all duration-300"
          style={{
            transform: isHovered
              ? `rotateX(${rotateX * 0.7}deg) rotateY(${rotateY * 0.7}deg) scale(1.02)`
              : 'none',
          }}
        />

        {/* 3D Glass Modal (Light SaaS Theme) */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="relative bg-white/95 backdrop-blur-2xl border border-blue-100/90 rounded-3xl p-8 shadow-2xl shadow-blue-900/10 transform-style-3d transition-transform ease-out"
          style={{
            transform: isHovered
              ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.015)`
              : 'rotateX(0deg) rotateY(0deg) scale(1)',
            transitionDuration: isHovered ? '80ms' : '400ms',
          }}
        >
          {/* Light Glare */}
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 280px at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glarePos.opacity}), transparent 75%)`,
            }}
          />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-20"
          >
            <X size={18} />
          </button>

          {/* Logo & Header combining AI + Resume in Blue/Cyan */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <div className="relative">
                <FileText size={20} className="stroke-[2.2]" />
                <Sparkles size={11} className="absolute -top-1 -right-1 text-cyan-200 fill-current" />
              </div>
            </div>
            <div>
              <div className="font-extrabold text-lg text-slate-900 leading-none">
                CareerFit <span className="text-blue-600">AI</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-500 tracking-tight">
                Know your fit. Build your career.
              </div>
            </div>
          </div>

          {/* Subheading */}
          <div className="mb-5">
            <h3 className="text-xl font-bold text-slate-900">
              {tab === 'login' ? 'Welcome Back' : tab === 'signup' ? 'Create Account' : 'Reset Password'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {tab === 'forgot'
                ? 'Enter your email to receive recovery instructions.'
                : 'Analyze your resume. Discover your opportunities.'}
            </p>
          </div>

          {/* Tabs */}
          {tab !== 'forgot' && (
            <div className="flex bg-slate-100/90 rounded-xl p-1 mb-5 border border-slate-200/50">
              {(['login', 'signup'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setErrors({}); setTab(t); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    tab === t
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/40'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          {tab === 'forgot' ? (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-3.5">
              <div className="text-left">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter the email associated with your account, and we'll send you an official link to reset your password.
                </p>
              </div>

              {resetSent ? (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2.5">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-lg font-bold">
                    ✓
                  </div>
                  <p className="text-sm font-bold text-emerald-900">Recovery Link Sent!</p>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    We've emailed a password recovery link to <strong className="font-semibold">{form.email}</strong>.
                    Check your inbox and click the link to choose a new password.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setResetSent(false); setTab('login'); }}
                    className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline block mx-auto cursor-pointer"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-slate-700 font-semibold mb-1 block">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        className={`w-full bg-white border ${errors.email ? 'border-rose-400' : 'border-slate-200'} rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs`}
                        placeholder="Enter your email"
                        value={form.email}
                        onChange={e => update('email', e.target.value)}
                      />
                    </div>
                    {errors.email && <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.email}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-bold text-sm tracking-wide hover:brightness-105 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send Recovery Link</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setErrors({}); setTab('login'); }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold text-center transition-colors pt-1 cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </>
              )}
            </form>
          ) : (
            <form onSubmit={tab === 'login' ? handleLogin : handleSignup} className="flex flex-col gap-3.5">
              {tab === 'signup' && (
                <div>
                  <label className="text-xs text-slate-700 font-semibold mb-1 block">Full Name</label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      className={`w-full bg-white border ${errors.name ? 'border-rose-400' : 'border-slate-200'} rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs`}
                      placeholder="Alex Morgan"
                      value={form.name}
                      onChange={e => update('name', e.target.value)}
                    />
                  </div>
                  {errors.name && <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.name}</p>}
                </div>
              )}

              <div>
                <label className="text-xs text-slate-700 font-semibold mb-1 block">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    className={`w-full bg-white border ${errors.email ? 'border-rose-400' : 'border-slate-200'} rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs`}
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                  />
                </div>
                {errors.email && <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.email}</p>}
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold mb-1 block">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={`w-full bg-white border ${errors.password ? 'border-rose-400' : 'border-slate-200'} rounded-xl pl-10 pr-11 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs`}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.password}</p>}
                
                {/* Password Strength Checklist for Registration */}
                {tab === 'signup' && (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1.5 text-[11px]">
                    <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Password Requirements</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className={`flex items-center gap-1.5 font-medium transition-colors ${hasMinLength ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-bold ${hasMinLength ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                          {hasMinLength ? '✓' : '•'}
                        </span>
                        <span>Min 8 characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-medium transition-colors ${hasUppercase ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-bold ${hasUppercase ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                          {hasUppercase ? '✓' : '•'}
                        </span>
                        <span>1 Uppercase (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-medium transition-colors ${hasLowercase ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-bold ${hasLowercase ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                          {hasLowercase ? '✓' : '•'}
                        </span>
                        <span>1 Lowercase (a-z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-medium transition-colors ${hasSpecialChar ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-bold ${hasSpecialChar ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                          {hasSpecialChar ? '✓' : '•'}
                        </span>
                        <span>1 Special (!@#$)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Options */}
              {tab === 'login' && (
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 w-3.5 h-3.5"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => { setErrors({}); setResetSent(false); setTab('forgot'); }}
                    className="text-blue-600 hover:text-blue-700 hover:underline font-semibold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Blue to Cyan Gradient Button */}
              <button
                type="submit"
                className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-bold text-sm tracking-wide hover:brightness-105 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{tab === 'login' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {tab !== 'forgot' && (
            <p className="text-center text-xs text-slate-500 mt-4">
              {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setTab(tab === 'login' ? 'signup' : 'login')}
                className="text-blue-600 hover:underline font-bold cursor-pointer"
              >
                {tab === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
