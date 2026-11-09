import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, Sparkles, AlertCircle, ShoppingBag, Info, X } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, setCurrentView, authModalMessage, setAuthModalMessage, settings } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic frontend validation
    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      if (setAuthModalMessage) setAuthModalMessage(null);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#FAF7F2]">
      <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-md sm:shadow-lg p-6 sm:p-9 space-y-6">
          
          {/* Brand & Heading */}
          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="inline-flex items-center gap-2 group cursor-pointer focus:outline-none"
            >
              <span className="text-2xl leading-none group-hover:scale-110 transition duration-200">🍰</span>
              <span className="font-serif text-lg font-bold tracking-wider text-[#762F3D] uppercase">
                {settings.bakeryName || 'The Cake House'}
              </span>
            </button>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#302725] tracking-tight">
              Welcome Back!
            </h1>
            <p className="text-xs sm:text-sm text-[#80736F] max-w-xs mx-auto leading-relaxed">
              Sign in to manage orders, track bespoke cakes, and enjoy fast checkout.
            </p>
          </div>

          {/* Prompt banner from protected route / checkout action */}
          {authModalMessage && (
            <div className="p-3.5 bg-[#FAF3EC] border border-[#E8D6C6] rounded-2xl text-[#762F3D] text-xs font-medium leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#C5A46D]" />
              <span className="flex-1">{authModalMessage}</span>
              <button
                type="button"
                onClick={() => setAuthModalMessage && setAuthModalMessage(null)}
                className="text-[#80736F] hover:text-[#762F3D] p-0.5"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Inline Error Message */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1 font-medium">{error}</div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-700 p-0.5"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Forgot Password Notice */}
          {showForgotNotice && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="flex-1 leading-relaxed">
                To reset your password, please contact our team at{' '}
                <a href="mailto:support@thecakehouse.pk" className="font-bold underline text-[#762F3D]">
                  support@thecakehouse.pk
                </a>{' '}
                or call{' '}
                <strong className="text-[#762F3D]">+92 42 35712345</strong>.
              </div>
              <button
                type="button"
                onClick={() => setShowForgotNotice(false)}
                className="text-amber-500 hover:text-amber-800 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            
            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-[#302725] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#80736F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm font-medium text-[#302725] placeholder:text-[#A09590] focus:outline-none focus:border-[#762F3D] focus:ring-1 focus:ring-[#762F3D]/20 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#302725]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotNotice(true)}
                  className="text-[11px] font-semibold text-[#762F3D] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#80736F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-10 pr-11 py-3 text-xs sm:text-sm font-medium text-[#302725] placeholder:text-[#A09590] focus:outline-none focus:border-[#762F3D] focus:ring-1 focus:ring-[#762F3D]/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#80736F] hover:text-[#762F3D] p-1 rounded-md transition cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#762F3D] hover:bg-[#5F2030] disabled:bg-[#A09590] disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              </button>
            </div>

          </form>

          {/* Simple Link to Dedicated Registration Page */}
          <div className="text-center pt-2 border-t border-[#E8E0D9]/70 text-xs text-[#80736F]">
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={() => setCurrentView('register')}
              className="font-bold text-[#762F3D] hover:underline cursor-pointer transition"
            >
              Create one
            </button>
          </div>

        </div>

        {/* Subtle Back to Shopping Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setCurrentView('products')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#80736F] hover:text-[#762F3D] py-1.5 px-3 rounded-lg hover:bg-black/5 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Shopping</span>
          </button>
        </div>

      </div>
    </div>
  );
};
