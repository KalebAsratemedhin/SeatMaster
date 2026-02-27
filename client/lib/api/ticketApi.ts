import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./axiosBaseQuery";

export type TicketResponse = {
  ticket_id: string;
  guest_name: string;
  event_name: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
};

export const ticketApi = createApi({
  reducerPath: "ticketApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Ticket"],
  endpoints: (builder) => ({
    getTicket: builder.query<TicketResponse, string>({
      query: (eventId) => `/api/v1/events/${eventId}/ticket`,
      providesTags: (_result, _err, eventId) => [{ type: "Ticket", id: eventId }],
    }),
  }),
});

export const { useGetTicketQuery } = ticketApi;
