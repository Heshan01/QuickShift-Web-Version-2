import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  getAdminStats, 
  getAllUsersForAdmin, 
  getAllJobsForAdmin, 
  adminApproveJob, 
  adminRejectJob, 
  adminToggleBlockUser, 
  adminDeleteUser, 
  deleteJob,
  adminUpdateVerification,
  AdminStats 
} from '../lib/db';
import { Job, UserProfile } from '../types';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { 
  Briefcase, 
  Users, 
  Clock, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  ShieldCheck, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Loader2, 
  RefreshCw, 
  ChevronRight,
  UserX,
  X,
  BadgeCheck
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { t, logout, showToast } = useApp();

  // Active Admin Sub-Tab
  const [activeTab, setActiveTab] = useState<'pending' | 'jobs' | 'users' | 'verifications'>('pending');

  // Stats
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSeekers: 0,
    totalPosters: 0,
    totalJobs: 0,
    pendingJobs: 0,
    activeJobs: 0
  });

  // Lists
  const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Search/Filters within lists
  const [userSearch, setUserSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('');

  // Loading States
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Reject Modal State
  const [rejectingJobId, setRejectingJobId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Reload everything
  const reloadData = async () => {
    setLoading(true);
    try {
      const s = await getAdminStats();
      setStats(s);

      const users = await getAllUsersForAdmin();
      setAllUsers(users);

      const jobs = await getAllJobsForAdmin();
      setAllJobs(jobs);
      setPendingJobs(jobs.filter(j => j.status === 'pending'));
    } catch (err) {
      showToast("Error loading admin datasets.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Approve action
  const handleApproveJob = async (jobId: string) => {
    setActionInProgress(jobId);
    try {
      await adminApproveJob(jobId);
      showToast("Shift post APPROVED and published live!");
      await reloadData();
    } catch (err) {
      showToast("Failed to approve job.", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Reject action (submit reason)
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingJobId) return;
    if (!rejectionReason.trim()) {
      showToast("Please enter a valid rejection reason.", "error");
      return;
    }

    const targetId = rejectingJobId;
    setActionInProgress(targetId);
    setRejectingJobId(null);
    try {
      await adminRejectJob(targetId, rejectionReason);
      showToast("Shift post rejected successfully.");
      setRejectionReason('');
      await reloadData();
    } catch (err) {
      showToast("Failed to reject job.", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Block/Unblock action
  const handleToggleBlock = async (userProf: UserProfile) => {
    const action = userProf.isBlocked ? 'unblock' : 'block';
    const message = userProf.isBlocked 
      ? `Are you sure you want to UNBLOCK user: "${userProf.fullName}"?`
      : `Are you sure you want to BLOCK user: "${userProf.fullName}"? They will not be able to log in or use the platform.`;

    if (!window.confirm(message)) return;

    setActionInProgress(userProf.uid);
    try {
      await adminToggleBlockUser(userProf.uid, !userProf.isBlocked);
      showToast(`User successfully ${userProf.isBlocked ? 'unblocked' : 'blocked'}.`);
      await reloadData();
    } catch (err) {
      showToast("Failed to change block status.", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Delete User Account and their association
  const handleDeleteUser = async (uid: string, name: string) => {
    if (!window.confirm(`⚠️ DANGER: Are you sure you want to PERMANENTLY DELETE account: "${name}"? This deletes their entire profile, job postings, and applications. This is IRREVERSIBLE!`)) return;

    setActionInProgress(uid);
    try {
      await adminDeleteUser(uid);
      showToast("Account and all associated records permanently purged.");
      await reloadData();
    } catch (err) {
      showToast("Failed to purge account data.", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Update Verification Status
  const handleVerification = async (uid: string, status: 'verified' | 'rejected') => {
    setActionInProgress(uid);
    try {
      await adminUpdateVerification(uid, status);
      showToast(`User verification marked as ${status}.`);
      await reloadData();
    } catch (err) {
      showToast("Failed to update verification status.", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Delete Job Post
  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this job posting? Applications to this job will also be removed.")) return;

    setActionInProgress(jobId);
    try {
      await deleteJob(jobId);
      showToast("Job post deleted permanently.");
      await reloadData();
    } catch (err) {
      showToast("Failed to delete job.", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Filters client-side
  const filteredUsers = allUsers.filter(u => {
    const s = userSearch.toLowerCase();
    return u.fullName.toLowerCase().includes(s) || 
           u.email.toLowerCase().includes(s) || 
           u.phone.includes(s) || 
           u.role.toLowerCase().includes(s);
  });

  const filteredJobs = allJobs.filter(j => {
    const s = jobSearch.toLowerCase();
    const matchesSearch = j.title.toLowerCase().includes(s) || 
                          j.city.toLowerCase().includes(s) || 
                          j.district.toLowerCase().includes(s) || 
                          j.category.toLowerCase().includes(s);
    const matchesStatus = !jobStatusFilter || j.status === jobStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-white">
            <div className="bg-emerald-600 text-white p-2 rounded-xl">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block leading-none">QuickShift Admin</span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Zero-Trust Management</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={reloadData}
              className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800"
              title="Refresh Data"
            >
              <RefreshCw className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={logout}
              className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 border border-slate-800 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        
        {/* STATS TILES ROW */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 text-left">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalUsers}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Job Seekers</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.totalSeekers}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Job Posters</p>
              <p className="text-2xl font-extrabold text-indigo-600 mt-1">{stats.totalPosters}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Jobs</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalJobs}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-2xs">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pending Approval</p>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">{stats.pendingJobs}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-2xs">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Active Shifts</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.activeJobs}</p>
            </div>
          </div>
        )}

        {/* TAB NAVIGATION BAR */}
        <div className="border-b border-slate-200 bg-white rounded-2xl border p-1.5 flex shadow-2xs">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition ${
              activeTab === 'pending'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Review Queue ({pendingJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('verifications')}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition ${
              activeTab === 'verifications'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Pending Verifications ({allUsers.filter(u => u.verificationStatus === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition ${
              activeTab === 'jobs'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            All Job Posts ({allJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition ${
              activeTab === 'users'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            All Registered Users ({allUsers.length})
          </button>
        </div>

        {/* DETAILED VIEWS */}
        <div className="min-h-[400px]">
          
          {/* TAB 1: PENDING REVIEW QUEUE */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 text-left">Shifts Awaiting Administrative Review</h2>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
                </div>
              ) : pendingJobs.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                  <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                  <p className="font-bold text-slate-800">Clear queue!</p>
                  <p className="text-xs text-slate-400 mt-1">No pending job postings waiting for approval.</p>
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  {pendingJobs.map((job) => (
                    <div 
                      key={job.id}
                      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs hover:border-slate-300 transition flex flex-col md:flex-row justify-between gap-6"
                    >
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                            Pending Approval
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">{job.category}</span>
                        </div>

                        <h3 className="font-bold text-lg text-slate-900">{job.title}</h3>
                        
                        <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line">
                          {job.description}
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 border border-slate-100 rounded-xl text-xs">
                          <div>
                            <span className="block text-slate-400 uppercase font-semibold text-[9px]">Hourly Rate</span>
                            <span className="font-bold text-slate-800">Rs. {job.hourlyRate.toLocaleString()} / hr</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 uppercase font-semibold text-[9px]">Duration</span>
                            <span className="font-medium text-slate-700">{job.estimatedDuration || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 uppercase font-semibold text-[9px]">District / City</span>
                            <span className="font-medium text-slate-700">{job.city}, {job.district}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 uppercase font-semibold text-[9px]">Phone Contact</span>
                            <span className="font-mono font-medium text-slate-700">{job.contactPhone}</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                          <strong className="block text-[9px] uppercase text-slate-400 mb-1">Full Workplace Address:</strong>
                          <span>{job.address}</span>
                        </div>
                      </div>

                      {/* Review Buttons */}
                      <div className="flex flex-row md:flex-col justify-end gap-3 shrink-0 items-center md:items-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-150">
                        <button
                          disabled={actionInProgress === job.id}
                          onClick={() => setRejectingJobId(job.id)}
                          className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          disabled={actionInProgress === job.id}
                          onClick={() => handleApproveJob(job.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1 cursor-pointer"
                        >
                          {actionInProgress === job.id && <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" />}
                          <span>Approve & Live</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ALL JOB POSTINGS */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 text-left">Database Job Postings</h2>
                
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      placeholder="Search jobs..."
                      className="bg-white border border-slate-200 text-xs rounded-xl py-2 pl-9 pr-4 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                  <select
                    value={jobStatusFilter}
                    onChange={(e) => setJobStatusFilter(e.target.value)}
                    className="bg-white border border-slate-200 text-xs rounded-xl py-2 px-3 focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {filteredJobs.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                  <p className="font-semibold">No job posts match your criteria.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-left">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-150 text-xs">
                      <thead className="bg-slate-50 font-bold uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-6 py-4">Title</th>
                          <th className="px-6 py-4">Poster</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4">Rate (Rs)</th>
                          <th className="px-6 py-4">District</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-slate-700 font-medium">
                        {filteredJobs.map((job) => (
                          <tr key={job.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-900 block">{job.title}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{job.city}</span>
                            </td>
                            <td className="px-6 py-4 truncate max-w-[150px]" title={job.posterId}>{job.posterName || job.posterId}</td>
                            <td className="px-6 py-4">{job.category}</td>
                            <td className="px-6 py-4 font-bold text-slate-900">{job.hourlyRate}/hr</td>
                            <td className="px-6 py-4">{job.district}</td>
                            <td className="px-6 py-4">
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                job.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                job.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                job.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                {job.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                disabled={actionInProgress === job.id}
                                onClick={() => handleDeleteJob(job.id)}
                                className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition inline-flex cursor-pointer"
                                title="Delete Permanently"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VERIFICATIONS */}
          {activeTab === 'verifications' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 text-left">Pending Verifications</h2>
              
              {allUsers.filter(u => u.verificationStatus === 'pending').length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                  <BadgeCheck className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold">All caught up!</p>
                  <p className="text-xs mt-1">No pending verification requests.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-left">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-150 text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-slate-600 uppercase tracking-wider w-[25%]">User</th>
                          <th className="px-4 py-3 font-semibold text-slate-600 uppercase tracking-wider w-[15%]">Role</th>
                          <th className="px-4 py-3 font-semibold text-slate-600 uppercase tracking-wider w-[20%]">ID/NIC Number</th>
                          <th className="px-4 py-3 font-semibold text-slate-600 uppercase tracking-wider w-[25%]">Contact</th>
                          <th className="px-4 py-3 font-semibold text-slate-600 uppercase tracking-wider w-[15%] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {allUsers.filter(u => u.verificationStatus === 'pending').map((user) => (
                          <tr key={user.uid} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-3 align-top">
                              <p className="font-bold text-slate-900">{user.fullName}</p>
                              <p className="text-slate-400 font-mono mt-0.5">Joined: {user.createdAt?.toDate().toLocaleDateString()}</p>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                                user.role === 'admin' ? 'bg-slate-900 text-white' : 
                                user.role === 'poster' ? 'bg-indigo-100 text-indigo-700' : 
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 align-top font-mono text-slate-600 font-medium">
                              {user.idNumber || 'Not Provided'}
                            </td>
                            <td className="px-4 py-3 align-top text-slate-500">
                              <div className="flex items-center gap-1.5 mb-1"><Mail className="h-3 w-3 text-slate-400"/> <span className="truncate">{user.email}</span></div>
                              <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-slate-400"/> <span>{user.phone}</span></div>
                            </td>
                            <td className="px-4 py-3 align-top text-right space-y-1.5">
                              <button
                                onClick={() => handleVerification(user.uid, 'verified')}
                                disabled={actionInProgress === user.uid}
                                className="w-full flex items-center justify-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 py-1.5 px-3 rounded text-xs font-bold transition disabled:opacity-50"
                              >
                                <CheckCircle className="h-3.5 w-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleVerification(user.uid, 'rejected')}
                                disabled={actionInProgress === user.uid}
                                className="w-full flex items-center justify-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 py-1.5 px-3 rounded text-xs font-bold transition disabled:opacity-50"
                              >
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ALL USERS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 text-left">Registered Platform Users</h2>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="bg-white border border-slate-200 text-xs rounded-xl py-2 pl-9 pr-4 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                  <p className="font-semibold">No users found.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-left">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-150 text-xs">
                      <thead className="bg-slate-50 font-bold uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-6 py-4">Role</th>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">ID/NIC Number</th>
                          <th className="px-6 py-4">Contact</th>
                          <th className="px-6 py-4">Registered On</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-slate-700 font-medium">
                        {filteredUsers.map((u) => (
                          <tr key={u.uid} className="hover:bg-slate-50">
                            <td className="px-6 py-4 uppercase">
                              <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-md ${
                                u.role === 'admin' ? 'bg-slate-900 text-white' :
                                u.role === 'seeker' ? 'bg-emerald-50 text-emerald-800' : 'bg-indigo-50 text-indigo-800'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-900 block">{u.fullName}</span>
                              {u.businessName && <span className="text-[10px] text-slate-400 block mt-0.5">{u.businessName}</span>}
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-600 font-medium">
                              {u.idNumber || 'Not Provided'}
                            </td>
                            <td className="px-6 py-4">
                              <span className="block flex items-center"><Mail className="h-3 w-3 mr-1 text-slate-400 shrink-0" /> {u.email}</span>
                              <span className="block flex items-center mt-1 font-mono text-slate-500"><Phone className="h-3 w-3 mr-1 text-slate-400 shrink-0" /> {u.phone}</span>
                            </td>
                            <td className="px-6 py-4">
                              {u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'recently'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                u.isBlocked ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {u.isBlocked ? "Suspended" : "Active"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              {u.role !== 'admin' && (
                                <>
                                  <button
                                    disabled={actionInProgress === u.uid}
                                    onClick={() => handleToggleBlock(u)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition cursor-pointer ${
                                      u.isBlocked 
                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                    }`}
                                  >
                                    {u.isBlocked ? "Activate" : "Suspend"}
                                  </button>
                                  <button
                                    disabled={actionInProgress === u.uid}
                                    onClick={() => handleDeleteUser(u.uid, u.fullName)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition inline-flex cursor-pointer"
                                    title="Purge User Account"
                                  >
                                    <UserX className="h-4.5 w-4.5" />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* REJECTION REASON DIALOG MODAL */}
      {rejectingJobId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl text-left">
            <form onSubmit={handleRejectSubmit}>
              <div className="p-5 border-b border-slate-150 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <h3 className="font-bold text-base text-slate-900">Provide Rejection Reason</h3>
                <button 
                  type="button"
                  onClick={() => setRejectingJobId(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Provide a clear, helpful reason so the employer can edit and resubmit their shift.
                </p>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Reason for Rejection</label>
                  <textarea
                    required
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="E.g. Hourly rate is below minimum standard (Rs. 400), or address description is too brief..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>

              <div className="p-5 border-t border-slate-150 bg-slate-50 rounded-b-2xl flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRejectingJobId(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-2xs cursor-pointer"
                >
                  Reject Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
