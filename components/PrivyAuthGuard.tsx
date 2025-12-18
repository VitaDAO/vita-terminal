"use client";

import { usePrivyAuth } from '@/contexts/PrivyAuthContext';
import { useEffect } from 'react';

interface PrivyAuthGuardProps {
  children: React.ReactNode;
}

export function PrivyAuthGuard({ children }: PrivyAuthGuardProps) {
  const { isAuthenticated, user } = usePrivyAuth();

  useEffect(() => {
    // Optional: Log authentication status for debugging
    if (isAuthenticated && user) {
      console.log('✅ User authenticated via Privy:', {
        wallet: user.wallet?.address,
        email: user.email
      });
    } else {
      console.log('🔗 No Privy authentication - wallet not connected');
    }
  }, [isAuthenticated, user]);

  // Always render children - no blocking
  return <>{children}</>;
}