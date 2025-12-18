"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface VitaBalance {
  balance: string;
  formatted: string;
  usd: number;
  tier: string;
}

interface PrivyAuth {
  token: string;
  user: {
    id: string;
    email?: string;
    wallet?: any;
  };
}

interface IframeDataContextType {
  vitaBalance: VitaBalance | null;
  privyAuth: PrivyAuth | null;
  isAuthenticated: boolean;
  accessTier: string | null;
}

const IframeDataContext = createContext<IframeDataContextType | undefined>(undefined);

export function IframeDataProvider({ children }: { children: ReactNode }) {
  const [vitaBalance, setVitaBalance] = useState<VitaBalance | null>(null);
  const [privyAuth, setPrivyAuth] = useState<PrivyAuth | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      const allowedOrigins = process.env.NEXT_PUBLIC_ALLOWED_IFRAME_ORIGINS?.split(',') || ['vitadao.com'];
      const isAllowedOrigin = allowedOrigins.some(origin => 
        event.origin.includes(origin.replace('https://', '').replace('http://', ''))
      );
      
      if (!isAllowedOrigin) {
        console.warn('Message from unauthorized origin:', event.origin);
        return;
      }

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Ignore metamask and other non-relevant messages
        if (data.target === 'metamask-inpage' || !data.type) {
          return;
        }
        
        console.log('IframeDataProvider received message:', data);
        
        if (data.type === 'COMBINED_UPDATE') {
          if (data.vitaBalance) {
            console.log('Setting vita balance in provider:', data.vitaBalance);
            setVitaBalance(data.vitaBalance);
          }
          
          if (data.privyAuth) {
            console.log('Setting privy auth in provider:', data.privyAuth);
            setPrivyAuth(data.privyAuth);
          } else {
            console.log('No privy auth data, clearing in provider');
            setPrivyAuth(null);
          }
        }
      } catch (error) {
        console.warn('Invalid postMessage data received:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Request initial data from parent immediately and after a short delay
    const requestData = () => {
      if (window.parent !== window) {
        console.log('Requesting initial data from parent');
        window.parent.postMessage({ type: 'REQUEST_DATA' }, '*');
      }
    };
    
    requestData();
    
    // Also request data after a short delay in case the parent wasn't ready
    const timeoutId = setTimeout(requestData, 1000);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeoutId);
    };
  }, []);

  // Log current state for debugging
  useEffect(() => {
    console.log('IframeDataProvider state updated:', {
      vitaBalance,
      privyAuth,
      isAuthenticated: !!privyAuth?.token && !!privyAuth?.user,
      accessTier: vitaBalance?.tier || null
    });
  }, [vitaBalance, privyAuth]);

  const value = {
    vitaBalance,
    privyAuth,
    isAuthenticated: !!privyAuth?.token && !!privyAuth?.user,
    accessTier: vitaBalance?.tier || null
  };

  return (
    <IframeDataContext.Provider value={value}>
      {children}
    </IframeDataContext.Provider>
  );
}

export function useIframeData() {
  const context = useContext(IframeDataContext);
  if (context === undefined) {
    throw new Error('useIframeData must be used within an IframeDataProvider');
  }
  return context;
}