import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  searchJobs, 
  createApplication, 
  getSeekerApplications, 
  deleteApplication, 
  SearchFilters 
} from '../lib/db';
import { Job, JobApplication } from '../types';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Briefcase, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Phone, 
  User, 
  ArrowRight, 
  X, 
  Clock, 
  XCircle, 
  RefreshCw,
  Bell,
  AlertCircle
} from 'lucide-react';
import { districtsOfSriLanka, jobCategories } from '../lib/translations';

interface SeekerDashboardProps {
  onNavigate: (page: string) => void;
}

export const SeekerDashboard: React.FC<SeekerDashboardProps> = ({ onNavigate }) => {
  const { t, user, profile, logout, showToast, notifications, unreadNotificationsCount, markAsRead } = useApp();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'browse' | 'applications' | 'notifications'>('browse');

  // Search Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minRate, setMinRate] = useState<number | undefined>(undefined);
  const [maxRate, setMaxRate] = useState<number | undefined>(undefined);
  const [sortByRate, setSortByRate] = useState<boolean>(false);

  // Data Loading States
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  // Selected Job for Details Modal
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [submittingApp, setSubmittingApp] = useState(false);

  // Fetch Jobs
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const filters: SearchFilters = {
        searchTerm: searchTerm.trim() || undefined,
        district: selectedDistrict || undefined,
        category: selectedCategory || undefined,
        minRate,
        maxRate
      };
      const result = await searchJobs(filters);
      
      let finalJobs = result.jobs;
      if (sortByRate) {
        finalJobs = [...finalJobs].sort((a, b) => b.hourlyRate - a.hourlyRate);
      }
      
      setJobs(finalJobs);
      setIsFallback(result.isFallback);
    } catch (err) {
      showToast("Error loading jobs.", "error");
    } finally {
      setLoadingJobs(false);
    }
  };

  // Fetch Seeker Applications
  const fetchApplications = async () => {
    if (!user) return;
    setLoadingApps(true);
    try {
      const apps = await getSeekerApplications(user.uid);
      setMyApplications(apps);
    } catch (err) {
      showToast("Error loading your applications.", "error");
    } finally {
      setLoadingApps(false);
    }
  };

  // Initial loads
  useEffect(() => {
    fetchJobs();
  }, [selectedDistrict, selectedCategory, minRate, maxRate, sortByRate]);

  useEffect(() => {
    if (user?.uid) {
      fetchApplications();
    }
  }, [activeTab, user?.uid]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDistrict('');
    setSelectedCategory('');
    setMinRate(undefined);
    setMaxRate(undefined);
    setSortByRate(false);
  };

  // Apply for Job
  const handleApply = async (job: Job) => {
    if (!user || profile?.verificationStatus !== 'verified') {
      if (profile?.verificationStatus !== 'verified') {
        showToast("Your account must be verified by an admin to apply.", "error");
      }
      return;
    }
    
    // Check if already applied
    const alreadyApplied = myApplications.some(app => app.jobId === job.id);
    if (alreadyApplied) {
      showToast("You have already applied for this shift.", "error");
      return;
    }

    setSubmittingApp(true);
    try {
      await createApplication(job.id, user.uid, job.posterId);
      showToast("Application submitted successfully!");
      // Reload applications
      await fetchApplications();
      // Close modal
      setSelectedJob(null);
    } catch (err) {
      showToast("Could not submit application.", "error");
    } finally {
      setSubmittingApp(false);
    }
  };

  // Withdraw Application
  const handleWithdraw = async (appId: string) => {
    if (!window.confirm("Are you sure you want to withdraw this application?")) return;
    try {
      await deleteApplication(appId);
      showToast("Application withdrawn.");
      await fetchApplications();
    } catch (err) {
      showToast("Could not withdraw application.", "error");
    }
  };

  // Check Application status for the currently selected job details modal
  const getJobApplicationStatus = (jobId: string): JobApplication | undefined => {
    return myApplications.find(app => app.jobId === jobId);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-16 md:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-sm">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">{t('brand')}</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Profile Link */}
            <button
              onClick={() => onNavigate('profile')}
              className="p-2 text-slate-500 hover:text-slate-800 transition rounded-lg hover:bg-slate-100"
              title={t('profile')}
            >
              <User className="h-5 w-5" />
            </button>
            <button
              onClick={logout}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:block w-64 shrink-0 space-y-2">
          <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs text-left">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Menu</h3>
            <div className="space-y-1">
              <button
                onClick={() => { setActiveTab('browse'); fetchJobs(); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition ${
                  activeTab === 'browse'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Briefcase className="h-4.5 w-4.5" />
                <span>{t('browseJobs')}</span>
              </button>
              <button
                onClick={() => { setActiveTab('applications'); fetchApplications(); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition ${
                  activeTab === 'applications'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Clock className="h-4.5 w-4.5" />
                <span>{t('myApplications')}</span>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm transition ${
                  activeTab === 'notifications'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Bell className="h-4.5 w-4.5" />
                  <span>Notifications</span>
                </div>
                {unreadNotificationsCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs text-left space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Summary</h4>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Applied</p>
                <p className="text-xl font-extrabold text-slate-800">{myApplications.length}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <p className="text-[10px] text-emerald-600 uppercase font-bold">Accepted</p>
                <p className="text-xl font-extrabold text-emerald-800">
                  {myApplications.filter(a => a.status === 'accepted').length}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Primary Content Area */}
        <main className="flex-1 min-w-0">
          
          {/* 1. BROWSE JOBS TAB */}
          {activeTab === 'browse' && (
            <div className="space-y-6">
              
              {/* Search & Advanced Filters Panel */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-4">
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t('searchPlaceholders')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 rounded-xl text-sm font-semibold transition cursor-pointer"
                  >
                    {t('searchBtn')}
                  </button>
                </form>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
                  {/* District Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t('districtLabel')}</label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    >
                      <option value="">{t('allDistricts')}</option>
                      {districtsOfSriLanka.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t('categoryLabel')}</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    >
                      <option value="">{t('allCategories')}</option>
                      {jobCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Min Rate */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t('minRate')}</label>
                    <input
                      type="number"
                      value={minRate || ''}
                      onChange={(e) => setMinRate(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="E.g. 500"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  {/* Sort Preference */}
                  <div className="flex items-end pb-1.5">
                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sortByRate}
                        onChange={(e) => setSortByRate(e.target.checked)}
                        className="rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Highest Rate First</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">
                    {jobs.length} approved shifts found
                  </span>
                  <button
                    onClick={handleClearFilters}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Fallback Notice */}
              {isFallback && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-left">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">
                      {t('showingNearby')} "{selectedDistrict}"
                    </p>
                    <p className="text-xs text-amber-700">
                      No exact matches found for your place name search. We are showing other active shifts in the same district instead.
                    </p>
                  </div>
                </div>
              )}

              {/* Jobs List Grid */}
              {loadingJobs ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                  <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold">{t('noJobsFound')}</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {jobs.map((job) => {
                    const alreadyApplied = myApplications.some(app => app.jobId === job.id);
                    const appStatus = getJobApplicationStatus(job.id)?.status;
                    
                    return (
                      <div 
                        key={job.id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-400 hover:shadow-xs transition duration-150 flex flex-col justify-between text-left relative"
                      >
                        {/* Status badge if already applied */}
                        {alreadyApplied && (
                          <span className={`absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                            appStatus === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                            appStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {appStatus === 'accepted' ? t('accepted') :
                             appStatus === 'rejected' ? t('rejected') : t('applied')}
                          </span>
                        )}

                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                              {job.category}
                            </span>
                            <h3 className="font-bold text-base text-slate-900 mt-2 line-clamp-1">{job.title}</h3>
                          </div>

                          <div className="space-y-1.5 text-xs text-slate-500">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{job.city}, {job.district}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="font-bold text-slate-700">Rs. {job.hourlyRate.toLocaleString()} / hour</span>
                            </div>
                            {job.estimatedDuration && (
                              <div className="flex items-center space-x-2">
                                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span>{job.estimatedDuration}</span>
                              </div>
                            )}
                          </div>

                          <p className="text-slate-600 text-xs line-clamp-2 mt-2 leading-relaxed">
                            {job.description}
                          </p>
                        </div>

                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            Posted {job.createdAt ? new Date(job.createdAt.seconds * 1000).toLocaleDateString() : 'recently'}
                          </span>
                          <button
                            onClick={() => {
                              // Ensure myApplications is loaded
                              if (myApplications.length === 0) {
                                fetchApplications();
                              }
                              setSelectedJob(job);
                            }}
                            className="inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                          >
                            <span>View Details</span>
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. MY APPLICATIONS TAB */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('myApplications')}</h2>
                <button
                  onClick={fetchApplications}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  title="Reload Applications"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {loadingApps ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
                </div>
              ) : myApplications.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                  <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold">You haven't applied for any shifts yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Browse active shifts and apply in one click.</p>
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="mt-4 inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl cursor-pointer"
                  >
                    Browse Shifts
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  {myApplications.map((app) => (
                    <div 
                      key={app.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-slate-300 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                            {app.jobCategory}
                          </span>
                          <span className="text-xs text-slate-400">
                            Applied {app.appliedAt ? new Date(app.appliedAt.seconds * 1000).toLocaleDateString() : 'recently'}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900">{app.jobTitle}</h3>
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{app.jobCity}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="font-bold text-slate-700">Rs. {app.jobHourlyRate?.toLocaleString()} / hr</span>
                          </div>
                        </div>
                      </div>

                      {/* Right actions and status */}
                      <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-150">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                          app.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {app.status === 'accepted' ? t('accepted') :
                           app.status === 'rejected' ? t('rejected') : t('applied')}
                        </span>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              // Load the job object first, then open modal
                              const matchingJob = jobs.find(j => j.id === app.jobId);
                              if (matchingJob) {
                                setSelectedJob(matchingJob);
                              } else {
                                // Fallback loading details
                                showToast("Click details on main listing to review status and contact details.");
                              }
                            }}
                            className="bg-slate-50 text-slate-600 hover:bg-slate-150 text-xs px-3 py-2 rounded-xl font-bold transition cursor-pointer"
                          >
                            Details
                          </button>
                          
                          {app.status === 'applied' && (
                            <button
                              onClick={() => handleWithdraw(app.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-3 py-2 rounded-xl font-bold transition cursor-pointer"
                            >
                              {t('withdraw')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">In-App Notifications</h2>
              </div>

              {notifications.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                  <Bell className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold">No notifications yet.</p>
                </div>
              ) : (
                <div className="space-y-3 text-left">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-4 border rounded-2xl transition-all ${
                        notif.isRead 
                          ? 'bg-white border-slate-200' 
                          : 'bg-emerald-50/50 border-emerald-200 shadow-3xs'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{notif.title}</h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-2 block">
                            {notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : 'just now'}
                          </span>
                        </div>
                        {!notif.isRead && (
                          <button 
                            onClick={() => notif.id && markAsRead(notif.id)}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-white border border-emerald-100 px-2 py-1 rounded-md"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* JOB DETAILS MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-xl text-left">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-150 flex justify-between items-start bg-slate-50 rounded-t-2xl">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {selectedJob.category}
                </span>
                <h3 className="font-bold text-lg text-slate-900 mt-1">{selectedJob.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedJob(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-5">
              
              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-100 rounded-xl">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Hourly Rate</p>
                  <p className="text-base font-extrabold text-emerald-600">Rs. {selectedJob.hourlyRate.toLocaleString()} / hr</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Estimated Duration</p>
                  <p className="text-sm font-semibold text-slate-700">{selectedJob.estimatedDuration || 'Not Specified'}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('jobDesc')}</h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{selectedJob.description}</p>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">General Area</h4>
                <div className="flex items-center space-x-2 text-xs font-medium text-slate-700">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{selectedJob.city}, {selectedJob.district} District</span>
                </div>
              </div>

              {/* REVEAL SENSITIVE CONTENT ONCE ACCEPTED */}
              {(() => {
                const app = getJobApplicationStatus(selectedJob.id);
                if (app && app.status === 'accepted') {
                  return (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs space-y-3">
                      <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <span>Application Accepted! Contact Info Unlocked</span>
                      </div>
                      
                      <div className="space-y-1 text-slate-700">
                        <p className="font-semibold text-slate-800">Work Address:</p>
                        <p className="leading-relaxed bg-white border border-emerald-100 p-2.5 rounded-lg font-medium">{selectedJob.address}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-emerald-100">
                        <div className="flex items-center space-x-2 text-emerald-800">
                          <Phone className="h-4 w-4 text-emerald-600" />
                          <span className="font-mono font-bold text-sm">{selectedJob.contactPhone}</span>
                        </div>
                        <a 
                          href={`tel:${selectedJob.contactPhone}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition"
                        >
                          Call Poster
                        </a>
                      </div>
                    </div>
                  );
                } else if (app) {
                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-500 font-medium">
                        {app.status === 'applied' 
                          ? "Application Pending. Exact address and phone contact will unlock here once the employer accepts your shift."
                          : "This application was not accepted by the employer."}
                      </p>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-500 font-medium">
                        Detailed address and contact phone number are locked for privacy. They will be shared immediately upon application approval.
                      </p>
                    </div>
                  );
                }
              })()}

            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-slate-150 bg-slate-50 rounded-b-2xl flex justify-end space-x-3">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl cursor-pointer"
              >
                Close
              </button>

              {(() => {
                const app = getJobApplicationStatus(selectedJob.id);
                if (!app) {
                  return (
                    <div className="flex items-center space-x-3 w-full justify-end">
                      {profile?.verificationStatus !== 'verified' && (
                        <div className="flex items-center text-amber-600 text-xs font-medium bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                          <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                          Account must be verified to apply
                        </div>
                      )}
                      <button
                        onClick={() => handleApply(selectedJob)}
                        disabled={submittingApp || profile?.verificationStatus !== 'verified'}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                      >
                        {submittingApp && <Loader2 className="animate-spin h-3 w-3 mr-1" />}
                        <span>{t('applyNow')}</span>
                      </button>
                    </div>
                  );
                } else if (app.status === 'applied') {
                  return (
                    <button
                      onClick={() => handleWithdraw(app.id)}
                      className="px-5 py-2 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-600 border border-red-200 rounded-xl cursor-pointer"
                    >
                      {t('withdraw')}
                    </button>
                  );
                }
                return null;
              })()}
            </div>

          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around z-40">
        <button
          onClick={() => { setActiveTab('browse'); fetchJobs(); }}
          className={`flex flex-col items-center space-y-1 text-[10px] font-bold ${
            activeTab === 'browse' ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          <Briefcase className="h-5 w-5" />
          <span>Browse</span>
        </button>
        <button
          onClick={() => { setActiveTab('applications'); fetchApplications(); }}
          className={`flex flex-col items-center space-y-1 text-[10px] font-bold relative ${
            activeTab === 'applications' ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          <Clock className="h-5 w-5" />
          <span>My Shifts</span>
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex flex-col items-center space-y-1 text-[10px] font-bold relative ${
            activeTab === 'notifications' ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          <Bell className="h-5 w-5" />
          <span>Notifs</span>
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-0 right-3 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-extrabold">
              {unreadNotificationsCount}
            </span>
          )}
        </button>
      </div>

    </div>
  );
};
