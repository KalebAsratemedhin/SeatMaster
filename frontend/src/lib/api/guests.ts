/**
 * Guests API endpoints
 */

import { baseApi } from './base';
import type {
  Guest,
  CreateGuestRequest,
  UpdateGuestRequest,
  UpdateGuestRSVPRequest,
  GuestSummary,
  UserEventRegistrationRequest,
  UserEventRegistrationResponse,
} from '@/types';

export const guestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get guests for an event
    getGuests: builder.query<Guest[], { eventId: string; page?: number; limit?: number; search?: string }>({
      query: ({ eventId, ...params }) => ({
        url: `/events/${eventId}/guests`,
        params,
      }),
      transformResponse: (response: { guests: Guest[] }) => response.guests,
      providesTags: (result, error, { eventId }) => [
        { type: 'Guest', id: 'LIST' },
        { type: 'Guest', id: `LIST-${eventId}` },
        ...(result || []).map(({ id }) => ({ type: 'Guest' as const, id })),
      ],
    }),

    // Get guest by ID
    getGuest: builder.query<Guest, { eventId: string; guestId: string }>({
      query: ({ eventId, guestId }) => `/events/${eventId}/guests/${guestId}`,
      transformResponse: (response: { guest: Guest }) => response.guest,
      providesTags: ['Guest'],
    }),

    // Create guest
    createGuest: builder.mutation<Guest, { eventId: string; guest: CreateGuestRequest }>({
      query: ({ eventId, guest }) => ({
        url: `/events/${eventId}/guests`,
        method: 'POST',
        body: guest,
      }),
      transformResponse: (response: { guest: Guest }) => response.guest,
      invalidatesTags: (result, error, { eventId }) => [
        { type: 'Guest', id: 'LIST' },
        { type: 'Guest', id: `LIST-${eventId}` },
        { type: 'Guest', id: `SUMMARY-${eventId}` },
      ],
    }),

    // Update guest
    updateGuest: builder.mutation<Guest, { eventId: string; guestId: string; updates: UpdateGuestRequest }>({
      query: ({ eventId, guestId, updates }) => ({
        url: `/events/${eventId}/guests/${guestId}`,
        method: 'PATCH',
        body: updates,
      }),
      transformResponse: (response: { guest: Guest }) => response.guest,
      invalidatesTags: (result, error, { eventId }) => [
        { type: 'Guest', id: 'LIST' },
        { type: 'Guest', id: `LIST-${eventId}` },
        { type: 'Guest', id: result?.id },
      ],
    }),

    // Delete guest
    deleteGuest: builder.mutation<void, { eventId: string; guestId: string }>({
      query: ({ eventId, guestId }) => ({
        url: `/events/${eventId}/guests/${guestId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { eventId }) => [
        { type: 'Guest', id: 'LIST' },
        { type: 'Guest', id: `LIST-${eventId}` },
      ],
    }),

    // Update guest RSVP
    updateGuestRSVP: builder.mutation<Guest, { eventId: string; guestId: string; rsvpData: UpdateGuestRSVPRequest }>({
      query: ({ eventId, guestId, rsvpData }) => ({
        url: `/events/${eventId}/guests/${guestId}/rsvp`,
        method: 'PATCH',
        body: rsvpData,
      }),
      transformResponse: (response: { guest: Guest }) => response.guest,
      invalidatesTags: (result, error, { eventId }) => [
        { type: 'Guest', id: 'LIST' },
        { type: 'Guest', id: `LIST-${eventId}` },
        { type: 'Guest', id: result?.id },
      ],
    }),

    // Approve guest
    approveGuest: builder.mutation<Guest, { eventId: string; guestId: string }>({
      query: ({ eventId, guestId }) => ({
        url: `/events/${eventId}/guests/${guestId}/approve`,
        method: 'POST',
      }),
      transformResponse: (response: { guest: Guest }) => response.guest,
      invalidatesTags: (result, error, { eventId }) => [
        { type: 'Guest', id: 'LIST' },
        { type: 'Guest', id: `LIST-${eventId}` },
        { type: 'Guest', id: result?.id },
      ],
    }),

    // Get guest summary
    getGuestSummary: builder.query<GuestSummary, { eventId: string }>({
      query: ({ eventId }) => `/events/${eventId}/guests/summary`,
      providesTags: (result, error, { eventId }) => [
        { type: 'Guest', id: `SUMMARY-${eventId}` },
      ],
    }),

    // Register for event (user self-registration)
    registerForEvent: builder.mutation<UserEventRegistrationResponse, { eventId: string; registrationData: UserEventRegistrationRequest }>({
      query: ({ eventId, registrationData }) => ({
        url: `/events/${eventId}/register`,
        method: 'POST',
        body: registrationData,
      }),
      invalidatesTags: ['Guest', 'Event'],
    }),

    // Get user registrations
    getUserRegistrations: builder.query<Guest[], void>({
      query: () => '/events/user/registrations',
      transformResponse: (response: { registrations: Guest[] }) => response.registrations,
      providesTags: ['Guest'],
    }),

    // Update user registration
    updateUserRegistration: builder.mutation<Guest, { eventId: string; updates: UpdateGuestRequest }>({
      query: ({ eventId, updates }) => ({
        url: `/events/${eventId}/registration`,
        method: 'PATCH',
        body: updates,
      }),
      transformResponse: (response: { guest: Guest }) => response.guest,
      invalidatesTags: ['Guest'],
    }),

    // Cancel user registration
    cancelUserRegistration: builder.mutation<void, { eventId: string }>({
      query: ({ eventId }) => ({
        url: `/events/${eventId}/registration`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Guest', 'Event'],
    }),

  }),
});

export const {
  useGetGuestsQuery,
  useGetGuestQuery,
  useCreateGuestMutation,
  useUpdateGuestMutation,
  useDeleteGuestMutation,
  useUpdateGuestRSVPMutation,
  useApproveGuestMutation,
  useGetGuestSummaryQuery,
  useRegisterForEventMutation,
  useGetUserRegistrationsQuery,
  useUpdateUserRegistrationMutation,
  useCancelUserRegistrationMutation,
} = guestsApi;