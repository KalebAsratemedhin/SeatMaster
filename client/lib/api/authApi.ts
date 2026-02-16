import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./axiosBaseQuery";

export type RegisterRequest = { email: string; password: string };
export type LoginRequest = { email: string; password: string };
export type UserResponse = { id: number; email: string; created_at: string };
export type AuthResponse = { token: string; user: UserResponse };

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({ url: "/api/v1/auth/register", method: "POST", body }),
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: "/api/v1/auth/login", method: "POST", body }),
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation } = authApi;