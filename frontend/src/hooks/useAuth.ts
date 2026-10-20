// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { authService, type CustomUser } from '../services/auth';

interface AuthState {
  user: CustomUser | null;
  session: { access_token: string; user: CustomUser } | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(() => {
    const customUser = authService.getUser();
    const token = authService.getToken();
    if (customUser && token) {
      return {
        user: customUser,
        session: { access_token: token, user: customUser },
        loading: false,
      };
    }
    return { user: null, session: null, loading: false };
  });

  useEffect(() => {
    const syncAuth = () => {
      const customUser = authService.getUser();
      const token = authService.getToken();
      if (customUser && token) {
        setState({
          user: customUser,
          session: { access_token: token, user: customUser },
          loading: false,
        });
      } else {
        setState({ user: null, session: null, loading: false });
      }
    };

    syncAuth();
    window.addEventListener('careerfit-auth-change', syncAuth);
    return () => window.removeEventListener('careerfit-auth-change', syncAuth);
  }, []);

  return state;
}
