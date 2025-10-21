import type { AuthResponse, User, SignupForm, LoginForm } from '@/types';
import { apiService } from './api';

export class AuthService {
  async signup(data: SignupForm): Promise<AuthResponse> {
    const debug = new URLSearchParams(window.location.search).get('debug') === 'true';
    
    // Only send required fields (username, email, password)
    // Remove confirmPassword and optional fields that aren't being collected
    const signupData = {
      username: data.username,
      email: data.email,
      password: data.password,
    };
    
    if (debug) {
      console.log('🔐 [DEBUG] Signup request:', { ...signupData, password: '[REDACTED]' });
    } else {
      console.log('🔐 Signup request:', { ...signupData, password: '[REDACTED]' });
    }
    
    try {
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
    } catch (error: any) {
      // Extract error message from response
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Signup failed';
      if (debug) {
        console.error('🔐 [DEBUG] Signup error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: errorMessage
        });
      }
      throw new Error(errorMessage);
    }
  }

  async login(data: LoginForm): Promise<AuthResponse> {
    const debug = new URLSearchParams(window.location.search).get('debug') === 'true';
    
    if (debug) {
      console.log('🔐 [DEBUG] Login request:', { email: data.email, password: '[REDACTED]' });
    } else {
      console.log('🔐 Login request:', { email: data.email });
    }
    
    try {
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
    } catch (error: any) {
      // Extract error message from response
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed';
      if (debug) {
        console.error('🔐 [DEBUG] Login error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: errorMessage
        });
      }
      throw new Error(errorMessage);
    }
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