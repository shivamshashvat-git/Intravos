import { apiClient } from '@/core/lib/apiClient';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: any;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Login failed');
    }

    const { data } = await res.json();
    return data;
  },
};
