import axios, { type AxiosError } from "axios";
import type { AppStore } from "@/lib/store";
import { logout } from "@/lib/slices/authSlice";

const baseURL =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
    : "http://localhost:8080";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

let store: AppStore | null = null;

export function setApiStore(s: AppStore) {
  store = s;
}

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token =
    store?.getState?.()?.auth?.token ?? localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401 && store) {
      store.dispatch(logout());
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    return Promise.reject(err);
  }
);
