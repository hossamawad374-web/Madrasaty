/*
 * Madrasaty — useUserProfile Hook
 * Consumes UserContext. Import this in all components — never import UserContext directly.
 */

import { useContext } from 'react';
import { UserContext } from '@/contexts/UserContext';

export function useUserProfile() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserProfile must be used within UserProvider');
  }
  return context;
}
