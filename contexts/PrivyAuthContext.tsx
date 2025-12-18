"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface PrivyUser {
  id: string;
  email?: string;
  wallet?: {
    address: string;
  };
  [key: string]: any;
}

interface PrivyAuthContextType {
  isAuthenticated: boolean;
  user: PrivyUser | null;
  token: string | null;
  accessTier: string | null;
  setAuth: (token: string, user: PrivyUser) => void;
  setAccessTier: (tier: string) => void;
  clearAuth: () => void;
}

const PrivyAuthContext = createContext<PrivyAuthContextType | undefined>(undefined);

export function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<PrivyUser | null>(null);
  const [accessTier, setAccessTierState] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage for existing auth on mount
    const storedToken = localStorage.getItem('privy_token');
    const storedUser = localStorage.getItem('privy_user');
    const storedTier = localStorage.getItem('privy_access_tier');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setAccessTierState(storedTier);
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem('privy_token');
        localStorage.removeItem('privy_user');
        localStorage.removeItem('privy_access_tier');
      }
    }

    // Listen for postMessage from parent window (iframe communication)
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security (adjust as needed for your domains)
      const allowedOrigins = process.env.NEXT_PUBLIC_ALLOWED_IFRAME_ORIGINS?.split(',') || [];
      const isAllowedOrigin = allowedOrigins.some(origin => 
        event.origin.includes(origin.replace('https://', '').replace('http://', ''))
      );
      
      if (!isAllowedOrigin) {
        return;
      }

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.type === 'COMBINED_UPDATE') {
          // Handle auth data
          if (data.privyAuth && data.privyAuth.token && data.privyAuth.user) {
            setAuth(data.privyAuth.token, data.privyAuth.user);
          } else {
            // Clear auth if no privy auth data
            clearAuth();
          }
          
          // Handle tier from balance data
          if (data.vitaBalance && data.vitaBalance.tier) {
            setAccessTier(data.vitaBalance.tier);
          }
        }
      } catch (error) {
        console.warn('Invalid postMessage data received:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const setAuth = useCallback((newToken: string, newUser: PrivyUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('privy_token', newToken);
    localStorage.setItem('privy_user', JSON.stringify(newUser));
  }, []);

  const setAccessTier = useCallback((tier: string) => {
    setAccessTierState(tier);
    localStorage.setItem('privy_access_tier', tier);
  }, []);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    setAccessTierState(null);
    localStorage.removeItem('privy_token');
    localStorage.removeItem('privy_user');
    localStorage.removeItem('privy_access_tier');
  }, []);

  return (
    <PrivyAuthContext.Provider value={{
      isAuthenticated: !!token && !!user,
      user,
      token,
      accessTier,
      setAuth,
      setAccessTier,
      clearAuth
    }}>
      {children}
    </PrivyAuthContext.Provider>
  );
}

export function usePrivyAuth() {
  const context = useContext(PrivyAuthContext);
  if (context === undefined) {
    throw new Error('usePrivyAuth must be used within a PrivyAuthProvider');
  }
  return context;
}