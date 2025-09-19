/**
 * Venues API endpoints
 */

import { baseApi } from './base';
import type {
  Venue,
  CreateVenueRequest,
  UpdateVenueRequest,
  VenueFilters,
  VenueStats,
  Room,
  CreateRoomRequest,
  UpdateRoomRequest,
  RoomFilters,
  Seat,
  CreateSeatRequest,
  UpdateSeatRequest,
  SeatFilters,
  PaginatedResponse,
} from '@/types';

export const venuesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Venue endpoints
    getVenues: builder.query<PaginatedResponse<Venue>, VenueFilters>({
      query: (filters) => ({
        url: '/venues',
        params: filters,
      }),
      providesTags: ['Venue'],
    }),

    getVenue: builder.query<Venue, string>({
      query: (id) => `/venues/${id}`,
      providesTags: (result, error, id) => [{ type: 'Venue', id }],
    }),

    createVenue: builder.mutation<Venue, CreateVenueRequest>({
      query: (venueData) => ({
        url: '/venues',
        method: 'POST',
        body: venueData,
      }),
      invalidatesTags: ['Venue'],
    }),

    updateVenue: builder.mutation<Venue, { id: string; updates: UpdateVenueRequest }>({
      query: ({ id, updates }) => ({
        url: `/venues/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Venue', id },
        'Venue',
      ],
    }),

    deleteVenue: builder.mutation<void, string>({
      query: (id) => ({
        url: `/venues/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Venue', id },
        'Venue',
      ],
    }),

    getVenueStats: builder.query<VenueStats, void>({
      query: () => '/venues/stats',
      providesTags: ['Venue'],
    }),

    // Room endpoints
    getRooms: builder.query<PaginatedResponse<Room>, { venueId: string; filters?: RoomFilters }>({
      query: ({ venueId, filters }) => ({
        url: `/venues/${venueId}/rooms`,
        params: filters,
      }),
      providesTags: ['Room', 'Venue'],
    }),

    getRoom: builder.query<Room, { venueId: string; roomId: string }>({
      query: ({ venueId, roomId }) => `/venues/${venueId}/rooms/${roomId}`,
      providesTags: ['Room'],
    }),

    createRoom: builder.mutation<Room, { venueId: string; roomData: CreateRoomRequest }>({
      query: ({ venueId, roomData }) => ({
        url: `/venues/${venueId}/rooms`,
        method: 'POST',
        body: roomData,
      }),
      invalidatesTags: ['Room', 'Venue'],
    }),

    updateRoom: builder.mutation<Room, { venueId: string; roomId: string; updates: UpdateRoomRequest }>({
      query: ({ venueId, roomId, updates }) => ({
        url: `/venues/${venueId}/rooms/${roomId}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Room'],
    }),

    deleteRoom: builder.mutation<void, { venueId: string; roomId: string }>({
      query: ({ venueId, roomId }) => ({
        url: `/venues/${venueId}/rooms/${roomId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Room'],
    }),

    // Seat endpoints
    getSeats: builder.query<PaginatedResponse<Seat>, { roomId: string; filters?: SeatFilters }>({
      query: ({ roomId, filters }) => ({
        url: `/rooms/${roomId}/seats`,
        params: filters,
      }),
      providesTags: ['Seat', 'Room'],
    }),

    getSeat: builder.query<Seat, { roomId: string; seatId: string }>({
      query: ({ roomId, seatId }) => `/rooms/${roomId}/seats/${seatId}`,
      providesTags: ['Seat'],
    }),

    createSeat: builder.mutation<Seat, { roomId: string; seatData: CreateSeatRequest }>({
      query: ({ roomId, seatData }) => ({
        url: `/rooms/${roomId}/seats`,
        method: 'POST',
        body: seatData,
      }),
      invalidatesTags: ['Seat', 'Room'],
    }),

    updateSeat: builder.mutation<Seat, { roomId: string; seatId: string; updates: UpdateSeatRequest }>({
      query: ({ roomId, seatId, updates }) => ({
        url: `/rooms/${roomId}/seats/${seatId}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Seat'],
    }),

    deleteSeat: builder.mutation<void, { roomId: string; seatId: string }>({
      query: ({ roomId, seatId }) => ({
        url: `/rooms/${roomId}/seats/${seatId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Seat'],
    }),

    // Bulk seat operations
    createBulkSeats: builder.mutation<Seat[], { roomId: string; seats: CreateSeatRequest[] }>({
      query: ({ roomId, seats }) => ({
        url: `/rooms/${roomId}/seats/bulk`,
        method: 'POST',
        body: { seats },
      }),
      invalidatesTags: ['Seat', 'Room'],
    }),

    updateSeatStatus: builder.mutation<Seat, { roomId: string; seatId: string; status: string }>({
      query: ({ roomId, seatId, status }) => ({
        url: `/rooms/${roomId}/seats/${seatId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Seat'],
    }),
  }),
});

export const {
  // Venue hooks
  useGetVenuesQuery,
  useGetVenueQuery,
  useCreateVenueMutation,
  useUpdateVenueMutation,
  useDeleteVenueMutation,
  useGetVenueStatsQuery,
  
  // Room hooks
  useGetRoomsQuery,
  useGetRoomQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  
  // Seat hooks
  useGetSeatsQuery,
  useGetSeatQuery,
  useCreateSeatMutation,
  useUpdateSeatMutation,
  useDeleteSeatMutation,
  useCreateBulkSeatsMutation,
  useUpdateSeatStatusMutation,
} = venuesApi;
