import React from 'react';
import { useApp } from '../context/AppContext';
import { Briefcase, Search, ArrowRight, UserCheck, PlusCircle, CheckCircle, Shield, Phone, MapPin } from 'lucide-react';
import { jobCategories } from '../lib/translations';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { t, lang, setLang, user, profile } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Bar / Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-sm flex items-center justify-center">
              <Briefcase className="h-6 w-6" />
            </div>
            <span className="font-sans font-bold text-xl tracking-tight text-slate-900">{t('brand')}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  lang === 'en'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('si')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  lang === 'si'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                සිංහල
              </button>
            </div>

            {user ? (
              <button
                onClick={() => {
                  if (profile?.role === 'admin') onNavigate('admin');
                  else if (profile?.role === 'seeker') onNavigate('seeker');
                  else if (profile?.role === 'poster') onNavigate('poster');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition duration-150 cursor-pointer shadow-sm"
              >
                {t('backToDashboard')}
              </button>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition duration-150 cursor-pointer shadow-sm"
              >
                {t('login')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-white py-12 md:py-20 border-b border-slate-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                <span>🇱🇰</span>
                <span>Sri Lanka's On-Demand Shifts Platform</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {t('tagline')}
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl">
                {t('desc')}
              </p>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
                <button
                  onClick={() => {
                    if (user) {
                      onNavigate(profile?.role === 'seeker' ? 'seeker' : 'landing');
                    } else {
                      onNavigate('signup-seeker');
                    }
                  }}
                  className="inline-flex items-center justify-center px-6 py-3.5 border border-transparent text-base font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition duration-150 cursor-pointer group"
                >
                  <UserCheck className="mr-2 h-5 w-5" />
                  {t('findWork')}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => {
                    if (user) {
                      onNavigate(profile?.role === 'poster' ? 'poster' : 'landing');
                    } else {
                      onNavigate('signup-poster');
                    }
                  }}
                  className="inline-flex items-center justify-center px-6 py-3.5 border border-slate-200 text-base font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 shadow-xs hover:border-slate-300 transition duration-150 cursor-pointer"
                >
                  <PlusCircle className="mr-2 h-5 w-5 text-slate-500" />
                  {t('postJob')}
                </button>
              </div>
            </div>

            {/* Visual Panel Right */}
            <div className="mt-12 lg:mt-0 lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-md">
                <div className="absolute -top-4 -left-4 bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-xs">
                  Active Shifts Now
                </div>
                
                <h3 className="font-semibold text-slate-700 mb-4 text-sm tracking-wide uppercase">Popular Shifts Categories</h3>
                <div className="space-y-3">
                  {jobCategories.slice(0, 5).map((cat, idx) => {
                    const icons = [CheckCircle, CheckCircle, CheckCircle, CheckCircle, CheckCircle];
                    const IconComp = icons[idx] || CheckCircle;
                    const lkrRates = ["Rs. 800/hr", "Rs. 650/hr", "Rs. 1,200/hr", "Rs. 500/hr", "Rs. 750/hr"];
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-2xs hover:border-emerald-300 transition-all">
                        <div className="flex items-center space-x-3">
                          <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
                            <IconComp className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-sm text-slate-800">{cat}</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                          {lkrRates[idx]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Features Bento Grid */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Why Sri Lankan Campus Students and Shops Trust QuickShift
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">
              We replace unreliable, crowded WhatsApp groups with a verified, secure marketplace.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-left space-y-4">
              <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl w-12 h-12 flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Admin Approved Postings</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Every job post goes through a strict manual review queue by our administrators to prevent scams, underpaid rates, or spam.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-left space-y-4">
              <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl w-12 h-12 flex items-center justify-center">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Safe Contact Sharing</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Job seekers only receive contact phone numbers and full addresses once the job poster explicitly reviews and accepts their application.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-left space-y-4">
              <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl w-12 h-12 flex items-center justify-center">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Simple Text-Based Search</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Filter shifts by entering any Sri Lankan town name (e.g., Nugegoda, Malabe, Kurunegala). No slow, expensive maps required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg text-white">{t('brand')}</span>
          </div>
          <p className="text-xs">
            &copy; 2026 QuickShift Sri Lanka. Built for high reliability & fast connection. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
