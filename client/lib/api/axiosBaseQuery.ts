import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import type { AxiosRequestConfig, AxiosError } from "axios";
import { api } from "./axios";

export type AxiosBaseQueryArgs =
  | string
  | {
      url: string;
      method?: string;
      data?: unknown;
      body?: unknown;
      params?: unknown;
    };

export const axiosBaseQuery =
  (): BaseQueryFn<
    AxiosBaseQueryArgs,
    unknown,
    { status?: number; data?: unknown }
  > =>
  async (args) => {
    try {
      const config: AxiosRequestConfig =
        typeof args === "string"
          ? { url: args, method: "GET" }
          : {
              url: args.url,
              method: (args.method as AxiosRequestConfig["method"]) ?? "GET",
              data: (args as { body?: unknown }).body ?? (args as { data?: unknown }).data,
              params: args.params,
            };
      const res = await api.request(config);
      return { data: res.data };
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      return {
        error: {
          status: axiosErr.response?.status,
          data: axiosErr.response?.data,
        },
      };
    }
  };
