/**
 * Events API endpoints
 */

import { baseApi } from './base';
import type {
  Event,
  CreateEventRequest,
  UpdateEventRequest,
} from '@/types';

export const eventsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all events
    getEvents: builder.query<Event[], { page?: number; limit?: number; search?: string }>({
      query: (params) => ({
        url: '/events',
        params,
      }),
      transformResponse: (response: { events: Event[] }) => response.events,
      providesTags: ['Event'],
    }),

    // Get event by ID
    getEvent: builder.query<Event, string>({
      query: (id) => `/events/${id}`,
      transformResponse: (response: { event: Event }) => response.event,
      providesTags: ['Event'],
    }),

    // Create event
    createEvent: builder.mutation<Event, CreateEventRequest>({
      query: (event) => ({
        url: '/events',
        method: 'POST',
        body: event,
      }),
      transformResponse: (response: { event: Event }) => response.event,
      invalidatesTags: ['Event'],
    }),

    // Update event
    updateEvent: builder.mutation<Event, { id: string; updates: UpdateEventRequest }>({
      query: ({ id, updates }) => ({
        url: `/events/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      transformResponse: (response: { event: Event }) => response.event,
      invalidatesTags: ['Event'],
    }),

    // Delete event
    deleteEvent: builder.mutation<void, string>({
      query: (id) => ({
        url: `/events/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Event'],
    }),

  }),
});

export const {
  useGetEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} = eventsApi;