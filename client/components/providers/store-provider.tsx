"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "@/lib/store";
import { setApiStore } from "@/lib/api/axios";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
    setApiStore(storeRef.current);
  }
  return <Provider store={storeRef.current}>{children}</Provider>;
}