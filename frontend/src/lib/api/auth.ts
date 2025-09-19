/**
 * Authentication API endpoints
 */

import { baseApi } from './base';
import type {
  SignUpRequest,
  SignInRequest,
  AuthResponse,
  User,
  ChangePasswordRequest,
  UpdateUserProfileRequest,
} from '@/types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Sign up
    signUp: builder.mutation<AuthResponse, SignUpRequest>({
      query: (credentials) => ({
        url: '/auth/signup',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    // Sign in
    signIn: builder.mutation<AuthResponse, SignInRequest>({
      query: (credentials) => ({
        url: '/auth/signin',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    // Sign out
    signOut: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/signout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    // Get current user
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
      transformResponse: (response: { user: User }) => response.user,
      providesTags: ['User'],
    }),

    // Update user profile
    updateProfile: builder.mutation<User, UpdateUserProfileRequest>({
      query: (updates) => ({
        url: '/auth/profile',
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['User'],
    }),

    // Change password
    changePassword: builder.mutation<void, ChangePasswordRequest>({
      query: (passwords) => ({
        url: '/auth/change-password',
        method: 'POST',
        body: passwords,
      }),
    }),

    // Refresh token
    refreshToken: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    // Verify token
    verifyToken: builder.query<{ valid: boolean; user?: User }, void>({
      query: () => '/auth/verify',
      providesTags: ['User'],
    }),
  }),
});

export const {
  useSignUpMutation,
  useSignInMutation,
  useSignOutMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useRefreshTokenMutation,
  useVerifyTokenQuery,
} = authApi;
