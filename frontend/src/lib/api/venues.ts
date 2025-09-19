/**
 * Venues, Rooms, and Seats API endpoints
 */

import { baseApi } from './base';
import type {
  Venue,
  Room,
  Seat,
  CreateVenueRequest,
  UpdateVenueRequest,
  CreateRoomRequest,
  UpdateRoomRequest,
  CreateSeatRequest,
  UpdateSeatRequest,
  AssignGuestToSeatRequest,
  UnassignGuestFromSeatRequest,
} from '@/types';

export const venuesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Venues
    getVenues: builder.query<Venue[], void>({
      query: () => '/venues',
      transformResponse: (response: { venues: Venue[] }) => response.venues,
      providesTags: ['Venue'],
    }),

    getVenue: builder.query<Venue, string>({
      query: (id) => `/venues/${id}`,
      transformResponse: (response: { venue: Venue }) => response.venue,
      providesTags: (result, error, id) => [{ type: 'Venue', id }],
    }),

    createVenue: builder.mutation<Venue, CreateVenueRequest>({
      query: (venueData) => ({
        url: '/venues',
        method: 'POST',
        body: venueData,
      }),
      transformResponse: (response: { venue: Venue }) => response.venue,
      invalidatesTags: ['Venue'],
    }),

    updateVenue: builder.mutation<Venue, { id: string; updates: UpdateVenueRequest }>({
      query: ({ id, updates }) => ({
        url: `/venues/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      transformResponse: (response: { venue: Venue }) => response.venue,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Venue', id },
        { type: 'Venue', id: 'LIST' },
      ],
    }),

    deleteVenue: builder.mutation<void, string>({
      query: (id) => ({
        url: `/venues/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Venue', id },
        { type: 'Venue', id: 'LIST' },
      ],
    }),

    // Rooms
    getRooms: builder.query<Room[], { venueId: string }>({
      query: ({ venueId }) => `/venues/${venueId}/rooms`,
      transformResponse: (response: { rooms: Room[] }) => response.rooms,
      providesTags: (result, error, { venueId }) => [
        { type: 'Room', id: 'LIST' },
        { type: 'Room', id: `LIST-${venueId}` },
        ...(result || []).map(({ id }) => ({ type: 'Room' as const, id })),
      ],
    }),

    getRoom: builder.query<Room, { venueId: string; roomId: string }>({
      query: ({ venueId, roomId }) => `/venues/${venueId}/rooms/${roomId}`,
      transformResponse: (response: { room: Room }) => response.room,
      providesTags: (result, error, { roomId }) => [{ type: 'Room', id: roomId }],
    }),

    createRoom: builder.mutation<Room, { venueId: string; roomData: CreateRoomRequest }>({
      query: ({ venueId, roomData }) => ({
        url: `/venues/${venueId}/rooms`,
        method: 'POST',
        body: roomData,
      }),
      transformResponse: (response: { room: Room }) => response.room,
      invalidatesTags: (result, error, { venueId }) => [
        { type: 'Room', id: 'LIST' },
        { type: 'Room', id: `LIST-${venueId}` },
      ],
    }),

    updateRoom: builder.mutation<Room, { venueId: string; roomId: string; updates: UpdateRoomRequest }>({
      query: ({ venueId, roomId, updates }) => ({
        url: `/venues/${venueId}/rooms/${roomId}`,
        method: 'PATCH',
        body: updates,
      }),
      transformResponse: (response: { room: Room }) => response.room,
      invalidatesTags: (result, error, { roomId }) => [
        { type: 'Room', id: roomId },
        { type: 'Room', id: 'LIST' },
      ],
    }),

    deleteRoom: builder.mutation<void, { venueId: string; roomId: string }>({
      query: ({ venueId, roomId }) => ({
        url: `/venues/${venueId}/rooms/${roomId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { venueId, roomId }) => [
        { type: 'Room', id: roomId },
        { type: 'Room', id: 'LIST' },
        { type: 'Room', id: `LIST-${venueId}` },
      ],
    }),

    // Seats
    getSeats: builder.query<Seat[], { venueId: string; roomId: string }>({
      query: ({ venueId, roomId }) => `/venues/${venueId}/rooms/${roomId}/seats`,
      transformResponse: (response: { seats: Seat[] }) => response.seats,
      providesTags: (result, error, { roomId }) => [
        { type: 'Seat', id: 'LIST' },
        { type: 'Seat', id: `LIST-${roomId}` },
        ...(result || []).map(({ id }) => ({ type: 'Seat' as const, id })),
      ],
    }),

    getSeat: builder.query<Seat, { venueId: string; roomId: string; seatId: string }>({
      query: ({ venueId, roomId, seatId }) => `/venues/${venueId}/rooms/${roomId}/seats/${seatId}`,
      transformResponse: (response: { seat: Seat }) => response.seat,
      providesTags: (result, error, { seatId }) => [{ type: 'Seat', id: seatId }],
    }),

    createSeat: builder.mutation<Seat, { venueId: string; roomId: string; seatData: CreateSeatRequest }>({
      query: ({ venueId, roomId, seatData }) => ({
        url: `/venues/${venueId}/rooms/${roomId}/seats`,
        method: 'POST',
        body: seatData,
      }),
      transformResponse: (response: { seat: Seat }) => response.seat,
      invalidatesTags: (result, error, { roomId }) => [
        { type: 'Seat', id: 'LIST' },
        { type: 'Seat', id: `LIST-${roomId}` },
      ],
    }),

    updateSeat: builder.mutation<Seat, { venueId: string; roomId: string; seatId: string; updates: UpdateSeatRequest }>({
      query: ({ venueId, roomId, seatId, updates }) => ({
        url: `/venues/${venueId}/rooms/${roomId}/seats/${seatId}`,
        method: 'PATCH',
        body: updates,
      }),
      transformResponse: (response: { seat: Seat }) => response.seat,
      invalidatesTags: (result, error, { roomId, seatId }) => [
        { type: 'Seat', id: seatId },
        { type: 'Seat', id: 'LIST' },
        { type: 'Seat', id: `LIST-${roomId}` },
      ],
    }),

    deleteSeat: builder.mutation<void, { venueId: string; roomId: string; seatId: string }>({
      query: ({ venueId, roomId, seatId }) => ({
        url: `/venues/${venueId}/rooms/${roomId}/seats/${seatId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { roomId, seatId }) => [
        { type: 'Seat', id: seatId },
        { type: 'Seat', id: 'LIST' },
        { type: 'Seat', id: `LIST-${roomId}` },
      ],
    }),

    // Seat assignments
    assignGuestToSeat: builder.mutation<Seat, { venueId: string; roomId: string; seatId: string; data: AssignGuestToSeatRequest }>({
      query: ({ venueId, roomId, seatId, data }) => ({
        url: `/venues/${venueId}/rooms/${roomId}/seats/${seatId}/assign`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { seat: Seat }) => response.seat,
      invalidatesTags: (result, error, { roomId, seatId }) => [
        { type: 'Seat', id: seatId },
        { type: 'Seat', id: 'LIST' },
        { type: 'Seat', id: `LIST-${roomId}` },
        'Guest',
      ],
    }),

    unassignGuestFromSeat: builder.mutation<Seat, { venueId: string; roomId: string; seatId: string; data: UnassignGuestFromSeatRequest }>({
      query: ({ venueId, roomId, seatId, data }) => ({
        url: `/venues/${venueId}/rooms/${roomId}/seats/${seatId}/unassign`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { seat: Seat }) => response.seat,
      invalidatesTags: (result, error, { roomId, seatId }) => [
        { type: 'Seat', id: seatId },
        { type: 'Seat', id: 'LIST' },
        { type: 'Seat', id: `LIST-${roomId}` },
        'Guest',
      ],
    }),
  }),
});

export const {
  useGetVenuesQuery,
  useGetVenueQuery,
  useCreateVenueMutation,
  useUpdateVenueMutation,
  useDeleteVenueMutation,
  useGetRoomsQuery,
  useGetRoomQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useGetSeatsQuery,
  useGetSeatQuery,
  useCreateSeatMutation,
  useUpdateSeatMutation,
  useDeleteSeatMutation,
  useAssignGuestToSeatMutation,
  useUnassignGuestFromSeatMutation,
} = venuesApi;