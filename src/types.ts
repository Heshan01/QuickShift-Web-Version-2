export type UserRole = 'seeker' | 'poster' | 'admin';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface UserProfile {
  uid: string;
  role: UserRole;
  fullName: string;
  idNumber: string;
  phone: string;
  email: string;
  photoURL: string | null;
  isBlocked: boolean;
  verificationStatus: VerificationStatus;
  createdAt: any; // Timestamp
  preferredCategories?: string[]; // seeker-only
  businessName?: string | null; // poster-only
}

export type JobStatus = 'pending' | 'approved' | 'rejected' | 'closed';

export interface Job {
  id: string;
  posterId: string;
  posterName?: string; // joined or loaded
  title: string;
  description: string;
  hourlyRate: number;
  estimatedDuration: string | null;
  category: string;
  contactPhone: string;
  district: string;
  city: string;
  address: string;
  searchKeywords: string[];
  photoURL: string | null;
  status: JobStatus;
  rejectionReason: string | null;
  createdAt: any; // Timestamp
  updatedAt: any; // Timestamp
}

export type ApplicationStatus = 'applied' | 'accepted' | 'rejected';

export interface JobApplication {
  id: string;
  jobId: string;
  seekerId: string;
  posterId: string;
  status: ApplicationStatus;
  appliedAt: any; // Timestamp
  
  // Joined fields for UI convenience
  jobTitle?: string;
  jobCategory?: string;
  jobCity?: string;
  jobHourlyRate?: number;
  seekerName?: string;
  seekerPhone?: string;
  seekerEmail?: string;
}
