import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./api/authApi";
import { eventsApi } from "./api/eventsApi";
import { commentsApi } from "./api/commentsApi";
import { chatApi } from "./api/chatApi";
import { dashboardApi } from "./api/dashboardApi";
import { ticketApi } from "./api/ticketApi";
import authReducer from "./slices/authSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      [authApi.reducerPath]: authApi.reducer,
      [eventsApi.reducerPath]: eventsApi.reducer,
      [commentsApi.reducerPath]: commentsApi.reducer,
      [chatApi.reducerPath]: chatApi.reducer,
      [dashboardApi.reducerPath]: dashboardApi.reducer,
      [ticketApi.reducerPath]: ticketApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        authApi.middleware,
        eventsApi.middleware,
        commentsApi.middleware,
        chatApi.middleware,
        dashboardApi.middleware,
        ticketApi.middleware
      ),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];