import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { updateUserProfile } from '../lib/db';
import { Briefcase, ArrowLeft, User, Phone, Mail, Building, Check, Loader2 } from 'lucide-react';
import { jobCategories } from '../lib/translations';
import { VerifiedBadge } from '../components/VerifiedBadge';

interface ProfileSettingsProps {
  onNavigate: (page: string) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onNavigate }) => {
  const { t, user, profile, showToast } = useApp();

  if (!profile) return null;

  // Form Fields
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone);
  const [businessName, setBusinessName] = useState(profile.businessName || '');
  const [selectedCats, setSelectedCats] = useState<string[]>(profile.preferredCategories || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleCategoryToggle = (cat: string) => {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) {
      showToast("Full Name and Phone Number are required.", "error");
      return;
    }

    // Sri Lanka phone must be 10 digits
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) {
      showToast(t('phoneLengthErr'), "error");
      return;
    }

    setIsSaving(true);
    try {
      const updates: any = {
        fullName,
        phone: cleanPhone,
        ...(profile.role === 'seeker' ? { preferredCategories: selectedCats } : {}),
        ...(profile.role === 'poster' ? { businessName: businessName || null } : {})
      };

      await updateUserProfile(profile.uid, updates);
      showToast(t('saveProfileSuccess'), 'success');
      
      // Go back to respective dashboard
      if (profile.role === 'admin') onNavigate('admin');
      else if (profile.role === 'seeker') onNavigate('seeker');
      else if (profile.role === 'poster') onNavigate('poster');
    } catch (err) {
      showToast("Failed to update profile.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (profile.role === 'admin') onNavigate('admin');
    else if (profile.role === 'seeker') onNavigate('seeker');
    else if (profile.role === 'poster') onNavigate('poster');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-left">
        <button
          onClick={handleBack}
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6 cursor-pointer"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t('backToDashboard')}
        </button>

        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('profile')}
          </h2>
          <VerifiedBadge status={profile.verificationStatus} showText className="mt-1" />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Review and update your public profile and categories
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md text-left">
        <div className="bg-white py-8 px-4 border border-slate-200 shadow-md rounded-2xl sm:px-10">
          <form onSubmit={handleSave} className="space-y-5">
            {/* EMAIL (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-slate-500">
                {t('email')} (Linked Account)
              </label>
              <div className="mt-1 relative rounded-md shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            {/* FULL NAME */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                {t('fullName')} *
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
                  placeholder="Shanaka Perera"
                />
              </div>
            </div>

            {/* PHONE */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                {t('phone')} *
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
                  placeholder="0771234567"
                />
              </div>
            </div>

            {/* BUSINESS NAME (POSTER ONLY) */}
            {profile.role === 'poster' && (
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
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 text-sm"
                    placeholder="E.g. Perera Bakers"
                  />
                </div>
              </div>
            )}

            {/* PREFERRED CATEGORIES (SEEKER ONLY) */}
            {profile.role === 'seeker' && (
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

            {/* BUTTONS */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-150">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                {isSaving && <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
