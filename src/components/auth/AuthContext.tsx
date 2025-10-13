"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserProfile, UserRole } from '@/lib/types';
import { mockUsers } from '@/lib/placeholder-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

const fullMockUsers: Record<UserRole, UserProfile> = {
  STUDENT: { ...mockUsers['student123'], role: 'STUDENT', photoURL: findImage('student-avatar') },
  ADMIN: { ...mockUsers['admin456'], role: 'ADMIN', photoURL: findImage('admin-avatar') },
  SUPER_ADMIN: { ...mockUsers['superadmin789'], role: 'SUPER_ADMIN', photoURL: findImage('superadmin-avatar') },
};

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
  setUserRole: (role: UserRole) => void; // For demo purposes
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking auth state on load
    try {
      const storedRole = localStorage.getItem('userRole') as UserRole | null;
      if (storedRole && fullMockUsers[storedRole]) {
        setUser(fullMockUsers[storedRole]);
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
    }
    setLoading(false);
  }, []);

  const setRoleAndUser = useCallback((role: UserRole | null) => {
    try {
      if(role) {
        localStorage.setItem('userRole', role);
        setUser(fullMockUsers[role]);
      } else {
        localStorage.removeItem('userRole');
        setUser(null);
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
    }
    setLoading(false);
  }, []);


  const login = useCallback((role: UserRole) => {
    setLoading(true);
    setRoleAndUser(role);
  }, [setRoleAndUser]);

  const logout = useCallback(() => {
    setLoading(true);
    setRoleAndUser(null);
  }, [setRoleAndUser]);

  const setUserRole = useCallback((role: UserRole) => {
    setLoading(true);
    setRoleAndUser(role);
  }, [setRoleAndUser]);


  const value = {
    user,
    role: user?.role ?? null,
    loading,
    login,
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
