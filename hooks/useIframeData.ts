"use client";

import { useState, useEffect } from 'react';

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

interface IframeData {
  vitaBalance: VitaBalance | null;
  privyAuth: PrivyAuth | null;
  isAuthenticated: boolean;
  accessTier: string | null;
}

export function useIframeData(): IframeData {
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
        
        console.log('Iframe received message:', data);
        
        if (data.type === 'COMBINED_UPDATE') {
          if (data.vitaBalance) {
            console.log('Setting vita balance:', data.vitaBalance);
            setVitaBalance(data.vitaBalance);
          }
          
          if (data.privyAuth) {
            console.log('Setting privy auth:', data.privyAuth);
            setPrivyAuth(data.privyAuth);
          } else {
            console.log('Clearing privy auth');
            setPrivyAuth(null);
          }
        }
      } catch (error) {
        console.warn('Invalid postMessage data received:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Request initial data from parent
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'REQUEST_DATA' }, '*');
    }
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return {
    vitaBalance,
    privyAuth,
    isAuthenticated: !!privyAuth?.token && !!privyAuth?.user,
    accessTier: vitaBalance?.tier || null
  };
}