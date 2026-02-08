import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: { token: string | null } }).auth.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export type CreateEventRequest = {
  name: string;
  banner_url: string;
  visibility: string;
  event_type: string;
  message: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  latitude: number;
  longitude: number;
};

export type UpdateEventRequest = CreateEventRequest & { id: number };

export type EventResponse = {
  id: number;
  owner_id: number;
  name: string;
  banner_url: string;
  visibility: string;
  event_type: string;
  message: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
};

export type EventInviteResponse = {
  id: number;
  event_id: number;
  user_id: number;
  email: string;
  status: string;
  created_at: string;
};

export type ListPublicEventsParams = {
  search?: string;
  limit?: number;
  offset?: number;
};

export const eventsApi = createApi({
  reducerPath: "eventsApi",
  baseQuery,
  tagTypes: ["Events", "Event", "EventInvites"],
  endpoints: (builder) => ({
    createEvent: builder.mutation<EventResponse, CreateEventRequest>({
      query: (body) => ({ url: "/api/v1/events", method: "POST", body }),
      invalidatesTags: ["Events"],
    }),
    updateEvent: builder.mutation<EventResponse, UpdateEventRequest>({
      query: ({ id, ...body }) => ({
        url: `/api/v1/events/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Events", "Event"],
    }),
    deleteEvent: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/v1/events/${id}`, method: "DELETE" }),
      invalidatesTags: ["Events"],
    }),
    getEvent: builder.query<EventResponse, number>({
      query: (id) => `/api/v1/events/${id}`,
      providesTags: (_result, _err, id) => [{ type: "Event", id }],
    }),
    getMyEvents: builder.query<EventResponse[], void>({
      query: () => "/api/v1/events",
      providesTags: ["Events"],
    }),
    getInvitationEvents: builder.query<EventResponse[], void>({
      query: () => "/api/v1/events/invitations",
      providesTags: ["Events"],
    }),
    getPublicEvents: builder.query<EventResponse[], ListPublicEventsParams | void>({
      query: (params) => {
        const search = params?.search ?? "";
        const limit = params?.limit ?? 20;
        const offset = params?.offset ?? 0;
        const q = new URLSearchParams();
        if (search) q.set("search", search);
        q.set("limit", String(limit));
        q.set("offset", String(offset));
        return `/api/v1/events/public?${q.toString()}`;
      },
      providesTags: ["Events"],
    }),
    inviteToEvent: builder.mutation<EventInviteResponse, { eventId: number; email: string }>({
      query: ({ eventId, email }) => ({
        url: `/api/v1/events/${eventId}/invites`,
        method: "POST",
        body: { email },
      }),
      invalidatesTags: ["Events", "EventInvites"],
    }),
    getEventInvites: builder.query<EventInviteResponse[], number>({
      query: (eventId) => `/api/v1/events/${eventId}/invites`,
      providesTags: ["EventInvites"],
    }),
  }),
});

export const {
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useGetEventQuery,
  useGetMyEventsQuery,
  useGetInvitationEventsQuery,
  useGetPublicEventsQuery,
  useInviteToEventMutation,
  useGetEventInvitesQuery,
} = eventsApi;
