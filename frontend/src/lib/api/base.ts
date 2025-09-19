/**
 * Base API configuration and utilities
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// API base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    // Get token from localStorage for now (can be moved to Redux later)
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    headers.set('content-type', 'application/json');
    return headers;
  },
});

// Base query with error handling
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  const result = await baseQuery(args, api, extraOptions);
  
  // Handle 401 errors (unauthorized)
  if (result.error && result.error.status === 401) {
    // Clear token and redirect to login
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  }
  
  return result;
};

// Create the base API with simplified tags
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User', 
    'Event', 
    'Guest', 
    'Venue', 
    'BulkOperation',
    'Invitation',
    'GuestCategory',
    'GuestTag',
    'GuestCommunication',
    'PlusOne',
    'SeatingAssignment',
    'Seat',
    'Room'
  ],
  endpoints: () => ({}),
});

// Common query parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SearchParams {
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Common response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
  success: boolean;
}

// Error handling utilities
export const handleApiError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'data' in error) {
    const errorData = error.data as Record<string, unknown>;
    if (errorData?.error) {
      return String(errorData.error);
    }
    if (errorData?.message) {
      return String(errorData.message);
    }
    if (typeof errorData === 'string') {
      return errorData;
    }
  }
  return 'An unexpected error occurred';
};

// Query parameter builders
export const buildQueryParams = (params: Record<string, unknown>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, item.toString()));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });
  
  return searchParams.toString();
};
