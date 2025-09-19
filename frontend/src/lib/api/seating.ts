/**
 * Seating assignments API endpoints
 */

import { baseApi } from './base';
import type {
  SeatingAssignment,
  CreateSeatingAssignmentRequest,
  UpdateSeatingAssignmentRequest,
  SeatingChartResponse,
  SeatingStats,
  SeatingAssignmentFilters,
  BulkSeatingAssignmentRequest,
  BulkSeatingAssignmentResult,
  SeatAvailabilityResponse,
  AutoAssignmentOptions,
  AutoAssignmentResult,
  PaginatedResponse,
} from '@/types';

export const seatingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get seating assignments for an event
    getSeatingAssignments: builder.query<PaginatedResponse<SeatingAssignment>, { eventId: string; filters?: SeatingAssignmentFilters }>({
      query: ({ eventId, filters }) => ({
        url: `/events/${eventId}/seating`,
        params: filters,
      }),
      providesTags: ['SeatingAssignment', 'Event'],
    }),

    // Get seating chart for an event
    getSeatingChart: builder.query<SeatingChartResponse, string>({
      query: (eventId) => `/events/${eventId}/seating/chart`,
      providesTags: ['SeatingAssignment', 'Event'],
    }),

    // Assign guest to seat
    assignGuestToSeat: builder.mutation<SeatingAssignment, { eventId: string; assignmentData: CreateSeatingAssignmentRequest }>({
      query: ({ eventId, assignmentData }) => ({
        url: `/events/${eventId}/seating/assign`,
        method: 'POST',
        body: assignmentData,
      }),
      invalidatesTags: ['SeatingAssignment', 'Event', 'Seat'],
    }),

    // Update seating assignment
    updateSeatingAssignment: builder.mutation<SeatingAssignment, { eventId: string; assignmentId: string; updates: UpdateSeatingAssignmentRequest }>({
      query: ({ eventId, assignmentId, updates }) => ({
        url: `/events/${eventId}/seating/assignments/${assignmentId}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['SeatingAssignment', 'Event', 'Seat'],
    }),

    // Unassign guest from seat
    unassignGuestFromSeat: builder.mutation<void, { eventId: string; seatId: string }>({
      query: ({ eventId, seatId }) => ({
        url: `/events/${eventId}/seating/assign/${seatId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SeatingAssignment', 'Event', 'Seat'],
    }),

    // Get seating statistics
    getSeatingStats: builder.query<SeatingStats, string>({
      query: (eventId) => `/events/${eventId}/seating/stats`,
      providesTags: ['SeatingAssignment', 'Event'],
    }),

    // Check seat availability
    checkSeatAvailability: builder.query<SeatAvailabilityResponse, { eventId: string; seatId: string }>({
      query: ({ eventId, seatId }) => `/events/${eventId}/seating/availability/${seatId}`,
      providesTags: ['Seat', 'SeatingAssignment'],
    }),

    // Bulk seating assignments
    bulkAssignSeats: builder.mutation<BulkSeatingAssignmentResult, { eventId: string; assignments: BulkSeatingAssignmentRequest }>({
      query: ({ eventId, assignments }) => ({
        url: `/events/${eventId}/seating/bulk-assign`,
        method: 'POST',
        body: assignments,
      }),
      invalidatesTags: ['SeatingAssignment', 'Event', 'Seat'],
    }),

    // Auto-assign seats
    autoAssignSeats: builder.mutation<AutoAssignmentResult, { eventId: string; options: AutoAssignmentOptions }>({
      query: ({ eventId, options }) => ({
        url: `/events/${eventId}/seating/auto-assign`,
        method: 'POST',
        body: options,
      }),
      invalidatesTags: ['SeatingAssignment', 'Event', 'Seat'],
    }),

    // Clear all seating assignments
    clearAllAssignments: builder.mutation<{ cleared: number }, string>({
      query: (eventId) => ({
        url: `/events/${eventId}/seating/clear`,
        method: 'POST',
      }),
      invalidatesTags: ['SeatingAssignment', 'Event', 'Seat'],
    }),

    // Get seating conflicts
    getSeatingConflicts: builder.query<Array<{
      guest_id: string;
      guest_name: string;
      conflict_reason: string;
      suggested_seats: string[];
    }>, string>({
      query: (eventId) => `/events/${eventId}/seating/conflicts`,
      providesTags: ['SeatingAssignment', 'Event'],
    }),

    // Export seating chart
    exportSeatingChart: builder.query<Blob, { eventId: string; format?: string }>({
      query: ({ eventId, format = 'pdf' }) => ({
        url: `/events/${eventId}/seating/export`,
        params: { format },
        responseHandler: (response: Response) => response.blob(),
      }),
    }),

    // Get seating timeline
    getSeatingTimeline: builder.query<Array<{
      date: string;
      assignments: number;
      unassignments: number;
    }>, string>({
      query: (eventId) => `/events/${eventId}/seating/timeline`,
      providesTags: ['SeatingAssignment', 'Event'],
    }),
  }),
});

export const {
  useGetSeatingAssignmentsQuery,
  useGetSeatingChartQuery,
  useAssignGuestToSeatMutation,
  useUpdateSeatingAssignmentMutation,
  useUnassignGuestFromSeatMutation,
  useGetSeatingStatsQuery,
  useCheckSeatAvailabilityQuery,
  useBulkAssignSeatsMutation,
  useAutoAssignSeatsMutation,
  useClearAllAssignmentsMutation,
  useGetSeatingConflictsQuery,
  useLazyExportSeatingChartQuery,
  useGetSeatingTimelineQuery,
} = seatingApi;
