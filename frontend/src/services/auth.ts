// src/services/auth.ts

export interface CustomUser {
  id: string;
  email: string;
  name?: string;
  user_metadata?: {
    name?: string;
    email?: string;
  };
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  user: CustomUser;
  message?: string;
}

const TOKEN_KEY = 'careerfit_token';
const USER_KEY = 'careerfit_user';
const BASE_URL = (
  (import.meta.env.VITE_API_URL as string) ||
  (import.meta.env.DEV ? '/api' : 'https://careerfit-ai-0nsp.onrender.com/api')
).replace(/\/$/, '');

async function parseAuthResponse(res: Response, defaultMessage: string) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error('Backend server is not connected. Please ensure VITE_API_URL is configured in your hosting settings.');
  }
  const data = await res.json().catch(() => ({ detail: defaultMessage }));
  if (!res.ok) {
    throw new Error(data.detail || defaultMessage);
  }
  return data;
}

function handleNetworkError(err: any) {
  if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
    throw err;
  }
  throw new Error('Unable to connect to backend server. If using Render free tier, please allow 30 seconds for it to wake up.');
}

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser(): CustomUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const u = JSON.parse(raw);
      return {
        ...u,
        user_metadata: { name: u.name, email: u.email },
      };
    } catch {
      return null;
    }
  },

  setSession(token: string, user: CustomUser) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('careerfit-auth-change'));
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event('careerfit-auth-change'));
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await parseAuthResponse(res, 'Failed to sign in. Please verify your email and password.');
      this.setSession(data.access_token, data.user);
      return data;
    } catch (err: any) {
      handleNetworkError(err);
      throw err;
    }
  },

  async signup(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      return await parseAuthResponse(res, 'Failed to create account.');
    } catch (err: any) {
      handleNetworkError(err);
      throw err;
    }
  },

  async forgotPassword(email: string): Promise<{ message: string; success?: boolean }> {
    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return await parseAuthResponse(res, 'Failed to send recovery email.');
    } catch (err: any) {
      handleNetworkError(err);
      throw err;
    }
  },

  async verifyResetToken(token: string): Promise<{ valid: boolean; email: string }> {
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
      return await parseAuthResponse(res, 'Reset token is invalid or expired.');
    } catch (err: any) {
      handleNetworkError(err);
      throw err;
    }
  },

  async resetPassword(token: string, password: string): Promise<{ message: string; success?: boolean }> {
    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      return await parseAuthResponse(res, 'Failed to reset password.');
    } catch (err: any) {
      handleNetworkError(err);
      throw err;
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.clearSession();
    }
  },
};
