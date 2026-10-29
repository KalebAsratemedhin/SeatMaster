"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { rehydrateFromStorage } from "@/lib/slices/authSlice";
import type { UserResponse } from "@/lib/api/authApi";
import type { AppDispatch } from "@/lib/store";

/**
 * Loads token/user from localStorage after mount so SSR HTML matches the
 * first client render (both start logged-out until this runs).
 */
export function AuthHydrator() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const raw = localStorage.getItem("user");
    if (token && raw) {
      try {
        const user = JSON.parse(raw) as UserResponse;
        dispatch(rehydrateFromStorage({ token, user }));
        return;
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    dispatch(rehydrateFromStorage(null));
  }, [dispatch]);

  return null;
}
