import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./api/authApi";
import { eventsApi } from "./api/eventsApi";
import authReducer from "./slices/authSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      [authApi.reducerPath]: authApi.reducer,
      [eventsApi.reducerPath]: eventsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(authApi.middleware, eventsApi.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];