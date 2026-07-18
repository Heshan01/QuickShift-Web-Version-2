import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  getCountFromServer,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, Job, JobApplication, JobStatus } from '../types';

// Keyword generator for plain-text search matching
export function generateSearchKeywords(...fields: string[]): string[] {
  const wordsSet = new Set<string>();
  fields.forEach(field => {
    if (!field) return;
    // Clean string, replace punctuation with space, split, lowercase
    const normalized = field.toLowerCase().replace(/[^a-z0-9\u0d80-\u0dff\s]/g, ' '); // Supports alphanumeric + Sinhala unicode block
    const words = normalized.split(/\s+/).filter(w => w.trim().length > 0);
    words.forEach(w => wordsSet.add(w));
  });
  return Array.from(wordsSet);
}

// Image upload utility
export async function uploadImage(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("Error uploading image to Firebase Storage:", error);
    throw error;
  }
}

// Helper to get milliseconds from any Firestore timestamp or date shape
export function getTimestampMs(val: any): number {
  if (!val) return 0;
  if (typeof val.toDate === 'function') {
    return val.toDate().getTime();
  }
  if (typeof val.seconds === 'number') {
    return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
  }
  if (val instanceof Date) {
    return val.getTime();
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }
  return 0;
}

// IN-APP NOTIFICATIONS
export interface InAppNotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'job_status' | 'application' | 'general';
  isRead: boolean;
  createdAt: any;
}

export async function createNotification(userId: string, title: string, message: string, type: 'job_status' | 'application' | 'general' = 'general') {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    await addDoc(notificationsRef, {
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Error creating notification:", err);
  }
}

export async function getUserNotifications(userId: string): Promise<InAppNotification[]> {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as InAppNotification[];
  } catch (err) {
    console.error("Error getting notifications:", err);
    return [];
  }
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  try {
    const docRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(docRef, { isRead: true });
  } catch (err) {
    console.error("Error marking notification read:", err);
  }
}

// USER PROFILE ACTIONS
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    return null; // unreachable due to handleFirestoreError throw
  }
}

export async function createUserProfile(uid: string, profile: Omit<UserProfile, 'uid' | 'createdAt'>): Promise<UserProfile> {
  try {
    const docRef = doc(db, 'users', uid);
    const fullProfile: UserProfile = {
      uid,
      ...profile,
      createdAt: serverTimestamp()
    };
    await setDoc(docRef, fullProfile);
    return fullProfile;
  } catch (error) {
    console.error("Error in createUserProfile:", error);
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    throw error; // unreachable due to handleFirestoreError throw
  }
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    throw error;
  }
}

// JOB POSTINGS
export async function createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'searchKeywords'>): Promise<string> {
  try {
    const jobsRef = collection(db, 'jobs');
    const keywords = generateSearchKeywords(jobData.title, jobData.district, jobData.city, jobData.address, jobData.category);
    
    const newDocRef = doc(jobsRef); // Auto-generate ID
    const job: Job = {
      id: newDocRef.id,
      ...jobData,
      searchKeywords: keywords,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(newDocRef, job);
    return newDocRef.id;
  } catch (error) {
    console.error("Error in createJob:", error);
    throw error;
  }
}

export async function updateJob(jobId: string, updates: Partial<Job>): Promise<void> {
  try {
    const docRef = doc(db, 'jobs', jobId);
    const writeData: any = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    // Regeneate keywords if structural elements changed
    if (updates.title || updates.district || updates.city || updates.address || updates.category) {
      const currentSnap = await getDoc(docRef);
      if (currentSnap.exists()) {
        const currentData = currentSnap.data() as Job;
        writeData.searchKeywords = generateSearchKeywords(
          updates.title || currentData.title,
          updates.district || currentData.district,
          updates.city || currentData.city,
          updates.address || currentData.address,
          updates.category || currentData.category
        );
      }
    }
    
    await updateDoc(docRef, writeData);
  } catch (error) {
    console.error("Error in updateJob:", error);
    throw error;
  }
}

export async function deleteJob(jobId: string): Promise<void> {
  try {
    const docRef = doc(db, 'jobs', jobId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error in deleteJob:", error);
    throw error;
  }
}

export async function getPosterJobs(posterId: string): Promise<Job[]> {
  try {
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, where('posterId', '==', posterId));
    const snap = await getDocs(q);
    const jobs = snap.docs.map(doc => doc.data() as Job);
    jobs.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
    return jobs;
  } catch (error) {
    console.error("Error in getPosterJobs:", error);
    return [];
  }
}

export interface SearchFilters {
  searchTerm?: string;
  district?: string;
  category?: string;
  minRate?: number;
  maxRate?: number;
}

export async function searchJobs(filters: SearchFilters): Promise<{ jobs: Job[]; isFallback: boolean }> {
  try {
    const jobsRef = collection(db, 'jobs');
    
    // Base query: only approved jobs
    let q = query(jobsRef, where('status', '==', 'approved'));
    
    // Apply firestore indexing guidelines. We can filter on category in the query, but we also can filter client-side for rate range
    // to avoid complex index requirements.
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    
    if (filters.district) {
      q = query(q, where('district', '==', filters.district));
    }
    
    // Firestore search keyword filter
    let hasExactMatches = true;
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const normalizedTerm = filters.searchTerm.trim().toLowerCase();
      q = query(q, where('searchKeywords', 'array-contains', normalizedTerm));
    }

    const snap = await getDocs(q);
    let jobs = snap.docs.map(doc => doc.data() as Job);

    // Apply Client-Side filters (for rate and safety)
    if (filters.minRate !== undefined) {
      jobs = jobs.filter(j => j.hourlyRate >= (filters.minRate || 0));
    }
    if (filters.maxRate !== undefined) {
      jobs = jobs.filter(j => j.hourlyRate <= (filters.maxRate || Infinity));
    }

    // Sort newest-first
    jobs.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));

    // Fallback search mechanism:
    // If we searched by text and found nothing, query jobs by same district as fallback
    if (jobs.length === 0 && filters.searchTerm && filters.searchTerm.trim()) {
      // Find the district if we can from user choice, or from some mapping, or skip if no district is selected.
      // If we had a district selected, we fall back to district jobs.
      if (filters.district) {
        hasExactMatches = false;
        let fallbackQuery = query(jobsRef, where('status', '==', 'approved'), where('district', '==', filters.district));
        if (filters.category) {
          fallbackQuery = query(fallbackQuery, where('category', '==', filters.category));
        }
        const fallbackSnap = await getDocs(fallbackQuery);
        let fallbackJobs = fallbackSnap.docs.map(doc => doc.data() as Job);
        
        if (filters.minRate !== undefined) {
          fallbackJobs = fallbackJobs.filter(j => j.hourlyRate >= (filters.minRate || 0));
        }
        if (filters.maxRate !== undefined) {
          fallbackJobs = fallbackJobs.filter(j => j.hourlyRate <= (filters.maxRate || Infinity));
        }
        
        fallbackJobs.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));

        return { jobs: fallbackJobs, isFallback: true };
      }
    }

    return { jobs, isFallback: false };
  } catch (error) {
    console.error("Error in searchJobs:", error);
    return { jobs: [], isFallback: false };
  }
}

// APPLICATIONS
export async function createApplication(jobId: string, seekerId: string, posterId: string): Promise<string> {
  try {
    const appsRef = collection(db, 'applications');
    const newDocRef = doc(appsRef);
    
    const appData: JobApplication = {
      id: newDocRef.id,
      jobId,
      seekerId,
      posterId,
      status: 'applied',
      appliedAt: serverTimestamp()
    };
    
    await setDoc(newDocRef, appData);
    
    // Notify the Poster
    const seekerSnap = await getDoc(doc(db, 'users', seekerId));
    const jobSnap = await getDoc(doc(db, 'jobs', jobId));
    if (seekerSnap.exists() && jobSnap.exists()) {
      const seeker = seekerSnap.data() as UserProfile;
      const job = jobSnap.data() as Job;
      await createNotification(
        posterId,
        "New Applicant",
        `${seeker.fullName} applied for your job post: "${job.title}"`,
        'application'
      );
    }
    
    return newDocRef.id;
  } catch (error) {
    console.error("Error in createApplication:", error);
    throw error;
  }
}

export async function updateApplicationStatus(appId: string, status: 'accepted' | 'rejected'): Promise<void> {
  try {
    const docRef = doc(db, 'applications', appId);
    await updateDoc(docRef, { status });

    // Notify Seeker
    const appSnap = await getDoc(docRef);
    if (appSnap.exists()) {
      const app = appSnap.data() as JobApplication;
      const jobSnap = await getDoc(doc(db, 'jobs', app.jobId));
      if (jobSnap.exists()) {
        const job = jobSnap.data() as Job;
        await createNotification(
          app.seekerId,
          status === 'accepted' ? "Application Accepted!" : "Application Status Update",
          status === 'accepted'
            ? `Congratulations! Your application for "${job.title}" has been ACCEPTED. You can now view the employer contact details.`
            : `Your application for "${job.title}" was not selected this time. Keep searching!`,
          'application'
        );
      }
    }
  } catch (error) {
    console.error("Error in updateApplicationStatus:", error);
    throw error;
  }
}

export async function deleteApplication(appId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'applications', appId));
  } catch (error) {
    console.error("Error in deleteApplication:", error);
    handleFirestoreError(error, OperationType.DELETE, `applications/${appId}`);
    throw error;
  }
}

export async function getSeekerApplications(seekerId: string): Promise<JobApplication[]> {
  try {
    const q = query(collection(db, 'applications'), where('seekerId', '==', seekerId));
    const snap = await getDocs(q);
    const apps: JobApplication[] = [];
    
    for (const d of snap.docs) {
      const app = { id: d.id, ...d.data() } as JobApplication;
      // Fetch Job Details
      const jobSnap = await getDoc(doc(db, 'jobs', app.jobId));
      if (jobSnap.exists()) {
        const job = jobSnap.data() as Job;
        app.jobTitle = job.title;
        app.jobCategory = job.category;
        app.jobCity = job.city;
        app.jobHourlyRate = job.hourlyRate;
      }
      apps.push(app);
    }
    
    // Sort by applied date
    apps.sort((a, b) => getTimestampMs(b.appliedAt) - getTimestampMs(a.appliedAt));

    return apps;
  } catch (error) {
    console.error("Error in getSeekerApplications:", error);
    return [];
  }
}

export async function getJobApplications(jobId: string, posterId?: string): Promise<JobApplication[]> {
  try {
    const q = query(collection(db, 'applications'), where('jobId', '==', jobId));
    const snap = await getDocs(q);
    const apps: JobApplication[] = [];
    
    for (const d of snap.docs) {
      const app = { id: d.id, ...d.data() } as JobApplication;
      // Fetch Seeker profile
      const seekerSnap = await getDoc(doc(db, 'users', app.seekerId));
      if (seekerSnap.exists()) {
        const seeker = seekerSnap.data() as UserProfile;
        app.seekerName = seeker.fullName;
        app.seekerPhone = seeker.phone;
        app.seekerEmail = seeker.email;
      }
      apps.push(app);
    }
    return apps;
  } catch (error) {
    console.error("Error in getJobApplications:", error);
    return [];
  }
}

// ADMIN ACTIONS
export interface AdminStats {
  totalUsers: number;
  totalSeekers: number;
  totalPosters: number;
  totalJobs: number;
  pendingJobs: number;
  activeJobs: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const usersCol = collection(db, 'users');
    const jobsCol = collection(db, 'jobs');

    const totalUsersSnap = await getCountFromServer(usersCol);
    const totalSeekersSnap = await getCountFromServer(query(usersCol, where('role', '==', 'seeker')));
    const totalPostersSnap = await getCountFromServer(query(usersCol, where('role', '==', 'poster')));
    
    const totalJobsSnap = await getCountFromServer(jobsCol);
    const pendingJobsSnap = await getCountFromServer(query(jobsCol, where('status', '==', 'pending')));
    const activeJobsSnap = await getCountFromServer(query(jobsCol, where('status', '==', 'approved')));

    return {
      totalUsers: totalUsersSnap.data().count,
      totalSeekers: totalSeekersSnap.data().count,
      totalPosters: totalPostersSnap.data().count,
      totalJobs: totalJobsSnap.data().count,
      pendingJobs: pendingJobsSnap.data().count,
      activeJobs: activeJobsSnap.data().count
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return {
      totalUsers: 0,
      totalSeekers: 0,
      totalPosters: 0,
      totalJobs: 0,
      pendingJobs: 0,
      activeJobs: 0
    };
  }
}

export async function getAllUsersForAdmin(): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as UserProfile);
  } catch (error) {
    console.error("Error getting all users:", error);
    return [];
  }
}

export async function getAllJobsForAdmin(): Promise<Job[]> {
  try {
    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Job);
  } catch (error) {
    console.error("Error getting all jobs for admin:", error);
    return [];
  }
}

export async function adminUpdateVerification(uid: string, status: 'verified' | 'rejected'): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      verificationStatus: status
    });

    // Notify User
    await createNotification(
      uid,
      `Account Verification ${status === 'verified' ? 'Approved' : 'Rejected'}`,
      status === 'verified' 
        ? "Your account has been verified! You can now post jobs and apply for shifts."
        : "Your account verification was rejected. Please contact support.",
      'general'
    );
  } catch (error) {
    console.error("Error in adminUpdateVerification:", error);
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    throw error;
  }
}

export async function adminApproveJob(jobId: string): Promise<void> {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    await updateDoc(jobRef, {
      status: 'approved',
      rejectionReason: null,
      updatedAt: serverTimestamp()
    });

    // Notify Poster
    const jobSnap = await getDoc(jobRef);
    if (jobSnap.exists()) {
      const job = jobSnap.data() as Job;
      await createNotification(
        job.posterId,
        "Job Approved!",
        `Your job post "${job.title}" has been approved by the admin and is now live for seekers!`,
        'job_status'
      );
    }
  } catch (error) {
    console.error("Error approving job:", error);
    throw error;
  }
}

export async function adminRejectJob(jobId: string, reason: string): Promise<void> {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    await updateDoc(jobRef, {
      status: 'rejected',
      rejectionReason: reason,
      updatedAt: serverTimestamp()
    });

    // Notify Poster
    const jobSnap = await getDoc(jobRef);
    if (jobSnap.exists()) {
      const job = jobSnap.data() as Job;
      await createNotification(
        job.posterId,
        "Job Rejected",
        `Your job post "${job.title}" was not approved. Reason: ${reason}`,
        'job_status'
      );
    }
  } catch (error) {
    console.error("Error rejecting job:", error);
    throw error;
  }
}

export async function adminToggleBlockUser(uid: string, block: boolean): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { isBlocked: block });
  } catch (error) {
    console.error("Error toggling user block status:", error);
    throw error;
  }
}

export async function adminDeleteUser(uid: string): Promise<void> {
  try {
    // Note: Due to client-side permissions, we'll perform a batch delete for Firestore documents
    // of user, and their postings and applications.
    const batch = writeBatch(db);
    
    // Delete user profile
    batch.delete(doc(db, 'users', uid));
    
    // Find jobs posted by this user
    const jobsSnap = await getDocs(query(collection(db, 'jobs'), where('posterId', '==', uid)));
    jobsSnap.docs.forEach(d => batch.delete(d.ref));
    
    // Find applications made by or to this user
    const appsSnap1 = await getDocs(query(collection(db, 'applications'), where('seekerId', '==', uid)));
    appsSnap1.docs.forEach(d => batch.delete(d.ref));
    
    const appsSnap2 = await getDocs(query(collection(db, 'applications'), where('posterId', '==', uid)));
    appsSnap2.docs.forEach(d => batch.delete(d.ref));
    
    await batch.commit();
  } catch (error) {
    console.error("Error in adminDeleteUser:", error);
    throw error;
  }
}
