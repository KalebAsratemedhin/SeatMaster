  /**
 * Invitations API endpoints
 */

import { baseApi } from './base';
import type {
  Invitation,
  CreateInvitationRequest,
  UpdateInvitationRequest,
  InvitationFilters,
  InvitationStats,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  BulkInvitationRequest,
  BulkInvitationResult,
  ResendInvitationResponse,
  PaginatedResponse,
} from '@/types';

export const invitationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get invitations for an event
    getInvitations: builder.query<PaginatedResponse<Invitation>, { eventId: string; filters?: InvitationFilters }>({
      query: ({ eventId, filters }) => ({
        url: `/events/${eventId}/invitations`,
        params: filters,
      }),
      providesTags: ['Invitation', 'Event'],
    }),

    // Get invitation by ID
    getInvitation: builder.query<Invitation, { eventId: string; invitationId: string }>({
      query: ({ eventId, invitationId }) => `/events/${eventId}/invitations/${invitationId}`,
      providesTags: ['Invitation'],
    }),

    // Create invitation
    createInvitation: builder.mutation<Invitation, { eventId: string; invitationData: CreateInvitationRequest }>({
      query: ({ eventId, invitationData }) => ({
        url: `/events/${eventId}/invitations`,
        method: 'POST',
        body: invitationData,
      }),
      invalidatesTags: ['Invitation', 'Event'],
    }),

    // Update invitation
    updateInvitation: builder.mutation<Invitation, { eventId: string; invitationId: string; updates: UpdateInvitationRequest }>({
      query: ({ eventId, invitationId, updates }) => ({
        url: `/events/${eventId}/invitations/${invitationId}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Invitation'],
    }),

    // Delete invitation
    deleteInvitation: builder.mutation<void, { eventId: string; invitationId: string }>({
      query: ({ eventId, invitationId }) => ({
        url: `/events/${eventId}/invitations/${invitationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Invitation'],
    }),

    // Resend invitation
    resendInvitation: builder.mutation<ResendInvitationResponse, { eventId: string; invitationId: string }>({
      query: ({ eventId, invitationId }) => ({
        url: `/events/${eventId}/invitations/${invitationId}/resend`,
        method: 'POST',
      }),
      invalidatesTags: ['Invitation'],
    }),

    // Cancel invitation
    cancelInvitation: builder.mutation<Invitation, { eventId: string; invitationId: string }>({
      query: ({ eventId, invitationId }) => ({
        url: `/events/${eventId}/invitations/${invitationId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['Invitation'],
    }),

    // Get invitation statistics
    getInvitationStats: builder.query<InvitationStats, string>({
      query: (eventId) => `/events/${eventId}/invitations/stats`,
      providesTags: ['Invitation', 'Event'],
    }),

    // Accept invitation (public endpoint)
    acceptInvitation: builder.mutation<AcceptInvitationResponse, AcceptInvitationRequest>({
      query: (acceptData) => ({
        url: `/invitations/${acceptData.token}/accept`,
        method: 'POST',
        body: acceptData,
      }),
      invalidatesTags: ['Invitation', 'Guest'],
    }),

    // Get invitation by token (public endpoint)
    getInvitationByToken: builder.query<Invitation, string>({
      query: (token) => `/invitations/${token}`,
      providesTags: ['Invitation'],
    }),


    // Clean up expired invitations
    cleanupExpiredInvitations: builder.mutation<{ cleaned: number }, string>({
      query: (eventId) => ({
        url: `/events/${eventId}/invitations/cleanup`,
        method: 'POST',
      }),
      invalidatesTags: ['Invitation', 'Event'],
    }),

    // Get invitation analytics
    getInvitationAnalytics: builder.query<{
      total_sent: number;
      total_accepted: number;
      acceptance_rate: number;
      response_timeline: Array<{
        date: string;
        sent: number;
        accepted: number;
      }>;
    }, string>({
      query: (eventId) => `/events/${eventId}/invitations/analytics`,
      providesTags: ['Invitation', 'Event'],
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
  useGetInvitationStatsQuery,
  useAcceptInvitationMutation,
  useGetInvitationByTokenQuery,
  useCleanupExpiredInvitationsMutation,
  useGetInvitationAnalyticsQuery,
} = invitationsApi;
