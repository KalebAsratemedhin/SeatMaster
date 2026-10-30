import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./axiosBaseQuery";

/** REQ-007 — public profile fields returned by user search. */
export type UserSearchHit = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string | null;
};

export type UserSearchResponse = {
  items: UserSearchHit[];
  total: number;
};

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    searchUsers: builder.query<
      UserSearchResponse,
      { q: string; limit?: number; offset?: number }
    >({
      query: ({ q, limit = 20, offset = 0 }) => {
        const params = new URLSearchParams();
        params.set("q", q);
        params.set("limit", String(limit));
        params.set("offset", String(offset));
        return `/api/v1/users/search?${params.toString()}`;
      },
    }),
  }),
});

export const { useSearchUsersQuery, useLazySearchUsersQuery } = usersApi;
