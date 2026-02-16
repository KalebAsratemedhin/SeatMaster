"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { useGetMyEventsQuery } from "@/lib/api/eventsApi";

/**
 * When a token exists, runs a single protected request to validate the session.
 * If the backend returns 401 (e.g. expired token), the axios interceptor
 * clears auth state and localStorage, so the UI updates to logged-out.
 */
export function SessionValidator() {
  const token = useSelector((state: RootState) => state.auth.token);
  useGetMyEventsQuery(undefined, { skip: !token });
  return null;
}
