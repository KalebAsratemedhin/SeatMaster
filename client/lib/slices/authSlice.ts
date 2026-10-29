import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserResponse } from "@/lib/api/authApi";

type AuthState = {
  token: string | null;
  user: UserResponse | null;
  /** False until client reads localStorage — keeps SSR and first client paint aligned. */
  hasHydrated: boolean;
};

const initialState: AuthState = {
  token: null,
  user: null,
  hasHydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    rehydrateFromStorage: (
      state,
      action: PayloadAction<{ token: string; user: UserResponse } | null>
    ) => {
      if (action.payload) {
        state.token = action.payload.token;
        state.user = action.payload.user;
      }
      state.hasHydrated = true;
    },
    setCredentials: (state, action: { payload: { token: string; user: UserResponse } }) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.hasHydrated = true;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    },
  },
});

export const { setCredentials, logout, rehydrateFromStorage } = authSlice.actions;
export default authSlice.reducer;
