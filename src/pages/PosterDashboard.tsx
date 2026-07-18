import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  createJob, 
  getPosterJobs, 
  updateJob, 
  deleteJob, 
  getJobApplications, 
  updateApplicationStatus 
} from '../lib/db';
import { Job, JobApplication } from '../types';
import { 
  PlusCircle, 
  Briefcase, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  DollarSign, 
  AlertTriangle, 
  Loader2, 
  User, 
  Phone, 
  Trash2, 
  Edit, 
  X, 
  RefreshCw,
  Bell,
  AlertCircle
} from 'lucide-react';
import { districtsOfSriLanka, jobCategories } from '../lib/translations';

interface PosterDashboardProps {
  onNavigate: (page: string) => void;
}

export const PosterDashboard: React.FC<PosterDashboardProps> = ({ onNavigate }) => {
  const { t, user, profile, logout, showToast, notifications, unreadNotificationsCount, markAsRead } = useApp();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'my-jobs' | 'post-job' | 'notifications'>('my-jobs');

  // Jobs data
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Manage Applicants
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<JobApplication[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // Edit Job State
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Form Fields State (Post/Edit)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number | ''>('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [category, setCategory] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Load poster's jobs
  const fetchJobs = async () => {
    if (!user) return;
    setLoadingJobs(true);
    try {
      const data = await getPosterJobs(user.uid);
      setJobs(data);
    } catch (err) {
      showToast("Could not load your job posts.", "error");
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user?.uid]);

  // Handle Post Job
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title || !description || !hourlyRate || !category || !contactPhone || !district || !city || !address) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    if (Number(hourlyRate) <= 0) {
      showToast("Hourly rate must be a positive number.", "error");
      return;
    }

    setIsSubmittingForm(true);
    try {
      const jobPayload = {
        posterId: user.uid,
        posterName: profile?.fullName || "Employer",
        title,
        description,
        hourlyRate: Number(hourlyRate),
        estimatedDuration: estimatedDuration || null,
        category,
        contactPhone,
        district,
        city,
        address,
        photoURL: null,
        status: 'pending' as const,
        rejectionReason: null
      };

      if (editingJob) {
        // Update
        await updateJob(editingJob.id, jobPayload);
        showToast("Job post updated successfully! Re-submitted for approval.");
        setEditingJob(null);
      } else {
        // Create
        await createJob(jobPayload);
        showToast("Job posted successfully! Awaiting administrator approval.");
      }

      // Reset form
      resetForm();
      setActiveTab('my-jobs');
      fetchJobs();
    } catch (err) {
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setHourlyRate('');
    setEstimatedDuration('');
    setCategory('');
    setContactPhone(profile?.phone || '');
    setDistrict('');
    setCity('');
    setAddress('');
  };

  // Trigger Edit mode
  const handleStartEdit = (job: Job) => {
    setEditingJob(job);
    setTitle(job.title);
    setDescription(job.description);
    setHourlyRate(job.hourlyRate);
    setEstimatedDuration(job.estimatedDuration || '');
    setCategory(job.category);
    setContactPhone(job.contactPhone);
    setDistrict(job.district);
    setCity(job.city);
    setAddress(job.address);
    setActiveTab('post-job');
  };

  // Close / End Job
  const handleCloseJob = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to CLOSE this job? Seeker applications will stop.")) return;
    try {
      await updateJob(jobId, { status: 'closed' });
      showToast("Job marked as Closed.");
      fetchJobs();
    } catch (err) {
      showToast("Could not close job.", "error");
    }
  };

  // Delete Job
  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to permanently DELETE this job post?")) return;
    try {
      await deleteJob(jobId);
      showToast("Job post deleted.");
      fetchJobs();
    } catch (err) {
      showToast("Could not delete job.", "error");
    }
  };

  // View applicants for a job
  const handleViewApplicants = async (job: Job) => {
    setSelectedJobForApplicants(job);
    setLoadingApplicants(true);
    try {
      const apps = await getJobApplications(job.id, user?.uid);
      setApplicants(apps);
    } catch (err) {
      showToast("Could not load applications.", "error");
    } finally {
      setLoadingApplicants(false);
    }
  };

  // Accept Seeker
  const handleAcceptApplicant = async (appId: string) => {
    try {
      await updateApplicationStatus(appId, 'accepted');
      showToast("Applicant accepted. Contact info is shared!");
      // Reload applicants list
      if (selectedJobForApplicants) {
        handleViewApplicants(selectedJobForApplicants);
      }
    } catch (err) {
      showToast("Could not accept applicant.", "error");
    }
  };

  // Reject Seeker
  const handleRejectApplicant = async (appId: string) => {
    try {
      await updateApplicationStatus(appId, 'rejected');
      showToast("Applicant rejected.");
      if (selectedJobForApplicants) {
        handleViewApplicants(selectedJobForApplicants);
      }
    } catch (err) {
      showToast("Could not reject applicant.", "error");
    }
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

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 shrink-0 space-y-2 text-left">
          <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Employer Menu</h3>
            <div className="space-y-1">
              <button
                onClick={() => { setActiveTab('my-jobs'); fetchJobs(); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition ${
                  activeTab === 'my-jobs'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Briefcase className="h-4.5 w-4.5" />
                <span>{t('myJobPosts')}</span>
              </button>
              <button
                onClick={() => { resetForm(); setEditingJob(null); setActiveTab('post-job'); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition ${
                  activeTab === 'post-job'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <PlusCircle className="h-4.5 w-4.5" />
                <span>{editingJob ? "Edit Job Post" : t('postNewJob')}</span>
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

          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Poster Summary</h4>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Total Jobs</p>
                <p className="text-xl font-extrabold text-slate-800">{jobs.length}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <p className="text-[10px] text-emerald-600 uppercase font-bold">Approved</p>
                <p className="text-xl font-extrabold text-slate-800">
                  {jobs.filter(j => j.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Primary Content Panel */}
        <main className="flex-1 min-w-0">
          
          {/* TAB 1: MY JOB POSTS */}
          {activeTab === 'my-jobs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('myJobPosts')}</h2>
                <button
                  onClick={fetchJobs}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {loadingJobs ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                  <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold">You haven't posted any shifts yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Hire Sri Lankan student talent instantly for quick shifts.</p>
                  <button
                    onClick={() => setActiveTab('post-job')}
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
                  >
                    Post First Job
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  {jobs.map((job) => (
                    <div 
                      key={job.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 shadow-2xs transition flex flex-col md:flex-row justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {job.category}
                          </span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            job.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            job.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            job.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {job.status === 'approved' ? t('approved') :
                             job.status === 'pending' ? t('pending') :
                             job.status === 'rejected' ? t('rejected') : t('closed')}
                          </span>
                        </div>

                        <h3 className="font-bold text-lg text-slate-900">{job.title}</h3>
                        
                        <p className="text-slate-500 text-xs line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                          <span className="flex items-center">
                            <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" />
                            {job.city}, {job.district}
                          </span>
                          <span className="flex items-center font-bold text-slate-700">
                            <DollarSign className="h-3.5 w-3.5 mr-0.5 text-slate-400" />
                            Rs. {job.hourlyRate.toLocaleString()} / hr
                          </span>
                        </div>

                        {/* Rejection alert */}
                        {job.status === 'rejected' && job.rejectionReason && (
                          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-800 flex items-start space-x-2 mt-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                            <span><strong>Reason:</strong> {job.rejectionReason}</span>
                          </div>
                        )}
                      </div>

                      {/* Right Panel: Actions */}
                      <div className="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-150 shrink-0">
                        <button
                          onClick={() => handleViewApplicants(job)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl inline-flex items-center space-x-1.5 cursor-pointer shadow-xs"
                        >
                          <Users className="h-4 w-4" />
                          <span>{t('viewApplicants')}</span>
                        </button>

                        <div className="flex items-center space-x-2">
                          {job.status !== 'closed' && (
                            <button
                              onClick={() => handleStartEdit(job)}
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                              title="Edit Job"
                            >
                              <Edit className="h-4.5 w-4.5" />
                            </button>
                          )}
                          {job.status === 'approved' && (
                            <button
                              onClick={() => handleCloseJob(job.id)}
                              className="text-xs text-amber-600 font-bold hover:text-amber-700 hover:bg-amber-50 px-2 py-1 rounded-md transition"
                              title="Mark as Closed"
                            >
                              Close
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            title="Delete Post"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: POST / EDIT JOB */}
          {activeTab === 'post-job' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 max-w-2xl mx-auto text-left space-y-6">
              <div className="flex items-center justify-between border-b border-slate-150 pb-4">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingJob ? "Edit Job Posting" : t('postNewJob')}
                </h2>
                <button
                  onClick={() => { resetForm(); setEditingJob(null); setActiveTab('my-jobs'); }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {profile?.verificationStatus !== 'verified' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">Account Verification Required</p>
                    <p className="text-sm mt-1">Your account must be verified by an admin before you can post jobs. Verification is currently {profile?.verificationStatus}.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePostSubmit} className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">{t('jobTitle')} *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g. Cashier Needed for Bakery, Event Assistant"
                    className="mt-1 block w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Grid Category, Rate, Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">{t('categoryLabel')} *</label>
                    <select
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 block w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    >
                      <option value="">Select Category</option>
                      {jobCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rate */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">{t('hourlyRate')} *</label>
                    <input
                      type="number"
                      required
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 750"
                      className="mt-1 block w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">{t('duration')}</label>
                    <input
                      type="text"
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(e.target.value)}
                      placeholder="E.g. 4 Hours, 2 Days"
                      className="mt-1 block w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">{t('jobDesc')} *</label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe specific tasks, attire requirements, any specific campus proximity, and paid break details..."
                    className="mt-1 block w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:bg-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                {/* Contact Phone Override */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Contact Phone Number for This Job *</label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="E.g. 0771234567"
                    className="mt-1 block w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:bg-white focus:outline-hidden focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Defaulted to your profile number. Override per-job if needed.</span>
                </div>

                {/* Location Sub-Header */}
                <div className="border-t border-slate-150 pt-4 space-y-4">
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Workplace Location (No Map required)</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* District Dropdown */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">{t('districtLabel')} *</label>
                      <select
                        required
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="mt-1 block w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:bg-white focus:outline-hidden focus:border-emerald-500"
                      >
                        <option value="">Select District</option>
                        {districtsOfSriLanka.map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>

                    {/* City / Area free text */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">{t('cityLabel')} *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="E.g. Malabe, Kurunegala town, Nugegoda"
                        className="mt-1 block w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:bg-white focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Full address */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">{t('fullAddress')} *</label>
                    <textarea
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Detailed street name, shop number, or landmarks (e.g., Near Sliit Campus Main Entrance)..."
                      className="mt-1 block w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => { resetForm(); setEditingJob(null); setActiveTab('my-jobs'); }}
                    className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 bg-white hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingForm}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-sm font-bold text-white rounded-xl shadow-xs inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingForm && <Loader2 className="animate-spin h-4 w-4" />}
                    <span>{editingJob ? "Save Changes" : "Post Job Shift"}</span>
                  </button>
                </div>
              </form>
              )}
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 text-left">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">In-App Notifications</h2>
              {notifications.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                  <Bell className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold">No notifications yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
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

      {/* VIEW APPLICANTS OVERLAY / MODAL */}
      {selectedJobForApplicants && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 shadow-xl text-left">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-150 flex justify-between items-start bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Applicants Queue</h3>
                <p className="text-xs text-slate-500 mt-0.5">Shift: "{selectedJobForApplicants.title}"</p>
              </div>
              <button 
                onClick={() => setSelectedJobForApplicants(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {loadingApplicants ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin h-6 w-6 text-emerald-600" />
                </div>
              ) : applicants.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold">{t('noApplicantsYet')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applicants.map((app) => (
                    <div 
                      key={app.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800 text-sm">{app.seekerName}</span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            app.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {app.status === 'accepted' ? t('accepted') :
                             app.status === 'rejected' ? t('rejected') : t('applied')}
                          </span>
                        </div>
                        
                        {/* Seeker Contact - Always visible to the employer immediately as requested */}
                        <div className="space-y-1 text-xs text-slate-600 pt-1">
                          <p className="flex items-center">
                            <Phone className="h-3.5 w-3.5 mr-1 text-emerald-600 shrink-0" />
                            <span className="font-mono font-bold text-slate-800">{app.seekerPhone || "No Phone"}</span>
                          </p>
                          <p className="flex items-center">
                            <User className="h-3.5 w-3.5 mr-1 text-slate-400 shrink-0" />
                            <span className="text-slate-500">{app.seekerEmail || "No Email"}</span>
                          </p>
                        </div>
                      </div>

                      {/* Accept/Reject Buttons */}
                      {app.status === 'applied' && (
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => handleRejectApplicant(app.id)}
                            className="bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-red-600 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                          >
                            {t('rejectBtn')}
                          </button>
                          <button
                            onClick={() => handleAcceptApplicant(app.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
                          >
                            {t('acceptBtn')}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-150 bg-slate-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setSelectedJobForApplicants(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around z-40">
        <button
          onClick={() => { setActiveTab('my-jobs'); fetchJobs(); }}
          className={`flex flex-col items-center space-y-1 text-[10px] font-bold ${
            activeTab === 'my-jobs' ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          <Briefcase className="h-5 w-5" />
          <span>My Shifts</span>
        </button>
        <button
          onClick={() => { resetForm(); setEditingJob(null); setActiveTab('post-job'); }}
          className={`flex flex-col items-center space-y-1 text-[10px] font-bold ${
            activeTab === 'post-job' ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          <PlusCircle className="h-5 w-5" />
          <span>Post Job</span>
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
