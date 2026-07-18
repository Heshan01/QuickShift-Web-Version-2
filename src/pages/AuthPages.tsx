import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Briefcase, Mail, Lock, Phone, User, Building, ArrowLeft, Loader2, Check } from 'lucide-react';
import { jobCategories, Language } from '../lib/translations';
import { createUserProfile, createNotification } from '../lib/db';
import { UserRole } from '../types';

interface AuthPagesProps {
  mode: 'login' | 'signup-seeker' | 'signup-poster' | 'forgot' | 'complete-profile';
  onNavigate: (page: string) => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({ mode, onNavigate }) => {
  const { t, login, signup, resetPassword, lang, setLang, user, logout } = useApp();

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>('seeker');
  
  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const getNormalizedPhone = (num: string) => {
    // Normalizes phone formats like +94 77 123 4567 or 771234567 to standard 0771234567
    let clean = num.replace(/[^0-9]/g, '');
    if (clean.startsWith('94') && clean.length === 11) {
      clean = '0' + clean.slice(2);
    } else if (clean.length === 9) {
      clean = '0' + clean;
    }
    return clean;
  };

  const validatePhone = (num: string) => {
    const cleanNum = getNormalizedPhone(num);
    return cleanNum.length === 10 && cleanNum.startsWith('0');
  };

  const validateNIC = (nic: string) => {
    return /^[0-9]{9}[vVxX]$/.test(nic) || /^[0-9]{12}$/.test(nic);
  };

  const handleCategoryToggle = (cat: string) => {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Form level validation
    const tempErrors: { [key: string]: string } = {};
    if (mode !== 'complete-profile' && !email) tempErrors.email = t('requiredErr');
    
    if (mode !== 'forgot' && mode !== 'complete-profile') {
      if (!password) tempErrors.password = t('requiredErr');
      else if (password.length < 6) tempErrors.password = "Password must be at least 6 characters";
    }

    if (mode === 'signup-seeker' || mode === 'signup-poster' || mode === 'complete-profile') {
      if (!fullName) tempErrors.fullName = t('requiredErr');
      if (!idNumber) tempErrors.idNumber = t('requiredErr');
      else if (!validateNIC(idNumber)) tempErrors.idNumber = "Invalid NIC format (e.g., 123456789V or 123456789012)";
      if (!phone) tempErrors.phone = t('requiredErr');
      else if (!validatePhone(phone)) tempErrors.phone = t('phoneLengthErr');
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedPhoneValue = getNormalizedPhone(phone);
      if (mode === 'login') {
        await login(email, password);
        // App.tsx router will handle navigation based on role automatically!
      } else if (mode === 'forgot') {
        await resetPassword(email);
        onNavigate('login');
      } else if (mode === 'signup-seeker') {
        await signup(email, password, 'seeker', fullName, idNumber, normalizedPhoneValue, {
          preferredCategories: selectedCats
        });
        // Will auto navigate via role redirect
      } else if (mode === 'signup-poster') {
        await signup(email, password, 'poster', fullName, idNumber, normalizedPhoneValue, {
          businessName: businessName || null
        });
        // Will auto navigate via role redirect
      } else if (mode === 'complete-profile') {
        if (!user) {
          onNavigate('login');
          return;
        }
        
        const newProfile = {
          role: selectedRole,
          fullName,
          idNumber,
          phone: normalizedPhoneValue,
          email: user.email || '',
          photoURL: null,
          isBlocked: false,
          verificationStatus: 'pending' as VerificationStatus,
          ...(selectedRole === 'seeker' ? { preferredCategories: selectedCats } : {}),
          ...(selectedRole === 'poster' ? { businessName: businessName || null } : {})
        };
        
        await createUserProfile(user.uid, newProfile);
        
        // Send welcome notification
        await createNotification(
          user.uid,
          `Welcome to QuickShift!`,
          `Thank you for joining QuickShift. Complete your profile details and explore part-time shifts!`,
          'general'
        );
      }
    } catch (err) {
      // Errors handled by toast in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return t('login');
      case 'signup-seeker': return `${t('signup')} (${t('findWork')})`;
      case 'signup-poster': return `${t('signup')} (${t('postJob')})`;
      case 'forgot': return t('forgotPassword');
      case 'complete-profile': return "Complete Your Profile";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Top Header */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center space-x-2 bg-white rounded-lg border border-slate-200 p-0.5">
        <button
          onClick={() => setLang('en')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            lang === 'en' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLang('si')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            lang === 'si' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          සිංහල
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand logo */}
        <div className="flex justify-center mb-4">
          <button 
            onClick={() => onNavigate('landing')}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-sm flex items-center justify-center">
              <Briefcase className="h-6 w-6" />
            </div>
            <span className="font-sans font-bold text-2xl tracking-tight text-slate-900">{t('brand')}</span>
          </button>
        </div>
        <h2 className="text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          {getTitle()}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-200 shadow-md rounded-2xl sm:px-10">
          
          {mode !== 'complete-profile' ? (
            <button
              onClick={() => onNavigate('landing')}
              className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 mb-6 cursor-pointer"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to home
            </button>
          ) : (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex flex-col space-y-1">
              <span className="font-semibold">Almost there!</span>
              <span>Your email is authenticated, but your profile needs to be completed to access the part-time job marketplace.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            {/* ROLE SELECTOR (COMPLETE-PROFILE ONLY) */}
            {mode === 'complete-profile' && (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Choose Your Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('seeker')}
                    className={`p-3 border rounded-xl text-center text-xs font-semibold cursor-pointer transition ${
                      selectedRole === 'seeker'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/10'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {t('imSeeker') || "Job Seeker"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('poster')}
                    className={`p-3 border rounded-xl text-center text-xs font-semibold cursor-pointer transition ${
                      selectedRole === 'poster'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/10'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {t('imPoster') || "Job Poster"}
                  </button>
                </div>
              </div>
            )}

            {/* FULL NAME */}
            {(mode === 'signup-seeker' || mode === 'signup-poster' || mode === 'complete-profile') && (
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  {t('fullName')}
                </label>
                <div className="mt-1 relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 text-sm"
                    placeholder="E.g. Shanaka Perera"
                  />
                </div>
                {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
              </div>
            )}

            {/* NATIONAL ID NUMBER */}
            {(mode === 'signup-seeker' || mode === 'signup-poster' || mode === 'complete-profile') && (
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  National ID (NIC) Number
                </label>
                <div className="mt-1 relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 text-sm"
                    placeholder="E.g. 123456789V or 123456789012"
                  />
                </div>
                {errors.idNumber && <p className="mt-1 text-xs text-red-500">{errors.idNumber}</p>}
              </div>
            )}

            {/* EMAIL */}
            {mode !== 'complete-profile' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  {t('email')}
                </label>
                <div className="mt-1 relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 text-sm"
                    placeholder="name@gmail.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>
            )}

            {/* PHONE NUMBER */}
            {(mode === 'signup-seeker' || mode === 'signup-poster' || mode === 'complete-profile') && (
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  {t('phone')}
                </label>
                <div className="mt-1 relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 text-sm"
                    placeholder="E.g. 0771234567"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              </div>
            )}

            {/* BUSINESS NAME (POSTER ONLY OR COMPLETE-PROFILE POSTER) */}
            {(mode === 'signup-poster' || (mode === 'complete-profile' && selectedRole === 'poster')) && (
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  {t('businessName')}
                </label>
                <div className="mt-1 relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 text-sm"
                    placeholder="E.g. Perera Bakers or Personal Poster"
                  />
                </div>
              </div>
            )}

            {/* PREFERRED CATEGORIES (SEEKER ONLY OR COMPLETE-PROFILE SEEKER) */}
            {(mode === 'signup-seeker' || (mode === 'complete-profile' && selectedRole === 'seeker')) && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t('preferredCategories')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {jobCategories.map((cat) => {
                    const isSelected = selectedCats.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryToggle(cat)}
                        className={`flex items-center justify-between p-2.5 border rounded-xl text-left text-xs font-medium cursor-pointer transition duration-100 ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PASSWORD */}
            {mode !== 'forgot' && mode !== 'complete-profile' && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-700">
                    {t('password')}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => onNavigate('forgot')}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    >
                      {t('forgotPassword')}
                    </button>
                  )}
                </div>
                <div className="mt-1 relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 text-sm"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    {t('submitting')}
                  </>
                ) : (
                  getTitle()
                )}
              </button>
            </div>
          </form>

          {/* Bottom links to toggle */}
          <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm">
            {mode === 'complete-profile' ? (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await logout();
                    onNavigate('landing');
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="text-red-600 hover:text-red-700 font-bold cursor-pointer text-xs"
              >
                Cancel & Log Out
              </button>
            ) : mode === 'login' ? (
              <div className="space-y-3">
                <p className="text-slate-500">
                  {t('noAccount')}
                </p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-center">
                  <button
                    onClick={() => onNavigate('signup-seeker')}
                    className="text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer text-xs"
                  >
                    {t('imSeeker')}
                  </button>
                  <span className="hidden sm:inline text-slate-300">|</span>
                  <button
                    onClick={() => onNavigate('signup-poster')}
                    className="text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer text-xs"
                  >
                    {t('imPoster')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
              >
                {t('haveAccount')}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
