import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./axiosBaseQuery";

export type EventChatThreadResponse = {
  id: string;
  event_id: string;
  owner_id: string;
  guest_id: string;
  guest_name: string;
  created_at: string;
};

export type EventChatMessageResponse = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type PaginatedChatMessagesResponse = {
  items: EventChatMessageResponse[];
  total: number;
};

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["ChatThreads", "ChatMessages"],
  endpoints: (builder) => ({
    listThreads: builder.query<EventChatThreadResponse[], string>({
      query: (eventId) => `/api/v1/events/${eventId}/chat/threads`,
      providesTags: (_result, _err, eventId) => [{ type: "ChatThreads", id: eventId }],
    }),
    getOrCreateThread: builder.query<
      EventChatThreadResponse,
      { eventId: string; guestId?: string }
    >({
      query: ({ eventId, guestId }) => {
        const q = guestId ? `?guest_id=${encodeURIComponent(guestId)}` : "";
        return `/api/v1/events/${eventId}/chat/thread${q}`;
      },
      providesTags: (_result, _err, { eventId }) => [{ type: "ChatThreads", id: eventId }],
    }),
    listMessages: builder.query<
      PaginatedChatMessagesResponse,
      { eventId: string; threadId: string; limit?: number; offset?: number }
    >({
      query: ({ eventId, threadId, limit = 50, offset = 0 }) =>
        `/api/v1/events/${eventId}/chat/threads/${threadId}/messages?limit=${limit}&offset=${offset}`,
      providesTags: (_result, _err, { threadId }) => [{ type: "ChatMessages", id: threadId }],
    }),
    sendMessage: builder.mutation<
      EventChatMessageResponse,
      { eventId: string; threadId: string; body: string }
    >({
      query: ({ eventId, threadId, body }) => ({
        url: `/api/v1/events/${eventId}/chat/threads/${threadId}/messages`,
        method: "POST",
        body: { body },
      }),
      invalidatesTags: (_result, _err, { threadId }) => [{ type: "ChatMessages", id: threadId }],
    }),
  }),
});

export const {
  useListThreadsQuery,
  useGetOrCreateThreadQuery,
  useLazyGetOrCreateThreadQuery,
  useListMessagesQuery,
  useSendMessageMutation,
} = chatApi;
