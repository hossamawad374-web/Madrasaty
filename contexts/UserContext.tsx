/*
 * Madrasaty — Global User Profile Context
 * Manages Firestore-equivalent user document state globally.
 */

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/template';
import { userService, UserProfile, UpdateProfilePayload } from '@/services/userService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserContextType {
  profile: UserProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  updateProfileLocally: (updates: Partial<UserProfile> & Partial<UpdateProfilePayload>) => void;
  clearProfile: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const UserContext = createContext<UserContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = useCallback(async (uid: string) => {
    setProfileLoading(true);
    setProfileError(null);
    const { data, error } = await userService.getProfile(uid);
    if (error) {
      setProfileError(error);
    } else {
      setProfile(data);
    }
    setProfileLoading(false);
  }, []);

  // Sync with auth state changes
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      loadProfile(user.id);
    } else {
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
    }
  }, [user, authLoading, loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  const updateProfileLocally = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(null);
    setProfileError(null);
  }, []);

  return (
    <UserContext.Provider
      value={{
        profile,
        profileLoading,
        profileError,
        refreshProfile,
        updateProfileLocally,
        clearProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
