import type { AuthResponse, User, SignupForm, LoginForm } from '@/types';
import { apiService } from './api';

export class AuthService {
  async signup(data: SignupForm): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/signup', data);
    if (response.success && response.data) {
      apiService.setToken(response.data.token);
      return response.data;
    }
    throw new Error(response.message || 'Signup failed');
  }

  async login(data: LoginForm): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', data);
    if (response.success && response.data) {
      apiService.setToken(response.data.token);
      return response.data;
    }
    throw new Error(response.message || 'Login failed');
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } finally {
      apiService.clearToken();
    }
  }

  async getMe(): Promise<User> {
    const response = await apiService.get<User>('/auth/me');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get user data');
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/refresh');
    if (response.success && response.data) {
      apiService.setToken(response.data.token);
      return response.data;
    }
    throw new Error(response.message || 'Token refresh failed');
  }
}

export const authService = new AuthService();