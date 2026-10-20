import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth';
import { Eye, EyeOff, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>\-_=+[\];'/`~]/.test(password);
  const hasMinLength = password.length >= 8;
  const isMatch = password && password === confirmPassword;

  // Verify custom token on load if present
  useEffect(() => {
    if (resetToken) {
      authService.verifyResetToken(resetToken).catch((err) => {
        setError(err.message || 'This reset link has expired or is invalid.');
      });
    }
  }, [resetToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Please enter a new password');
      return;
    }
    if (!hasMinLength) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!hasUppercase) {
      setError('Password must contain at least one uppercase letter (A-Z)');
      return;
    }
    if (!hasLowercase) {
      setError('Password must contain at least one lowercase letter (a-z)');
      return;
    }
    if (!hasSpecialChar) {
      setError('Password must contain at least one special character (!@#$%^&*)');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      if (!resetToken) {
        throw new Error('Reset token is missing. Please use the link sent to your email.');
      }
      // 100% Native Neon Auth Flow
      await authService.resetPassword(resetToken, password);

      setLoading(false);
      setIsSuccess(true);
      toast.success('Password updated successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setLoading(false);
      const msg = err.message || 'Failed to update password';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-white via-slate-50 to-blue-50/20 text-slate-900 flex items-center justify-center p-4">
      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/60 to-cyan-50/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-gradient-to-tl from-indigo-100/50 to-blue-50/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-8 shadow-2xl shadow-blue-500/10">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 font-bold border border-blue-100 shadow-xs">
            <Lock size={22} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Set New Password</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Please choose a strong password for your CareerFit AI account.
          </p>
        </div>

        {isSuccess ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-base font-bold text-emerald-900">Password Changed!</h3>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Your password has been successfully updated. Redirecting to login...
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 underline block mx-auto"
            >
              Click here if not redirected
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium">
                {error}
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Requirements */}
              <div className="mt-2.5 p-3 bg-slate-50/90 border border-slate-200/80 rounded-xl space-y-1.5 text-[11px]">
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                  Password Requirements
                </p>
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
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full bg-white border ${confirmPassword && !isMatch ? 'border-rose-400' : 'border-slate-200'} rounded-xl pl-4 pr-12 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && !isMatch && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">Passwords do not match</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isMatch || !hasMinLength || !hasUppercase || !hasLowercase || !hasSpecialChar}
              className="mt-3 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-bold text-sm tracking-wide hover:brightness-105 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full text-xs text-slate-500 hover:text-slate-800 font-semibold text-center transition-colors pt-2 block"
            >
              ← Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
