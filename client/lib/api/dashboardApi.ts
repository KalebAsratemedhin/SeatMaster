import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./axiosBaseQuery";

export type RecentRSVPItem = {
  guest_name: string;
  event_name: string;
  event_id: string;
  status: string;
  plus_one: string;
  response_time: string;
};

export type DashboardEventSummary = {
  id: string;
  name: string;
  event_date: string;
};

export type GuestStatsResponse = {
  total: number;
  confirmed: number;
  pending: number;
  declined: number;
};

export type MyRecentRSVPItem = {
  event_id: string;
  event_name: string;
  event_date: string;
  status: string;
  response_time: string;
};

export type DashboardResponse = {
  active_events: number;
  total_invited: number;
  confirmed: number;
  pending: number;
  declined: number;
  recent_rsvps: RecentRSVPItem[];
  upcoming_event: DashboardEventSummary | null;
  guest_stats?: GuestStatsResponse | null;
  my_recent_rsvps?: MyRecentRSVPItem[];
};

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Dashboard"],
  endpoints: (builder) => ({
    getDashboard: builder.query<DashboardResponse, void>({
      query: () => "/api/v1/dashboard",
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardQuery } = dashboardApi;
