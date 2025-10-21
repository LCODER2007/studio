"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserProfile, UserRole } from '@/lib/types';
import { useUser, useAuth as useFirebaseAuth } from '@/firebase';
import { doc, getDoc, setDoc, DocumentReference } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { User } from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function getUserProfile(db: any, user: User): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  } else {
    // This is a new user, create their profile document
    const newUserProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: 'STUDENT', // Default role for new sign-ups
    };
    await setDoc(userDocRef, newUserProfile);
    return newUserProfile;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: firebaseUser, isUserLoading } = useUser();
  const auth = useFirebaseAuth();
  const db = useFirestore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This function will run when the firebaseUser object changes.
    const handleAuthChange = async (user: User | null) => {
      if (user) {
        // User is signed in. Fetch or create their profile.
        setLoading(true);
        const profile = await getUserProfile(db, user);
        setUserProfile(profile);
        setLoading(false);
      } else {
        // User is signed out.
        setUserProfile(null);
        // We consider loading to be finished when we know there's no user.
        setLoading(false); 
      }
    };

    // isUserLoading is true initially, then becomes false once Firebase Auth has checked.
    // We only want to run our logic *after* this check is complete.
    if (!isUserLoading) {
      handleAuthChange(firebaseUser);
    }
  }, [firebaseUser, isUserLoading, db]);

  const logout = useCallback(() => {
    auth.signOut();
  }, [auth]);

  const setUserRole = useCallback(async (role: UserRole) => {
    if (userProfile && db) {
      setLoading(true);
      const userDocRef = doc(db, 'users', userProfile.uid);
      const updatedProfile = { ...userProfile, role };
      await setDoc(userDocRef, updatedProfile, { merge: true });
      setUserProfile(updatedProfile);
      setLoading(false);
    }
  }, [userProfile, db]);

  const value = {
    user: userProfile,
    role: userProfile?.role ?? null,
    // The loading state should reflect both the initial auth check and subsequent profile fetching.
    loading: loading || isUserLoading,
    logout,
    setUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
