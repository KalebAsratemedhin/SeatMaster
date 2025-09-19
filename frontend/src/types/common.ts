/**
 * Common types and utilities used across the application
 */

// Base entity interface that all models extend
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// API Response wrapper
export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
  success: boolean;
}

// Error response
export interface ApiError {
  error: string;
  message?: string;
  details?: Record<string, unknown>;
}

// User context for authentication
export interface UserContext {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

// Generic filter types
export interface BaseFilter {
  search?: string;
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
}

// Status enums
export type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled';

export type SortOrder = 'asc' | 'desc';

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;
