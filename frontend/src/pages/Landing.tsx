import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileText, Sparkles, Layers, Target, GraduationCap,
  Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { authService } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import ThreeDCanvas from '../components/ThreeDCanvas';
import FloatingResumeDoc from '../components/FloatingResumeDoc';

const Landing: React.FC = () => {
  const location = useLocation();
  const initialTab = location.pathname.includes('signup') ? 'signup' : 'login';

  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>(initialTab);
  const [resetSent, setResetSent] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});

  // 3D Card tilt state
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/app/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (location.pathname.includes('signup')) {
      setTab('signup');
    } else if (location.pathname.includes('login') || location.pathname === '/') {
      setTab((prev) => (prev === 'forgot' ? 'forgot' : 'login'));
    }
  }, [location.pathname]);

  const update = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    // Clear field error on change
    if (errors[k as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [k]: undefined }));
    }
  };

  // Subtle 3D Card Parallax & Glare
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
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
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
      toast.success('Account created successfully! Please sign in with your password.', {
        duration: 6000,
        icon: '🎉',
      });
      // Switch directly to login tab
      setTab('login');
      // Keep registered email prefilled, clear password
      setForm((prev) => ({ ...prev, password: '' }));
      setErrors({});
      navigate('/login', { replace: true });
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
      toast.success('Password recovery link sent! Check your inbox.');
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || 'Failed to send reset link');
    }
  };

  const handleExploreDemo = () => {
    toast.success('Entering Demo Workspace…');
    navigate('/app/demo');
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-white via-slate-50 to-blue-50/20 text-slate-900 flex items-center justify-center p-4 md:p-8 overflow-hidden select-none">
      
      {/* 1. Soft Light Ambient Gradient Halos */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-blue-100/60 to-cyan-50/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[650px] h-[650px] bg-gradient-to-tl from-indigo-100/50 to-blue-50/40 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-violet-100/30 rounded-full blur-[100px] pointer-events-none" />

      {/* 2. Live 3D Neural-Network Sphere & Subtle Digital Grid Canvas */}
      <ThreeDCanvas />

      {/* 3. Floating 3D Tech Icons around the environment */}
      <div className="hidden lg:block absolute left-10 top-20 animate-float pointer-events-none">
        <div className="w-11 h-11 rounded-2xl bg-white/80 backdrop-blur-md border border-blue-100/80 shadow-lg shadow-blue-500/5 flex items-center justify-center text-blue-600">
          <Sparkles size={20} />
        </div>
      </div>

      <div className="hidden lg:block absolute left-28 bottom-20 animate-float-delayed pointer-events-none">
        <div className="w-11 h-11 rounded-2xl bg-white/80 backdrop-blur-md border border-cyan-100/80 shadow-lg shadow-cyan-500/5 flex items-center justify-center text-cyan-600">
          <Layers size={20} />
        </div>
      </div>

      <div className="hidden lg:block absolute right-14 top-24 animate-float-reverse pointer-events-none">
        <div className="w-11 h-11 rounded-2xl bg-white/80 backdrop-blur-md border border-indigo-100/80 shadow-lg shadow-indigo-500/5 flex items-center justify-center text-indigo-600">
          <Target size={20} />
        </div>
      </div>

      <div className="hidden lg:block absolute right-24 bottom-24 animate-float pointer-events-none">
        <div className="w-11 h-11 rounded-2xl bg-white/80 backdrop-blur-md border border-violet-100/80 shadow-lg shadow-violet-500/5 flex items-center justify-center text-violet-600">
          <GraduationCap size={20} />
        </div>
      </div>

      {/* 4. Main Two-Column Layout on Large Screens (Resume Visual on Left, Login Card Centered/Right) */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 py-6">
        
        {/* Left Column: 3D Resume Document Analyzer Visual with Scanning Line */}
        <div className="hidden lg:flex flex-1 flex-col items-start justify-center max-w-md">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
            <span>Advanced Career Intelligence &amp; Placement System</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 bg-clip-text text-transparent">
              AI Placement &amp; Career Intelligence Platform
            </span>
          </h1>

          <p className="text-slate-600 text-sm leading-relaxed mb-8">
            Experience real-time ATS keyword matching, multi-tier placement eligibility scoring, and voice-to-voice mock interviews.
          </p>

          {/* Floating 3D Resume Document with Scanning Line */}
          <FloatingResumeDoc />
        </div>

        {/* Right Column: Centered Professional Login Card */}
        <div className="w-full max-w-md perspective-1200 flex justify-center">
          
          {/* Subtle Outer Card Glow */}
          <div
            className="w-full relative"
            style={{
              transform: isHovered
                ? `rotateX(${rotateX * 0.6}deg) rotateY(${rotateY * 0.6}deg)`
                : 'none',
              transition: 'transform 120ms ease-out',
            }}
          >
            {/* The Glassmorphism Login Card */}
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="relative w-full bg-white/90 backdrop-blur-2xl border border-blue-100/90 rounded-3xl p-8 md:p-10 shadow-2xl shadow-blue-900/5 transform-style-3d transition-all ease-out"
              style={{
                transform: isHovered
                  ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.015)`
                  : 'rotateX(0deg) rotateY(0deg) scale(1)',
                transitionDuration: isHovered ? '80ms' : '400ms',
              }}
            >
              {/* Soft Pearlescent Light Glare */}
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle 300px at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glarePos.opacity}), transparent 75%)`,
                }}
              />

              {/* Logo Section */}
              <div className="flex items-center gap-3.5 mb-6">
                {/* Modern Blue/Cyan Gradient Logo combining AI + Resume Document */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <div className="relative">
                    <FileText size={22} className="stroke-[2.2]" />
                    <Sparkles size={13} className="absolute -top-1 -right-1 text-cyan-200 fill-current" />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
                    CareerFit <span className="text-blue-600">AI</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 tracking-tight">
                    Know your fit. Build your career.
                  </div>
                </div>
              </div>

              {/* Heading & Subtitle */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {tab === 'login'
                    ? 'Welcome Back'
                    : tab === 'signup'
                    ? 'Create Account'
                    : 'Reset Password'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {tab === 'login'
                    ? 'Access your career intelligence dashboard.'
                    : tab === 'signup'
                    ? 'Unlock advanced placement and career insights.'
                    : 'Enter your email to receive recovery instructions.'}
                </p>
              </div>

              {/* Clean Tab Selector (Shown for Login / Signup) */}
              {tab !== 'forgot' && (
                <div className="flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 mb-6">
                  <button
                    type="button"
                    onClick={() => { setErrors({}); setTab('login'); navigate('/login', { replace: true }); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      tab === 'login'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setErrors({}); setTab('signup'); navigate('/signup', { replace: true }); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      tab === 'signup'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Register
                  </button>
                </div>
              )}

              {/* Form */}
              {tab === 'forgot' ? (
                <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                  <div className="text-left mb-1">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Enter the email address registered with your account and we will send you an official password recovery link.
                    </p>
                  </div>

                  {resetSent ? (
                    <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-lg font-bold">
                        ✓
                      </div>
                      <p className="text-sm font-bold text-emerald-900">Recovery Link Sent!</p>
                      <p className="text-xs text-emerald-700 leading-relaxed">
                        We have sent a password reset email to <strong className="font-semibold">{form.email}</strong>.
                        Please check your inbox and click the link to choose a new password.
                      </p>
                      <button
                        type="button"
                        onClick={() => { setResetSent(false); setTab('login'); }}
                        className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline block mx-auto"
                      >
                        Return to Sign In
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                          Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={(e) => update('email', e.target.value)}
                          className={`w-full bg-white border ${errors.email ? 'border-rose-400' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-xs`}
                        />
                        {errors.email && (
                          <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.email}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-bold text-sm tracking-wide hover:brightness-105 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Send Password Reset Link</span>
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setErrors({}); setTab('login'); }}
                        className="text-xs text-slate-500 hover:text-slate-800 font-semibold text-center transition-colors pt-1"
                      >
                        ← Back to Sign In
                      </button>
                    </>
                  )}
                </form>
              ) : (
                <form onSubmit={tab === 'login' ? handleLogin : handleSignup} className="flex flex-col gap-4">
                  {tab === 'signup' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Alex Morgan"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        className={`w-full bg-white border ${errors.name ? 'border-rose-400' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-xs`}
                      />
                      {errors.name && (
                        <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.name}</p>
                      )}
                    </div>
                  )}

                  {/* Email Field */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      className={`w-full bg-white border ${errors.email ? 'border-rose-400' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-xs`}
                    />
                    {errors.email && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.email}</p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Password
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={(e) => update('password', e.target.value)}
                        className={`w-full bg-white border ${errors.password ? 'border-rose-400' : 'border-slate-200'} rounded-xl pl-4 pr-12 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-xs`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.password}</p>
                    )}

                    {/* Password Strength Checklist for Registration */}
                    {tab === 'signup' && (
                      <div className="mt-2.5 p-3 bg-slate-50/90 border border-slate-200/80 rounded-xl space-y-1.5 text-[11px]">
                        <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Password Requirements</p>
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

                  {/* Login Options: Remember Me & Forgot Password */}
                  {tab === 'login' && (
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 w-3.5 h-3.5"
                        />
                        <span>Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => { setErrors({}); setResetSent(false); setTab('forgot'); }}
                        className="text-blue-600 hover:text-blue-700 hover:underline font-semibold"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {/* Large Modern Sign In Button (Blue → Cyan Gradient) */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-bold text-sm tracking-wide hover:brightness-105 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{tab === 'login' ? 'Sign In' : 'Create Account'}</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* 1-Click Instant Demo Option */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleExploreDemo}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-200 text-xs font-bold text-slate-700 hover:text-blue-700 flex items-center justify-center gap-2 transition-all shadow-2xs"
                >
                  <Sparkles size={14} className="text-cyan-500" />
                  <span>Explore Demo Workspace (No Login Required)</span>
                </button>

                <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-500" /> Free Tier Available
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={12} className="text-blue-500" /> 256-bit Encrypted
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
