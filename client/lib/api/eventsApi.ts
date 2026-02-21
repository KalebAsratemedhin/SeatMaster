import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./axiosBaseQuery";

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
  seat_id?: number | null;
  created_at: string;
};

export type EventSeatResponse = {
  id: number;
  event_table_id: number;
  label: string;
  display_order: number;
  invite_id?: number | null;
};

export type EventTableResponse = {
  id: number;
  event_id: number;
  name: string;
  shape: "round" | "rectangular" | "grid";
  rows?: number | null;
  columns?: number | null;
  capacity: number;
  display_order: number;
  position_x?: number;
  position_y?: number;
  seats: EventSeatResponse[];
};

export type PaginatedEventsResponse = { items: EventResponse[]; total: number };
export type PaginatedInvitationsResponse = { items: InvitationWithEventResponse[]; total: number };
export type PaginatedInvitesResponse = { items: EventInviteResponse[]; total: number };

export type CreateEventTableRequest = {
  capacity?: number;
  shape: "round" | "rectangular" | "grid";
  rows?: number;
  columns?: number;
};
export type UpdateEventTableRequest = {
  shape?: "round" | "rectangular" | "grid";
  rows?: number;
  columns?: number;
  capacity?: number;
  position_x?: number;
  position_y?: number;
  display_order?: number;
};

export type InvitationWithEventResponse = {
  event: EventResponse;
  invite: EventInviteResponse;
};

export type ListPublicEventsParams = {
  search?: string;
  limit?: number;
  offset?: number;
};

export const eventsApi = createApi({
  reducerPath: "eventsApi",
  baseQuery: axiosBaseQuery(),
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
    getMyEvents: builder.query<PaginatedEventsResponse, { limit?: number; offset?: number } | void>({
      query: (params) => {
        const limit = params?.limit ?? 12;
        const offset = params?.offset ?? 0;
        return `/api/v1/events?limit=${limit}&offset=${offset}`;
      },
      providesTags: ["Events"],
    }),
    getInvitationEvents: builder.query<EventResponse[], void>({
      query: () => "/api/v1/events/invitations",
      providesTags: ["Events"],
    }),
    getMyInvitations: builder.query<PaginatedInvitationsResponse, { limit?: number; offset?: number } | void>({
      query: (params) => {
        const limit = params?.limit ?? 12;
        const offset = params?.offset ?? 0;
        return `/api/v1/invitations?limit=${limit}&offset=${offset}`;
      },
      providesTags: ["Events"],
    }),
    respondToInvite: builder.mutation<
      EventInviteResponse,
      { eventId: number; status: "confirmed" | "declined"; seat_id?: number | null }
    >({
      query: ({ eventId, status, seat_id }) => ({
        url: `/api/v1/events/${eventId}/rsvp`,
        method: "PUT",
        body: { status, seat_id: seat_id ?? undefined },
      }),
      invalidatesTags: ["Events", "EventInvites"],
    }),
    getEventSeating: builder.query<EventTableResponse[], number>({
      query: (eventId) => `/api/v1/events/${eventId}/seating`,
      providesTags: ["EventInvites"],
    }),
    createEventTable: builder.mutation<EventTableResponse, { eventId: number; body: CreateEventTableRequest }>({
      query: ({ eventId, body }) => ({
        url: `/api/v1/events/${eventId}/tables`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Event", "EventInvites"],
    }),
    updateEventTable: builder.mutation<
      EventTableResponse,
      { eventId: number; tableId: number; body: UpdateEventTableRequest }
    >({
      query: ({ eventId, tableId, body }) => ({
        url: `/api/v1/events/${eventId}/tables/${tableId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Event", "EventInvites"],
    }),
    deleteEventTable: builder.mutation<void, { eventId: number; tableId: number }>({
      query: ({ eventId, tableId }) => ({
        url: `/api/v1/events/${eventId}/tables/${tableId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Event", "EventInvites"],
    }),
    reorderEventTables: builder.mutation<void, { eventId: number; tableIds: number[] }>({
      query: ({ eventId, tableIds }) => ({
        url: `/api/v1/events/${eventId}/seating/order`,
        method: "PUT",
        body: { table_ids: tableIds },
      }),
      invalidatesTags: ["Event", "EventInvites"],
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
    getEventInvites: builder.query<PaginatedInvitesResponse, { eventId: number; limit?: number; offset?: number }>({
      query: ({ eventId, limit = 50, offset = 0 }) =>
        `/api/v1/events/${eventId}/invites?limit=${limit}&offset=${offset}`,
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
  useGetMyInvitationsQuery,
  useRespondToInviteMutation,
  useGetPublicEventsQuery,
  useInviteToEventMutation,
  useGetEventInvitesQuery,
  useGetEventSeatingQuery,
  useCreateEventTableMutation,
  useUpdateEventTableMutation,
  useDeleteEventTableMutation,
  useReorderEventTablesMutation,
} = eventsApi;
