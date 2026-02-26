import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./axiosBaseQuery";

export type EventCommentResponse = {
  id: string;
  event_id: string;
  parent_id?: string | null;
  user_id: string;
  author: string;
  body: string;
  created_at: string;
};

export type PaginatedCommentsResponse = {
  items: EventCommentResponse[];
  total: number;
};

export type CreateCommentRequest = { body: string; parent_id?: string | null };

export const commentsApi = createApi({
  reducerPath: "commentsApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["EventComments"],
  endpoints: (builder) => ({
    listComments: builder.query<
      PaginatedCommentsResponse,
      { eventId: string; limit?: number; offset?: number }
    >({
      query: ({ eventId, limit = 200, offset = 0 }) =>
        `/api/v1/events/${eventId}/comments?limit=${limit}&offset=${offset}`,
      providesTags: (_result, _err, { eventId }) => [{ type: "EventComments", id: eventId }],
    }),
    createComment: builder.mutation<
      EventCommentResponse,
      { eventId: string; body: string; parentId?: string | null }
    >({
      query: ({ eventId, body, parentId }) => ({
        url: `/api/v1/events/${eventId}/comments`,
        method: "POST",
        body: { body, parent_id: parentId ?? undefined },
      }),
      invalidatesTags: (_result, _err, { eventId }) => [{ type: "EventComments", id: eventId }],
    }),
  }),
});

export const {
  useListCommentsQuery,
  useCreateCommentMutation,
} = commentsApi;
