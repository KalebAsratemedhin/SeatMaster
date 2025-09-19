/**
 * Authentication related types
 */

import { BaseEntity } from './common';

// User model
export interface User extends BaseEntity {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  // Note: password is not included in frontend types for security
}

// Authentication request/response types
export interface SignUpRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expires_at: string;
}

export type SignUpResponse = AuthResponse;

export type SignInResponse = AuthResponse;

// User profile types
export type UserProfile = User;

export interface UpdateUserProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

// Password change types
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// Token validation
export interface TokenValidationResponse {
  valid: boolean;
  user?: User;
  expires_at?: string;
}
