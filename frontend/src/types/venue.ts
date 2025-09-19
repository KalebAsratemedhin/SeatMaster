/**
 * Venue related types
 */

import { BaseEntity } from './common';

// Room types
export type RoomType = 'general' | 'ballroom' | 'conference' | 'theater' | 'banquet' | 'outdoor';

// Venue model
export interface Venue extends BaseEntity {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone?: string;
  website?: string;
  owner_id: string;
  owner: any; // User model
  is_public: boolean;
  rooms: Room[];
}

// Room model
export interface Room extends BaseEntity {
  venue_id: string;
  venue: Venue;
  name: string;
  description: string;
  capacity: number;
  floor: number;
  room_type: RoomType;
  seats: Seat[];
}

// Seat categories and status
export type SeatCategory = 'standard' | 'vip' | 'accessible' | 'premium' | 'economy' | 'standing';
export type SeatStatus = 'available' | 'occupied' | 'reserved' | 'blocked' | 'maintenance';

// Seat model
export interface Seat extends BaseEntity {
  event_id: string;
  event: any; // Event model
  room_id: string;
  room: Room;
  row: string;
  number: string;
  column: string;
  category: SeatCategory;
  status: SeatStatus;
  guest_id?: string;
  guest?: any; // Guest model
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

// Request/Response types
export interface CreateVenueRequest {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone?: string;
  website?: string;
  is_public: boolean;
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
  website?: string;
  is_public?: boolean;
}

export interface CreateRoomRequest {
  name: string;
  description: string;
  capacity: number;
  floor: number;
  room_type: RoomType;
}

export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  capacity?: number;
  floor?: number;
  room_type?: RoomType;
}

export interface CreateSeatRequest {
  event_id: string;
  row: string;
  number: string;
  column: string;
  category: SeatCategory;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface UpdateSeatRequest {
  row?: string;
  number?: string;
  column?: string;
  category?: SeatCategory;
  status?: SeatStatus;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
}

export interface AssignGuestToSeatRequest {
  guest_id: string;
}

export interface UnassignGuestFromSeatRequest {
  guest_id: string;
}