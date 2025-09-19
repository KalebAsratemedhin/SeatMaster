/**
 * Main types export file
 * Centralized export of all type definitions
 */

// Common types
export * from './common';

// Authentication types
export * from './auth';

// Event types
export * from './event';

// Guest types
export * from './guest';

// Invitation types
export * from './invitation';

// Venue types
export * from './venue';

// Seating types
export * from './seating';

// Guest management types
export * from './guest-management';

// Bulk operations types
export * from './bulk-operations';

// API response types
export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: Record<string, unknown>;
  status_code: number;
}

export interface ApiSuccessResponse<T = unknown> {
  data: T;
  message?: string;
  status_code: number;
}

// Generic API response wrapper
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// RTK Query base query args
export interface BaseQueryArgs {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

// Pagination meta
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Search and filter base
export interface SearchParams {
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// File upload types
export interface FileUploadResponse {
  id: string;
  filename: string;
  original_name: string;
  size: number;
  mime_type: string;
  url: string;
  created_at: string;
}

export interface FileUploadRequest {
  file: File;
  category?: string;
  description?: string;
}
