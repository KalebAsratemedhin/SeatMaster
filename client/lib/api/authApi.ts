import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./axiosBaseQuery";

export type RegisterRequest = { email: string; password: string };
export type LoginRequest = { email: string; password: string };
export type UserResponse = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string;
  created_at: string;
};
export type AuthResponse = { token: string; user: UserResponse };
export type UpdateProfileRequest = {
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Profile"],
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({ url: "/api/v1/auth/register", method: "POST", body }),
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: "/api/v1/auth/login", method: "POST", body }),
    }),
    getProfile: builder.query<UserResponse, void>({
      query: () => "/api/v1/users/me",
      providesTags: ["Profile"],
    }),
    updateProfile: builder.mutation<UserResponse, UpdateProfileRequest>({
      query: (body) => ({
        url: "/api/v1/users/me",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
} = authApi;