import type { AuthResponse, User, SignupForm, LoginForm } from '@/types';
import { apiService } from './api';

export class AuthService {
  async signup(data: SignupForm): Promise<AuthResponse> {
    const debug = new URLSearchParams(window.location.search).get('debug') === 'true';
    
    // Remove confirmPassword before sending to backend
    const { confirmPassword, ...signupData } = data;
    
    if (debug) {
      console.log('🔐 [DEBUG] Signup request:', { ...signupData, password: '[REDACTED]' });
    } else {
      console.log('🔐 Signup request:', { ...signupData, password: '[REDACTED]' });
    }
    
    const response = await apiService.post<AuthResponse>('/auth/signup', signupData);
    
    if (debug) {
      console.log('🔐 [DEBUG] Signup response:', response);
      console.log('🔐 [DEBUG] Token received:', response.data?.token ? 'Yes' : 'No');
      console.log('🔐 [DEBUG] User data:', response.data?.user);
    } else {
      console.log('🔐 Signup response:', response);
    }
    
    if (response.success && response.data) {
      apiService.setToken(response.data.token);
      if (debug) {
        console.log('🔐 [DEBUG] Token saved to localStorage');
      }
      return response.data;
    }
    throw new Error(response.message || 'Signup failed');
  }

  async login(data: LoginForm): Promise<AuthResponse> {
    const debug = new URLSearchParams(window.location.search).get('debug') === 'true';
    
    if (debug) {
      console.log('🔐 [DEBUG] Login request:', { email: data.email, password: '[REDACTED]' });
    } else {
      console.log('🔐 Login request:', { email: data.email });
    }
    
    const response = await apiService.post<AuthResponse>('/auth/login', data);
    
    if (debug) {
      console.log('🔐 [DEBUG] Login response:', response);
      console.log('🔐 [DEBUG] Token received:', response.data?.token ? 'Yes' : 'No');
      console.log('🔐 [DEBUG] User data:', response.data?.user);
    } else {
      console.log('🔐 Login response:', response);
    }
    
    if (response.success && response.data) {
      apiService.setToken(response.data.token);
      if (debug) {
        console.log('🔐 [DEBUG] Token saved to localStorage');
      }
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