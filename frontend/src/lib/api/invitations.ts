  /**
 * Invitations API endpoints
 */

import { baseApi } from './base';
import type {
  Invitation,
  InvitationListItem,
  CreateInvitationRequest,
  UpdateInvitationRequest,
  InvitationFilters,
  InvitationStats,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  ResendInvitationResponse,
} from '@/types';

export const invitationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get invitations for an event
    getInvitations: builder.query<InvitationListItem[], { eventId: string; filters?: InvitationFilters }>({
      query: ({ eventId, filters }) => ({
        url: `/events/${eventId}/invitations`,
        params: filters,
      }),
      transformResponse: (response: InvitationListItem[]) => response,
      providesTags: (result, error, { eventId }) => [
        { type: 'Invitation', id: 'LIST' },
        { type: 'Invitation', id: `LIST-${eventId}` },
        ...(result || []).map(({ id }) => ({ type: 'Invitation' as const, id })),
      ],
    }),

    // Get invitation by ID
    getInvitation: builder.query<Invitation, { eventId: string; invitationId: string }>({
      query: ({ eventId, invitationId }) => `/events/${eventId}/invitations/${invitationId}`,
      transformResponse: (response: Invitation) => response,
      providesTags: (result, error, { invitationId }) => [
        { type: 'Invitation', id: invitationId },
      ],
    }),

    // Create invitation
    createInvitation: builder.mutation<Invitation, { eventId: string; invitationData: CreateInvitationRequest }>({
      query: ({ eventId, invitationData }) => ({
        url: `/events/${eventId}/invitations`,
        method: 'POST',
        body: invitationData,
      }),
      transformResponse: (response: Invitation) => response,
      invalidatesTags: (result, error, { eventId }) => [
        { type: 'Invitation', id: 'LIST' },
        { type: 'Invitation', id: `LIST-${eventId}` },
      ],
    }),

    // Update invitation
    updateInvitation: builder.mutation<Invitation, { eventId: string; invitationId: string; updates: UpdateInvitationRequest }>({
      query: ({ eventId, invitationId, updates }) => ({
        url: `/events/${eventId}/invitations/${invitationId}`,
        method: 'PATCH',
        body: updates,
      }),
      transformResponse: (response: Invitation) => response,
      invalidatesTags: (result, error, { eventId, invitationId }) => [
        { type: 'Invitation', id: 'LIST' },
        { type: 'Invitation', id: `LIST-${eventId}` },
        { type: 'Invitation', id: invitationId },
      ],
    }),

    // Delete invitation
    deleteInvitation: builder.mutation<void, { eventId: string; invitationId: string }>({
      query: ({ eventId, invitationId }) => ({
        url: `/events/${eventId}/invitations/${invitationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { eventId, invitationId }) => [
        { type: 'Invitation', id: 'LIST' },
        { type: 'Invitation', id: `LIST-${eventId}` },
        { type: 'Invitation', id: invitationId },
      ],
    }),

    // Resend invitation
    resendInvitation: builder.mutation<Invitation, { eventId: string; invitationId: string }>({
      query: ({ eventId, invitationId }) => ({
        url: `/events/${eventId}/invitations/${invitationId}/resend`,
        method: 'POST',
      }),
      transformResponse: (response: Invitation) => response,
      invalidatesTags: (result, error, { eventId, invitationId }) => [
        { type: 'Invitation', id: 'LIST' },
        { type: 'Invitation', id: `LIST-${eventId}` },
        { type: 'Invitation', id: invitationId },
      ],
    }),

    // Cancel invitation (DELETE endpoint)
    cancelInvitation: builder.mutation<void, { eventId: string; invitationId: string }>({
      query: ({ eventId, invitationId }) => ({
        url: `/events/${eventId}/invitations/${invitationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { eventId, invitationId }) => [
        { type: 'Invitation', id: 'LIST' },
        { type: 'Invitation', id: `LIST-${eventId}` },
        { type: 'Invitation', id: invitationId },
      ],
    }),

    // Accept invitation (public endpoint)
    acceptInvitation: builder.mutation<AcceptInvitationResponse, { token: string; data: AcceptInvitationRequest }>({
      query: ({ token, data }) => ({
        url: `/invitations/${token}/accept`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Invitation', 'Guest'],
    }),

    // Get invitation by token (public endpoint)
    getInvitationByToken: builder.query<Invitation, string>({
      query: (token) => `/invitations/${token}`,
      transformResponse: (response: Invitation) => response,
      providesTags: (result, error, token) => [
        { type: 'Invitation', id: `TOKEN-${token}` },
      ],
    }),
  }),
});

export const {
  useGetInvitationsQuery,
  useGetInvitationQuery,
  useCreateInvitationMutation,
  useUpdateInvitationMutation,
  useDeleteInvitationMutation,
  useResendInvitationMutation,
  useCancelInvitationMutation,
  useAcceptInvitationMutation,
  useGetInvitationByTokenQuery,
} = invitationsApi;
