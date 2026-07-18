import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LandingPage } from './pages/LandingPage';
import { AuthPages } from './pages/AuthPages';
import { SeekerDashboard } from './pages/SeekerDashboard';
import { PosterDashboard } from './pages/PosterDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProfileSettings } from './pages/ProfileSettings';
import { Loader2, ShieldAlert, X } from 'lucide-react';

const QuickShiftRouter: React.FC = () => {
  const { user, profile, loading, toast, hideToast } = useApp();
  const [currentPage, setCurrentPage] = useState<string>('landing');

  // Handle auto redirection when user/profile changes
  useEffect(() => {
    if (!loading) {
      if (user) {
        if (profile) {
          if (profile.isBlocked) {
            setCurrentPage('blocked');
          } else if (currentPage === 'landing' || currentPage === 'login' || currentPage === 'signup-seeker' || currentPage === 'signup-poster' || currentPage === 'forgot' || currentPage === 'complete-profile') {
            // Send to respective dashboards
            if (profile.role === 'admin') setCurrentPage('admin');
            else if (profile.role === 'seeker') setCurrentPage('seeker');
            else if (profile.role === 'poster') setCurrentPage('poster');
          }
        } else {
          // Logged in but profile is null!
          setCurrentPage('complete-profile');
        }
      } else if (!user) {
        // If logged out and on protected page, redirect to landing
        if (currentPage === 'seeker' || currentPage === 'poster' || currentPage === 'admin' || currentPage === 'profile' || currentPage === 'blocked' || currentPage === 'complete-profile') {
          setCurrentPage('landing');
        }
      }
    }
  }, [user, profile, loading, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <Loader2 className="animate-spin h-10 w-10 text-emerald-600 mb-4" />
        <p className="text-sm font-semibold text-slate-600">Loading QuickShift...</p>
      </div>
    );
  }

  // Render Page Content
  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={setCurrentPage} />;
      
      case 'login':
        return <AuthPages mode="login" onNavigate={setCurrentPage} />;
      case 'signup-seeker':
        return <AuthPages mode="signup-seeker" onNavigate={setCurrentPage} />;
      case 'signup-poster':
        return <AuthPages mode="signup-poster" onNavigate={setCurrentPage} />;
      case 'forgot':
        return <AuthPages mode="forgot" onNavigate={setCurrentPage} />;
      case 'complete-profile':
        return <AuthPages mode="complete-profile" onNavigate={setCurrentPage} />;

      case 'seeker':
        if (!user || profile?.role !== 'seeker') return <Unauthorized onNavigate={setCurrentPage} />;
        return <SeekerDashboard onNavigate={setCurrentPage} />;
      
      case 'poster':
        if (!user || profile?.role !== 'poster') return <Unauthorized onNavigate={setCurrentPage} />;
        return <PosterDashboard onNavigate={setCurrentPage} />;
      
      case 'admin':
        if (!user || profile?.role !== 'admin') return <Unauthorized onNavigate={setCurrentPage} />;
        return <AdminDashboard />;
      
      case 'profile':
        if (!user) return <Unauthorized onNavigate={setCurrentPage} />;
        return <ProfileSettings onNavigate={setCurrentPage} />;

      case 'blocked':
        return <BlockedScreen />;

      default:
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="relative">
      {renderPage()}

      {/* Floating Alert / Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4 animate-bounce">
          <div className={`p-4 rounded-2xl shadow-xl flex items-start justify-between border ${
            toast.type === 'success' 
              ? 'bg-emerald-600 text-white border-emerald-500' 
              : 'bg-red-600 text-white border-red-500'
          }`}>
            <span className="text-xs font-semibold leading-relaxed text-left mr-3">{toast.message}</span>
            <button 
              onClick={hideToast}
              className="p-1 hover:bg-black/10 rounded-lg shrink-0 text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// BLOCK SCREEN COMPONENT
const BlockedScreen: React.FC = () => {
  const { logout } = useApp();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center font-sans">
      <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-8 max-w-md space-y-6">
        <div className="bg-red-100 text-red-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Account Suspended</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Your QuickShift account has been restricted by an administrator due to a violation of our community standards or Terms of Service. If you believe this is an error, please contact support.
        </p>
        <button
          onClick={logout}
          className="w-full py-3 bg-slate-950 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-xs transition"
        >
          Exit Platform
        </button>
      </div>
    </div>
  );
};

// UNAUTHORIZED REDIRECT
const Unauthorized: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center font-sans">
      <div className="bg-white border border-slate-200 shadow-md rounded-2xl p-8 max-w-sm space-y-4">
        <div className="bg-amber-100 text-amber-600 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-500">
          You are not authorized to view this page. Please sign in with an account holding appropriate credentials.
        </p>
        <button
          onClick={() => onNavigate('landing')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <QuickShiftRouter />
    </AppProvider>
  );
}
