"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserProfile, UserRole } from '@/lib/types';
import { useUser, useAuth as useFirebaseAuth, useFirestore, FirestorePermissionError, errorEmitter } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
  
  try {
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const existingProfile = userDoc.data() as UserProfile;
      
      // Update profile if Google sign-in provides new information
      const needsUpdate = 
        user.displayName !== existingProfile.displayName ||
        user.photoURL !== existingProfile.photoURL ||
        user.email !== existingProfile.email;
      
      if (needsUpdate) {
        const updatedProfile: UserProfile = {
          ...existingProfile,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        
        // Non-blocking update
        setDoc(userDocRef, updatedProfile, { merge: true }).catch(err => {
          const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: updatedProfile,
          });
          errorEmitter.emit('permission-error', permissionError);
        });
        
        return updatedProfile;
      }
      
      return existingProfile;
    } else {
      // This is a new user, create their profile document
      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'STUDENT', // Default role for new sign-ups
      };

      // Use a non-blocking write with specific error handling
      setDoc(userDocRef, newUserProfile).catch(err => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'create',
          requestResourceData: newUserProfile,
        });
        errorEmitter.emit('permission-error', permissionError);
      });

      return newUserProfile;
    }
  } catch (error) {
    // This will catch permission errors on the `getDoc` call
    const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'get',
    });
    errorEmitter.emit('permission-error', permissionError);
    // We can throw the original error or the new one, throwing the new one is better for debugging
    throw permissionError;
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
        try {
            const profile = await getUserProfile(db, user);
            setUserProfile(profile);
        } catch (e) {
            // Error is already emitted by getUserProfile, just log it for client-side debugging if needed
            console.error("Failed to get user profile:", e);
        } finally {
            setLoading(false);
        }

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
      
      setDoc(userDocRef, updatedProfile, { merge: true }).catch(err => {
         const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: updatedProfile,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
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
