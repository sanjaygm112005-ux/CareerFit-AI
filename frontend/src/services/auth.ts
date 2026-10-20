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
const BASE_URL = ((import.meta.env.VITE_API_URL as string) || '/api').replace(/\/$/, '');

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
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({ detail: 'Failed to sign in. Please try again.' }));
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to sign in.');
    }

    this.setSession(data.access_token, data.user);
    return data;
  },

  async signup(email: string, password: string, name: string): Promise<AuthResponse> {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json().catch(() => ({ detail: 'Failed to create account. Please try again.' }));
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to create account.');
    }

    return data;
  },

  async forgotPassword(email: string): Promise<{ message: string; success?: boolean }> {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({ detail: 'Failed to send recovery email. Please try again.' }));
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to send recovery email.');
    }
    return data;
  },

  async verifyResetToken(token: string): Promise<{ valid: boolean; email: string }> {
    const res = await fetch(`${BASE_URL}/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
    const data = await res.json().catch(() => ({ detail: 'Reset token is invalid or expired.' }));
    if (!res.ok) {
      throw new Error(data.detail || 'Reset token is invalid or expired.');
    }
    return data;
  },

  async resetPassword(token: string, password: string): Promise<{ message: string; success?: boolean }> {
    const res = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json().catch(() => ({ detail: 'Failed to reset password. Please try again.' }));
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to reset password.');
    }
    return data;
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
