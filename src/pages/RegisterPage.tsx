import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User as UserIcon, Mail, Phone, MapPin, Lock, Eye, EyeOff, ArrowLeft, Loader2, Sparkles, AlertCircle, X } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register, setCurrentView, authModalMessage, setAuthModalMessage, settings } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend validations
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!phone.trim()) {
      setError('Please enter a contact phone number.');
      return;
    }

    if (!address.trim()) {
      setError('Please provide a delivery address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: address.trim(),
        password
      });
      if (setAuthModalMessage) setAuthModalMessage(null);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#FAF7F2]">
      <div className="w-full max-w-lg mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
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
              Create Your Account
            </h1>
            <p className="text-xs sm:text-sm text-[#80736F] max-w-sm mx-auto leading-relaxed">
              Join {settings.bakeryName || 'The Cake House'} for expedited checkout, bespoke custom cake orders, and order tracking.
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

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#302725] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#80736F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ayesha Khan"
                  autoComplete="name"
                  required
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm font-medium text-[#302725] placeholder:text-[#A09590] focus:outline-none focus:border-[#762F3D] focus:ring-1 focus:ring-[#762F3D]/20 transition"
                />
              </div>
            </div>

            {/* Email Address & Phone Number in Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-xs font-semibold text-[#302725] mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#80736F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+92 312 9876543"
                    autoComplete="tel"
                    required
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm font-medium text-[#302725] placeholder:text-[#A09590] focus:outline-none focus:border-[#762F3D] focus:ring-1 focus:ring-[#762F3D]/20 transition"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <label className="block text-xs font-semibold text-[#302725] mb-1.5">
                Delivery Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#80736F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. House #14, Street 5, Gulberg III, Lahore"
                  autoComplete="street-address"
                  required
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm font-medium text-[#302725] placeholder:text-[#A09590] focus:outline-none focus:border-[#762F3D] focus:ring-1 focus:ring-[#762F3D]/20 transition"
                />
              </div>
            </div>

            {/* Password & Confirm Password in Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#302725] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#80736F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
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

              <div>
                <label className="block text-xs font-semibold text-[#302725] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#80736F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    required
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-10 pr-11 py-3 text-xs sm:text-sm font-medium text-[#302725] placeholder:text-[#A09590] focus:outline-none focus:border-[#762F3D] focus:ring-1 focus:ring-[#762F3D]/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#80736F] hover:text-[#762F3D] p-1 rounded-md transition cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Primary Create Account Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#762F3D] hover:bg-[#5F2030] disabled:bg-[#A09590] disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              </button>
            </div>

          </form>

          {/* Simple Link to Dedicated Sign In Page */}
          <div className="text-center pt-2 border-t border-[#E8E0D9]/70 text-xs text-[#80736F]">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={() => setCurrentView('login')}
              className="font-bold text-[#762F3D] hover:underline cursor-pointer transition"
            >
              Sign in
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
