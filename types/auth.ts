export type AuthMode = 'login' | 'register';

export interface User {
  uuid: string;
  email: string;
  name: string;
  created_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export type MeResponse = User;

export interface LogoutResponse {
  message: string;
}

export interface RefreshResponse {
  message: string;
}

export interface ApiValidationError {
  message?: string | string[];
  errors?: Record<string, string | string[]> | string[] | string;
  [key: string]: unknown;
}
