"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/lib/store";
import { setApiStore } from "@/lib/api/axios";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => {
    const s = makeStore();
    setApiStore(s);
    return s;
  });
  return <Provider store={store}>{children}</Provider>;
}
