/**
 * Venue related types
 */

import { BaseEntity, PaginationParams, BaseFilter } from './common';
import { User } from './auth';

// Venue model
export interface Venue extends BaseEntity {
  name: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  capacity?: number;
  owner_id: string;
  owner: User;
  rooms: Room[];
}

// Room model
export interface Room extends BaseEntity {
  venue_id: string;
  venue: Venue;
  name: string;
  description?: string;
  type: RoomType;
  capacity?: number;
  layout_data?: string; // JSON string for layout configuration
  seats: Seat[];
}

// Room types
export type RoomType = 'auditorium' | 'conference' | 'banquet' | 'outdoor' | 'custom';

// Seat model
export interface Seat extends BaseEntity {
  room_id: string;
  room: Room;
  row: string;
  number: string;
  category: SeatCategory;
  status: SeatStatus;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
}

// Seat categories and status
export type SeatCategory = 'standard' | 'vip' | 'premium' | 'accessible' | 'reserved';
export type SeatStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

// Venue request/response types
export interface CreateVenueRequest {
  name: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  capacity?: number;
}

export interface UpdateVenueRequest {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  capacity?: number;
}

export type VenueResponse = Venue;

export interface VenuesResponse {
  venues: Venue[];
  total: number;
}

// Room request/response types
export interface CreateRoomRequest {
  name: string;
  description?: string;
  type: RoomType;
  capacity?: number;
  layout_data?: string;
}

export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  type?: RoomType;
  capacity?: number;
  layout_data?: string;
}

export type RoomResponse = Room;

export interface RoomsResponse {
  rooms: Room[];
  total: number;
}

// Seat request/response types
export interface CreateSeatRequest {
  row: string;
  number: string;
  category: SeatCategory;
  status?: SeatStatus;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
}

export interface UpdateSeatRequest {
  row?: string;
  number?: string;
  category?: SeatCategory;
  status?: SeatStatus;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
}

export type SeatResponse = Seat;

export interface SeatsResponse {
  seats: Seat[];
  total: number;
}

// Filters
export interface VenueFilters extends BaseFilter, PaginationParams {
  owner_id?: string;
  city?: string;
  state?: string;
  country?: string;
  has_rooms?: boolean;
  min_capacity?: number;
  max_capacity?: number;
}

export interface RoomFilters extends BaseFilter, PaginationParams {
  venue_id?: string;
  type?: RoomType;
  min_capacity?: number;
  max_capacity?: number;
}

export interface SeatFilters extends BaseFilter, PaginationParams {
  room_id?: string;
  category?: SeatCategory;
  status?: SeatStatus;
  row?: string;
}

// Venue statistics
export interface VenueStats {
  total_venues: number;
  total_rooms: number;
  total_seats: number;
  available_seats: number;
  occupied_seats: number;
  venue_capacity_utilization: number;
}
