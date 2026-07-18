import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { getUserProfile, createUserProfile, createNotification, getUserNotifications, markNotificationAsRead, InAppNotification } from '../lib/db';
import { UserProfile, UserRole } from '../types';
import { translations, Language } from '../lib/translations';
import { doc, onSnapshot } from 'firebase/firestore';

interface AppContextType {
  // Auth state
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdminUser: boolean;
  isSeekerUser: boolean;
  isPosterUser: boolean;
  isBlockedUser: boolean;
  
  // Auth actions
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, role: UserRole, fullName: string, idNumber: string, phone: string, extra?: { businessName?: string; preferredCategories?: string[] }) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  
  // Language actions
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
  
  // Floating Toast
  toast: { message: string; type: 'success' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  hideToast: () => void;

  // In-app notifications
  notifications: InAppNotification[];
  unreadNotificationsCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLangState] = useState<Language>('en');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  // Load language from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem('quickshift_lang');
    if (saved === 'en' || saved === 'si') {
      setLangState(saved);
    }
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('quickshift_lang', l);
  };

  const t = (key: keyof typeof translations['en']): string => {
    return translations[lang][key] || translations['en'][key] || String(key);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const hideToast = () => setToast(null);

  // Monitor Auth and Profile state
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      // Clean up previous profile listener if it exists
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        
        try {
          // Force retrieving ID token to guarantee it propagates down to Firestore client
          await firebaseUser.getIdToken(true);
        } catch (tokenErr) {
          console.warn("Failed to retrieve/refresh ID token:", tokenErr);
        }
        
        // Listen to changes in the user's profile document in real-time
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data() as UserProfile;
            setProfile(profileData);
            
            // If they are blocked, show error and potentially sign out or limit UI
            if (profileData.isBlocked) {
              showToast("Your account has been suspended by an administrator.", "error");
            }
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (err) => {
          console.error("Error listening to profile changes:", err);
          setLoading(false);
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        });
      } else {
        setUser(null);
        setProfile(null);
        setNotifications([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  // Sync notifications
  const refreshNotifications = async () => {
    if (user && profile && !profile.isBlocked) {
      const data = await getUserNotifications(user.uid);
      setNotifications(data);
    }
  };

  useEffect(() => {
    if (user && profile && !profile.isBlocked) {
      refreshNotifications();
      // Poll every 30 seconds for live notification updates
      const interval = setInterval(refreshNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, profile?.uid, profile?.isBlocked]);

  const markAsRead = async (id: string) => {
    if (user) {
      await markNotificationAsRead(user.uid, id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  const login = async (email: string, pass: string) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, pass);
      const userProfile = await getUserProfile(credential.user.uid);
      
      if (userProfile && userProfile.isBlocked) {
        await signOut(auth);
        throw new Error("This account is blocked by an admin.");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      let errMsg = err.message || "Login failed. Please check credentials.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errMsg = "Invalid email or password.";
      }
      showToast(errMsg, "error");
      throw err;
    }
  };

  const signup = async (
    email: string,
    pass: string,
    role: UserRole,
    fullName: string,
    idNumber: string,
    phone: string,
    extra?: { businessName?: string; preferredCategories?: string[] }
  ) => {
    try {
      // Step 1: Create user in Firebase Auth
      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      
      // Step 2: Auto admin assignment by email
      let assignedRole = role;
      if (email === 'heshandilhara004@gmail.com') {
        assignedRole = 'admin';
      }
      
      // Step 3: Save profile
      const newProfile = {
        role: assignedRole,
        fullName,
        idNumber,
        phone,
        email,
        photoURL: null,
        isBlocked: false,
        verificationStatus: 'pending' as VerificationStatus,
        ...(assignedRole === 'seeker' ? { preferredCategories: extra?.preferredCategories || [] } : {}),
        ...(assignedRole === 'poster' ? { businessName: extra?.businessName || null } : {})
      };
      
      await createUserProfile(credential.user.uid, newProfile);
      
      // Send welcome notification
      await createNotification(
        credential.user.uid,
        `Welcome to QuickShift!`,
        `Thank you for joining QuickShift. Complete your profile details and explore part-time shifts!`,
        'general'
      );
      
      showToast("Registration successful!");
    } catch (err: any) {
      console.error("Signup failed:", err);
      let errMsg = err.message || "Signup failed. Please try again.";
      if (err.code === 'auth/email-already-in-use') {
        errMsg = "This email is already in use.";
      } else if (err.code === 'auth/weak-password') {
        errMsg = "Password should be at least 6 characters.";
      }
      showToast(errMsg, "error");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      showToast("Logged out successfully.");
    } catch (err) {
      console.error("Logout failed:", err);
      showToast("Failed to log out.", "error");
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("Password reset link sent to your email!");
    } catch (err: any) {
      console.error("Password reset failed:", err);
      showToast("Failed to send reset link. Please verify your email.", "error");
      throw err;
    }
  };

  const isAdminUser = profile?.role === 'admin';
  const isSeekerUser = profile?.role === 'seeker';
  const isPosterUser = profile?.role === 'poster';
  const isBlockedUser = profile?.isBlocked === true;

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdminUser,
        isSeekerUser,
        isPosterUser,
        isBlockedUser,
        login,
        signup,
        logout,
        resetPassword,
        lang,
        setLang,
        t,
        toast,
        showToast,
        hideToast,
        notifications,
        unreadNotificationsCount,
        refreshNotifications,
        markAsRead
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
